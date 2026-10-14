import { 
  PatientRecord, 
  OfflineSyncQueueItem, 
  VitalsEntry, 
  ClinicalEncounter,
  DoctorNote,
  DigitalPrescription,
  PharmacyInventoryItem,
  PharmacyStockMovement,
  LabReport,
  LabTestParameter,
  PatientAppointment,
  LabCategory,
  AppointmentStatus,
  AppointmentClinic
} from '../types';
import { INITIAL_PATIENTS } from '../data/mockData';
import { INITIAL_PHARMACY_INVENTORY } from '../data/pharmacySeed';
import { SEED_LAB_REPORTS, SEED_APPOINTMENTS, getTodayDateStr } from '../data/labAndAppointmentSeed';

const CACHE_KEY = 'nhfs_patients_cache_v2';
const QUEUE_KEY = 'nhfs_offline_queue_v2';
const SIMULATE_OFFLINE_KEY = 'nhfs_simulate_offline_v2';
const LAST_SYNC_KEY = 'nhfs_last_sync_v2';
const APPOINTMENTS_CACHE_KEY = 'nhfs_appointments_cache_v2';

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToStorage(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

// Check if currently simulated offline or actually offline
export function isSimulatedOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIMULATE_OFFLINE_KEY) === 'true';
}

export function setSimulatedOffline(val: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SIMULATE_OFFLINE_KEY, val ? 'true' : 'false');
  notifyListeners();
}

export function isDeviceOnline(): boolean {
  if (typeof window === 'undefined') return true;
  if (isSimulatedOffline()) return false;
  return window.navigator.onLine;
}

// Local cache management
export function getLocalPatients(): PatientRecord[] {
  if (typeof window === 'undefined') return INITIAL_PATIENTS;
  let list: PatientRecord[] = INITIAL_PATIENTS;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read local cache:', err);
  }

  // Ensure patients have labReports and appointments populated if missing
  let needsSave = false;
  list = list.map((p) => {
    let labReports = p.labReports;
    if (!labReports || labReports.length === 0) {
      if (SEED_LAB_REPORTS[p.id]) {
        labReports = SEED_LAB_REPORTS[p.id];
        needsSave = true;
      } else {
        labReports = [];
      }
    }

    let appointments = p.appointments;
    if (!appointments || appointments.length === 0) {
      const pApts = SEED_APPOINTMENTS.filter((a) => a.patientId === p.id);
      if (pApts.length > 0) {
        appointments = pApts;
        needsSave = true;
      } else {
        appointments = [];
      }
    }

    return {
      ...p,
      labReports,
      appointments,
    };
  });

  if (needsSave || !localStorage.getItem(CACHE_KEY)) {
    saveLocalPatients(list);
  }
  return list;
}

export function saveLocalPatients(patients: PatientRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(patients));
  } catch (err) {
    console.error('Failed to write to local cache:', err);
  }
}

// Queue management
export function getOfflineQueue(): OfflineSyncQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // empty
  }
  return [];
}

export function saveOfflineQueue(queue: OfflineSyncQueueItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // empty
  }
}

export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

// Add an item to offline sync queue
function enqueueAction(action: OfflineSyncQueueItem['action'], patientId: string, payload: any) {
  const queue = getOfflineQueue();
  queue.push({
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action,
    patientId,
    timestamp: new Date().toISOString(),
    payload,
    retryCount: 0,
  });
  saveOfflineQueue(queue);
  notifyListeners();
}

// ----------------------------------------------------
// PATIENT ACTIONS (Offline-first)
// ----------------------------------------------------

export async function createPatient(patientData: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'synced' | 'syncVersion'>): Promise<PatientRecord> {
  const currentYear = new Date().getFullYear();
  const existing = getLocalPatients();
  const folderNo = patientData.folderNumber || `GH-REC/${currentYear}/${String(existing.length + 1).padStart(4, '0')}`;

  const newPatient: PatientRecord = {
    ...patientData,
    id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    folderNumber: folderNo,
    vitalsHistory: patientData.vitalsHistory || [],
    encounters: patientData.encounters || [],
    paperScanImages: patientData.paperScanImages || [],
    allergies: patientData.allergies || [],
    chronicConditions: patientData.chronicConditions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: false,
    syncVersion: 1,
  };

  // 1. Immediately update local storage
  const updatedList = [newPatient, ...existing];
  saveLocalPatients(updatedList);
  notifyListeners();

  // 2. If online, attempt server post, otherwise queue
  if (isDeviceOnline()) {
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPatient),
      });
      if (res.ok) {
        const saved = await res.json();
        newPatient.synced = true;
        saveLocalPatients(
          getLocalPatients().map((p) => (p.id === newPatient.id ? { ...p, synced: true } : p))
        );
        notifyListeners();
        return saved.data;
      }
    } catch {
      // Server down, queue for later sync
    }
  }

  // Queue offline
  enqueueAction('create_patient', newPatient.id, newPatient);
  return newPatient;
}

export async function updatePatient(patient: PatientRecord): Promise<PatientRecord> {
  const updated: PatientRecord = {
    ...patient,
    updatedAt: new Date().toISOString(),
    synced: false,
    syncVersion: (patient.syncVersion || 0) + 1,
  };

  const list = getLocalPatients().map((p) => (p.id === patient.id ? updated : p));
  saveLocalPatients(list);
  notifyListeners();

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const result = await res.json();
        updated.synced = true;
        saveLocalPatients(
          getLocalPatients().map((p) => (p.id === patient.id ? { ...p, synced: true } : p))
        );
        notifyListeners();
        return result.data;
      }
    } catch {
      // Server down
    }
  }

  enqueueAction('update_patient', patient.id, updated);
  return updated;
}

export async function deletePatientRecord(patientId: string): Promise<void> {
  const list = getLocalPatients().filter((p) => p.id !== patientId);
  saveLocalPatients(list);
  notifyListeners();

  if (isDeviceOnline()) {
    try {
      await fetch(`/api/patients/${patientId}`, { method: 'DELETE' });
      return;
    } catch {
      // ignore
    }
  }
  enqueueAction('delete_patient', patientId, { id: patientId });
}

export async function logPatientVitals(patientId: string, vitalsData: Omit<VitalsEntry, 'id' | 'patientId' | 'recordedAt'>): Promise<VitalsEntry> {
  const vitals: VitalsEntry = {
    ...vitalsData,
    id: `vit-${Date.now()}`,
    patientId,
    recordedAt: new Date().toISOString(),
  };

  const list = getLocalPatients();
  const patient = list.find((p) => p.id === patientId);
  if (patient) {
    patient.vitalsHistory = [vitals, ...(patient.vitalsHistory || [])];
    patient.updatedAt = new Date().toISOString();
    patient.synced = false;
    patient.syncVersion = (patient.syncVersion || 0) + 1;
    saveLocalPatients(list);
    notifyListeners();
  }

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/patients/${patientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vitals),
      });
      if (res.ok) {
        if (patient) patient.synced = true;
        saveLocalPatients(list);
        notifyListeners();
        return vitals;
      }
    } catch {
      // queue
    }
  }

  enqueueAction('add_vitals', patientId, { patientId, vitals });
  return vitals;
}

export async function logClinicalEncounter(patientId: string, encounterData: Omit<ClinicalEncounter, 'id' | 'patientId'>): Promise<ClinicalEncounter> {
  const encounter: ClinicalEncounter = {
    ...encounterData,
    id: `enc-${Date.now()}`,
    patientId,
  };

  const list = getLocalPatients();
  const patient = list.find((p) => p.id === patientId);
  if (patient) {
    patient.encounters = [encounter, ...(patient.encounters || [])];
    patient.updatedAt = new Date().toISOString();
    patient.synced = false;
    patient.syncVersion = (patient.syncVersion || 0) + 1;
    saveLocalPatients(list);
    notifyListeners();
  }

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/patients/${patientId}/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encounter),
      });
      if (res.ok) {
        if (patient) patient.synced = true;
        saveLocalPatients(list);
        notifyListeners();
        return encounter;
      }
    } catch {
      // queue
    }
  }

  enqueueAction('add_encounter', patientId, { patientId, encounter });
  return encounter;
}

export async function dispensePrescription(patientId: string, rxId: string): Promise<void> {
  const list = getLocalPatients();
  const patient = list.find((p) => p.id === patientId);
  if (patient && patient.encounters) {
    for (const enc of patient.encounters) {
      for (const rx of enc.prescriptions) {
        if (rx.id === rxId) {
          rx.dispensed = true;
        }
      }
    }
    patient.updatedAt = new Date().toISOString();
    patient.synced = false;
    saveLocalPatients(list);
    notifyListeners();
  }

  if (isDeviceOnline()) {
    try {
      await fetch(`/api/patients/${patientId}/prescriptions/${rxId}/dispense`, { method: 'PUT' });
      if (patient) patient.synced = true;
      saveLocalPatients(list);
      notifyListeners();
    } catch {
      // local update retained
    }
  }
}

// ----------------------------------------------------
// DOCTOR'S NOTES ACTIONS
// ----------------------------------------------------
export async function createDoctorNote(
  patientId: string, 
  noteData: Omit<DoctorNote, 'id' | 'patientId' | 'createdAt' | 'folderNumber' | 'patientName'>
): Promise<DoctorNote> {
  const list = getLocalPatients();
  const patient = list.find((p) => p.id === patientId);

  const note: DoctorNote = {
    ...noteData,
    id: `note-${Date.now()}`,
    patientId,
    folderNumber: patient?.folderNumber || '',
    patientName: patient ? `${patient.surname}, ${patient.firstName}` : '',
    createdAt: new Date().toISOString(),
  };

  if (patient) {
    patient.doctorNotes = [note, ...(patient.doctorNotes || [])];
    patient.updatedAt = new Date().toISOString();
    patient.synced = false;
    patient.syncVersion = (patient.syncVersion || 0) + 1;
    saveLocalPatients(list);
    notifyListeners();
  }

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/patients/${patientId}/doctor-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (res.ok) {
        if (patient) patient.synced = true;
        saveLocalPatients(list);
        notifyListeners();
        return note;
      }
    } catch {
      // queue offline
    }
  }

  enqueueAction('add_doctor_note' as any, patientId, { patientId, note });
  return note;
}

// ----------------------------------------------------
// DIGITAL PRESCRIPTIONS ACTIONS
// ----------------------------------------------------
export async function createDigitalPrescription(
  patientId: string,
  rxData: Omit<DigitalPrescription, 'id' | 'prescriptionNumber' | 'patientId' | 'patientName' | 'patientFolderNumber' | 'createdAt' | 'status'>
): Promise<DigitalPrescription> {
  const list = getLocalPatients();
  const patient = list.find((p) => p.id === patientId);

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const prescriptionNumber = `RX-NG-${new Date().getFullYear()}-${randomDigits}`;

  let patientAge: number | undefined;
  if (patient?.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    patientAge = new Date().getFullYear() - birthYear;
  }

  const prescription: DigitalPrescription = {
    ...rxData,
    id: `rx-${Date.now()}`,
    prescriptionNumber,
    patientId,
    patientName: patient ? `${patient.surname}, ${patient.firstName}` : 'Patient',
    patientFolderNumber: patient?.folderNumber || 'N/A',
    patientAge,
    patientGender: patient?.gender,
    patientGenotype: patient?.genotype,
    patientAllergies: patient?.allergies || [],
    createdAt: new Date().toISOString(),
    status: 'Pending',
    medications: rxData.medications.map((m, idx) => ({
      ...m,
      id: m.id || `med-${Date.now()}-${idx}`,
      dispensed: false,
    })),
  };

  if (patient) {
    patient.digitalPrescriptions = [prescription, ...(patient.digitalPrescriptions || [])];
    patient.updatedAt = new Date().toISOString();
    patient.synced = false;
    patient.syncVersion = (patient.syncVersion || 0) + 1;
    saveLocalPatients(list);
    notifyListeners();
  }

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/patients/${patientId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescription),
      });
      if (res.ok) {
        if (patient) patient.synced = true;
        saveLocalPatients(list);
        notifyListeners();
        return prescription;
      }
    } catch {
      // queue offline
    }
  }

  enqueueAction('create_prescription' as any, patientId, { patientId, prescription });
  return prescription;
}

// ----------------------------------------------------
// PHARMACY INVENTORY CLIENT ACTIONS
// ----------------------------------------------------
const PHARMACY_CACHE_KEY = 'nhfs_pharmacy_cache_v2';

export function getLocalPharmacyInventory(): PharmacyInventoryItem[] {
  if (typeof window === 'undefined') return INITIAL_PHARMACY_INVENTORY;
  try {
    const raw = localStorage.getItem(PHARMACY_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  saveLocalPharmacyInventory(INITIAL_PHARMACY_INVENTORY);
  return INITIAL_PHARMACY_INVENTORY;
}

export function saveLocalPharmacyInventory(inventory: PharmacyInventoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PHARMACY_CACHE_KEY, JSON.stringify(inventory));
    notifyListeners();
  } catch {}
}

export async function fetchPharmacyInventory(): Promise<{
  items: PharmacyInventoryItem[];
  totalItems: number;
  lowStockCount: number;
  criticalCount: number;
  lowStockAlerts: PharmacyInventoryItem[];
}> {
  if (isDeviceOnline()) {
    try {
      const res = await fetch('/api/pharmacy/inventory');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          saveLocalPharmacyInventory(data.items);
          return data;
        }
      }
    } catch (e) {
      console.warn('Using local pharmacy inventory cache');
    }
  }

  const items = getLocalPharmacyInventory();
  const lowStockAlerts = items.filter((item) => item.quantityInStock <= item.reorderLevel);
  const criticalStock = items.filter((item) => item.quantityInStock <= Math.ceil(item.reorderLevel * 0.4));
  return {
    items,
    totalItems: items.length,
    lowStockCount: lowStockAlerts.length,
    criticalCount: criticalStock.length,
    lowStockAlerts,
  };
}

export async function addPharmacyInventoryItem(itemData: Omit<PharmacyInventoryItem, 'id' | 'lastRestockedAt'>): Promise<PharmacyInventoryItem> {
  const localItems = getLocalPharmacyInventory();
  let savedItem: PharmacyInventoryItem;

  const existingIdx = localItems.findIndex(
    (i) => i.drugName.toLowerCase() === itemData.drugName.toLowerCase() && i.batchNumber === itemData.batchNumber
  );

  if (existingIdx >= 0) {
    localItems[existingIdx].quantityInStock += itemData.quantityInStock;
    localItems[existingIdx].lastRestockedAt = new Date().toISOString();
    savedItem = localItems[existingIdx];
  } else {
    savedItem = {
      ...itemData,
      id: `inv-${Date.now()}`,
      lastRestockedAt: new Date().toISOString(),
    };
    localItems.unshift(savedItem);
  }

  saveLocalPharmacyInventory(localItems);

  if (isDeviceOnline()) {
    try {
      const res = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) return json.data;
      }
    } catch (e) {
      console.warn('Offline stock update queued locally');
    }
  }

  return savedItem;
}

export async function dispensePrescriptionWithInventory(
  patientId: string,
  prescriptionId: string,
  items: Array<{ inventoryItemId?: string; drugName: string; quantity: number }>,
  dispensedBy: string = 'Dispensary Pharmacist'
): Promise<{ success: boolean; message: string; lowStockWarnings: string[] }> {
  // Update local patient and inventory immediately
  const patients = getLocalPatients();
  const patient = patients.find((p) => p.id === patientId);
  const inventory = getLocalPharmacyInventory();
  const lowStockWarnings: string[] = [];

  if (patient?.digitalPrescriptions) {
    const rx = patient.digitalPrescriptions.find((r) => r.id === prescriptionId);
    if (rx) {
      rx.status = 'Dispensed';
      rx.dispensedAt = new Date().toISOString();
      rx.dispensedBy = dispensedBy;
      rx.medications.forEach((m) => (m.dispensed = true));
    }
  }

  // Deduct inventory
  for (const it of items) {
    const match = inventory.find(
      (inv) =>
        inv.id === it.inventoryItemId ||
        inv.drugName.toLowerCase().includes(it.drugName.toLowerCase()) ||
        it.drugName.toLowerCase().includes(inv.drugName.toLowerCase())
    );
    if (match) {
      match.quantityInStock = Math.max(0, match.quantityInStock - (it.quantity || 1));
      if (match.quantityInStock <= match.reorderLevel) {
        lowStockWarnings.push(`Low Stock Alert: ${match.drugName} is down to ${match.quantityInStock} ${match.unit}`);
      }
    }
  }

  saveLocalPatients(patients);
  saveLocalPharmacyInventory(inventory);
  notifyListeners();

  if (isDeviceOnline()) {
    try {
      const res = await fetch('/api/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          prescriptionId,
          items,
          dispensedBy,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'Prescription dispensed and inventory updated',
          lowStockWarnings: data.lowStockWarnings || lowStockWarnings,
        };
      }
    } catch (e) {
      console.warn('Dispense synced locally offline');
    }
  }

  return {
    success: true,
    message: 'Prescription marked as dispensed (Local Offline Cache)',
    lowStockWarnings,
  };
}

// ----------------------------------------------------
// FULL CLOUD SYNCHRONIZATION ENGINE
// ----------------------------------------------------
export interface SyncResult {
  success: boolean;
  syncedActionsCount: number;
  conflicts: string[];
  totalRecords: number;
  error?: string;
}

export async function syncWithCloud(): Promise<SyncResult> {
  if (!isDeviceOnline()) {
    return {
      success: false,
      syncedActionsCount: 0,
      conflicts: [],
      totalRecords: getLocalPatients().length,
      error: 'Device is offline or offline simulation is enabled.',
    };
  }

  const queue = getOfflineQueue();
  const lastSync = getLastSyncTime();

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientQueue: queue,
        lastClientSyncTimestamp: lastSync,
      }),
    });

    if (!res.ok) {
      throw new Error(`Cloud server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.serverPatients)) {
      // Clear processed queue actions
      const appliedSet = new Set(data.appliedActionIds || []);
      const remainingQueue = queue.filter((item) => !appliedSet.has(item.id));
      saveOfflineQueue(remainingQueue);

      // Merge server patients
      saveLocalPatients(data.serverPatients);
      localStorage.setItem(LAST_SYNC_KEY, data.serverTimestamp || new Date().toISOString());

      notifyListeners();

      return {
        success: true,
        syncedActionsCount: appliedSet.size,
        conflicts: data.conflicts || [],
        totalRecords: data.serverPatients.length,
      };
    } else {
      throw new Error(data.error || 'Failed to sync with cloud');
    }
  } catch (err: any) {
    console.warn('Sync failed:', err);
    return {
      success: false,
      syncedActionsCount: 0,
      conflicts: [],
      totalRecords: getLocalPatients().length,
      error: err.message || 'Network communication error',
    };
  }
}

// Initial fetch on app boot
export async function bootstrapCloudData(): Promise<void> {
  if (!isDeviceOnline()) return;
  try {
    const res = await fetch('/api/patients');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        // If local has no pending queue, adopt server data
        const queue = getOfflineQueue();
        if (queue.length === 0) {
          saveLocalPatients(json.data);
          localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
          notifyListeners();
        } else {
          // Sync queue
          await syncWithCloud();
        }
      }
    }
  } catch (e) {
    console.log('Bootstrap fetch skipped, using offline cache');
  }
}

// ----------------------------------------------------
// APPOINTMENTS STORAGE & API (Offline-first)
// ----------------------------------------------------

export function getLocalAppointments(): PatientAppointment[] {
  if (typeof window === 'undefined') return SEED_APPOINTMENTS;
  try {
    const raw = localStorage.getItem(APPOINTMENTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read local appointments cache:', err);
  }
  saveLocalAppointments(SEED_APPOINTMENTS);
  return SEED_APPOINTMENTS;
}

export function saveLocalAppointments(apts: PatientAppointment[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(APPOINTMENTS_CACHE_KEY, JSON.stringify(apts));
  } catch (err) {
    console.error('Failed to write local appointments cache:', err);
  }
}

export async function getAppointments(filters?: { date?: string; clinic?: string; patientId?: string; status?: string }): Promise<PatientAppointment[]> {
  if (isDeviceOnline()) {
    try {
      const params = new URLSearchParams();
      if (filters?.date) params.append('date', filters.date);
      if (filters?.clinic) params.append('clinic', filters.clinic);
      if (filters?.patientId) params.append('patientId', filters.patientId);
      if (filters?.status) params.append('status', filters.status);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Update local cache if fetching all
          if (!filters || Object.keys(filters).length === 0) {
            saveLocalAppointments(json.data);
          }
          return json.data;
        }
      }
    } catch {
      // fallback to local
    }
  }

  let list = getLocalAppointments();
  if (filters?.date) {
    list = list.filter((a) => a.appointmentDate === filters.date);
  }
  if (filters?.clinic) {
    list = list.filter((a) => a.clinic === filters.clinic);
  }
  if (filters?.patientId) {
    list = list.filter((a) => a.patientId === filters.patientId);
  }
  if (filters?.status) {
    list = list.filter((a) => a.status === filters.status);
  }

  list.sort((a, b) => {
    if (a.appointmentDate !== b.appointmentDate) {
      return a.appointmentDate.localeCompare(b.appointmentDate);
    }
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  return list;
}

export async function bookAppointment(
  data: Omit<PatientAppointment, 'id' | 'createdAt' | 'status'>
): Promise<PatientAppointment> {
  const newAppointment: PatientAppointment = {
    ...data,
    id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    status: 'Scheduled',
    createdAt: new Date().toISOString(),
  };

  // 1. Update local appointments
  const localApts = [newAppointment, ...getLocalAppointments()];
  saveLocalAppointments(localApts);

  // 2. Link to local patient if present
  const patients = getLocalPatients();
  const patient = patients.find((p) => p.id === data.patientId || p.folderNumber === data.patientFolderNumber);
  if (patient) {
    patient.appointments = [newAppointment, ...(patient.appointments || [])];
    patient.updatedAt = new Date().toISOString();
    saveLocalPatients(patients);
  }
  notifyListeners();

  // 3. Post to server if online
  if (isDeviceOnline()) {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // server down
    }
  }

  return newAppointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  extras?: Partial<PatientAppointment>
): Promise<PatientAppointment> {
  const localApts = getLocalAppointments();
  const existing = localApts.find((a) => a.id === appointmentId);
  if (!existing) {
    throw new Error('Appointment not found');
  }

  let checkedInAt = existing.checkedInAt;
  let completedAt = existing.completedAt;
  if (status === 'Checked-In' && !checkedInAt) {
    checkedInAt = new Date().toISOString();
  }
  if (status === 'Completed' && !completedAt) {
    completedAt = new Date().toISOString();
  }

  const updated: PatientAppointment = {
    ...existing,
    status,
    ...extras,
    checkedInAt,
    completedAt,
  };

  const updatedApts = localApts.map((a) => (a.id === appointmentId ? updated : a));
  saveLocalAppointments(updatedApts);

  // Also update in patient appointments
  const patients = getLocalPatients();
  const patient = patients.find((p) => p.id === updated.patientId);
  if (patient && patient.appointments) {
    patient.appointments = patient.appointments.map((a) => (a.id === appointmentId ? updated : a));
    patient.updatedAt = new Date().toISOString();
    saveLocalPatients(patients);
  }
  notifyListeners();

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // server down
    }
  }

  return updated;
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const localApts = getLocalAppointments().filter((a) => a.id !== appointmentId);
  saveLocalAppointments(localApts);

  const patients = getLocalPatients();
  patients.forEach((p) => {
    if (p.appointments) {
      p.appointments = p.appointments.filter((a) => a.id !== appointmentId);
    }
  });
  saveLocalPatients(patients);
  notifyListeners();

  if (isDeviceOnline()) {
    try {
      await fetch(`/api/appointments/${appointmentId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  }
}

// ----------------------------------------------------
// LABORATORY REPORTS (Offline-first)
// ----------------------------------------------------

export function getPatientLabReports(patientId: string): LabReport[] {
  const patient = getLocalPatients().find((p) => p.id === patientId);
  return patient?.labReports || [];
}

export function getAllHospitalLabReports(category?: string, status?: string, search?: string): LabReport[] {
  const patients = getLocalPatients();
  const allReports: LabReport[] = [];
  patients.forEach((p) => {
    if (p.labReports) {
      allReports.push(...p.labReports);
    }
  });

  let result = allReports;
  if (category && category !== 'All') {
    result = result.filter((r) => r.category === category);
  }
  if (status && status !== 'All') {
    result = result.filter((r) => r.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (r) =>
        r.testName.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.patientFolderNumber.toLowerCase().includes(q) ||
        (r.findingsOrImpression && r.findingsOrImpression.toLowerCase().includes(q))
    );
  }

  result.sort((a, b) => new Date(b.reportDate || b.createdAt).getTime() - new Date(a.reportDate || a.createdAt).getTime());
  return result;
}

export async function addPatientLabReport(
  patientId: string,
  reportData: Omit<LabReport, 'id' | 'patientId' | 'patientName' | 'patientFolderNumber' | 'createdAt'>
): Promise<LabReport> {
  const patients = getLocalPatients();
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const newReport: LabReport = {
    ...reportData,
    id: `lab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    patientId,
    patientName: `${patient.surname}, ${patient.firstName} ${patient.otherNames || ''}`.trim(),
    patientFolderNumber: patient.folderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  patient.labReports = [newReport, ...(patient.labReports || [])];
  patient.updatedAt = new Date().toISOString();
  saveLocalPatients(patients);
  notifyListeners();

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/patients/${patientId}/lab-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // offline
    }
  }

  return newReport;
}

export async function updateLabReport(reportId: string, updates: Partial<LabReport>): Promise<LabReport> {
  const patients = getLocalPatients();
  let foundReport: LabReport | null = null;

  for (const patient of patients) {
    if (patient.labReports) {
      const idx = patient.labReports.findIndex((r) => r.id === reportId);
      if (idx !== -1) {
        patient.labReports[idx] = {
          ...patient.labReports[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        foundReport = patient.labReports[idx];
        patient.updatedAt = new Date().toISOString();
        break;
      }
    }
  }

  if (!foundReport) {
    throw new Error('Laboratory report not found');
  }

  saveLocalPatients(patients);
  notifyListeners();

  if (isDeviceOnline()) {
    try {
      const res = await fetch(`/api/lab-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {
      // offline
    }
  }

  return foundReport;
}
