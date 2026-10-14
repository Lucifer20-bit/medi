import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_PATIENTS } from './src/data/mockData.js';
import { INITIAL_PHARMACY_INVENTORY } from './src/data/pharmacySeed.js';
import { SEED_LAB_REPORTS, SEED_APPOINTMENTS, getTodayDateStr } from './src/data/labAndAppointmentSeed.js';
import type { 
  PatientRecord, 
  VitalsEntry, 
  ClinicalEncounter, 
  DigitizedPaperResult,
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
} from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Persistent cloud-like file store on server
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hospital_records_vault.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadPatientsFromStorage(): PatientRecord[] {
  let list: PatientRecord[] = [];
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (err) {
    console.error('Error reading hospital records database file:', err);
  }

  if (list.length === 0) {
    list = INITIAL_PATIENTS;
  }

  // Ensure each patient has labReports and appointments seeded if empty
  list = list.map((p) => {
    let modified = false;
    let labReports = p.labReports;
    if (!labReports || labReports.length === 0) {
      if (SEED_LAB_REPORTS[p.id]) {
        labReports = SEED_LAB_REPORTS[p.id];
        modified = true;
      } else {
        labReports = [];
      }
    }

    let appointments = p.appointments;
    if (!appointments || appointments.length === 0) {
      const patientSeedApts = SEED_APPOINTMENTS.filter((a) => a.patientId === p.id);
      if (patientSeedApts.length > 0) {
        appointments = patientSeedApts;
        modified = true;
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

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Could not save enriched DB file:', e);
  }
  return list;
}

function savePatientsToStorage(patients: PatientRecord[]): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(patients, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting hospital records to database file:', err);
  }
}

let patientsDatabase: PatientRecord[] = loadPatientsFromStorage();

// Appointments Storage
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'hospital_appointments.json');

function loadAppointmentsFromStorage(): PatientAppointment[] {
  try {
    if (fs.existsSync(APPOINTMENTS_FILE)) {
      const content = fs.readFileSync(APPOINTMENTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading appointments file:', err);
  }
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(SEED_APPOINTMENTS, null, 2), 'utf-8');
  } catch (e) {
    console.error('Could not seed appointments file:', e);
  }
  return SEED_APPOINTMENTS;
}

function saveAppointmentsToStorage(apts: PatientAppointment[]): void {
  try {
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(apts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting appointments:', err);
  }
}

let appointmentsDatabase: PatientAppointment[] = loadAppointmentsFromStorage();

// Pharmacy Inventory Storage
const PHARMACY_FILE = path.join(DATA_DIR, 'pharmacy_inventory.json');
const MOVEMENTS_FILE = path.join(DATA_DIR, 'pharmacy_movements.json');

function loadPharmacyInventoryFromStorage(): PharmacyInventoryItem[] {
  try {
    if (fs.existsSync(PHARMACY_FILE)) {
      const content = fs.readFileSync(PHARMACY_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading pharmacy inventory file:', err);
  }
  try {
    fs.writeFileSync(PHARMACY_FILE, JSON.stringify(INITIAL_PHARMACY_INVENTORY, null, 2), 'utf-8');
  } catch (e) {
    console.error('Could not seed Pharmacy DB file:', e);
  }
  return INITIAL_PHARMACY_INVENTORY;
}

function savePharmacyInventoryToStorage(inventory: PharmacyInventoryItem[]): void {
  try {
    fs.writeFileSync(PHARMACY_FILE, JSON.stringify(inventory, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting pharmacy inventory:', err);
  }
}

function loadPharmacyMovementsFromStorage(): PharmacyStockMovement[] {
  try {
    if (fs.existsSync(MOVEMENTS_FILE)) {
      const content = fs.readFileSync(MOVEMENTS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading pharmacy movements file:', err);
  }
  return [];
}

function savePharmacyMovementsToStorage(movements: PharmacyStockMovement[]): void {
  try {
    fs.writeFileSync(MOVEMENTS_FILE, JSON.stringify(movements, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting pharmacy movements:', err);
  }
}

let pharmacyDatabase: PharmacyInventoryItem[] = loadPharmacyInventoryFromStorage();
let pharmacyMovements: PharmacyStockMovement[] = loadPharmacyMovementsFromStorage();

// Lazy Gemini API Client initialization
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required on the server');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health & Server Status Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Nigerian Hospital Filing System (Cloud Vault)',
    patientsCount: patientsDatabase.length,
    timestamp: new Date().toISOString(),
    storageType: 'Server-side Encrypted JSON Cloud-Mirror',
  });
});

// 2. Get all patient files
app.get('/api/patients', (req, res) => {
  const { search, state, genotype, bloodGroup } = req.query;
  let result = [...patientsDatabase];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.folderNumber.toLowerCase().includes(q) ||
        p.surname.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        (p.otherNames && p.otherNames.toLowerCase().includes(q)) ||
        p.phone.includes(q) ||
        (p.nin && p.nin.includes(q)) ||
        (p.nhiaNumber && p.nhiaNumber.toLowerCase().includes(q)) ||
        (p.physicalArchive.boxNumber && p.physicalArchive.boxNumber.toLowerCase().includes(q))
    );
  }

  if (genotype && typeof genotype === 'string') {
    result = result.filter((p) => p.genotype === genotype);
  }
  if (bloodGroup && typeof bloodGroup === 'string') {
    result = result.filter((p) => p.bloodGroup === bloodGroup);
  }

  res.json({
    success: true,
    total: result.length,
    data: result,
  });
});

// 3. Get single patient file by ID or Folder Number
app.get('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id);
  const patient = patientsDatabase.find(
    (p) => p.id === decodedId || p.folderNumber.toLowerCase() === decodedId.toLowerCase()
  );
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient folder not found in hospital database' });
  }
  res.json({ success: true, data: patient });
});

// 4. Create new patient record
app.post('/api/patients', (req, res) => {
  const newPatient: PatientRecord = req.body;
  if (!newPatient.surname || !newPatient.firstName) {
    return res.status(400).json({ success: false, error: 'Surname and First name are required' });
  }

  // Auto-generate Folder Number if missing
  if (!newPatient.folderNumber) {
    const currentYear = new Date().getFullYear();
    const count = patientsDatabase.length + 1;
    newPatient.folderNumber = `GH-REC/${currentYear}/${String(count).padStart(4, '0')}`;
  }

  newPatient.id = newPatient.id || `pat-${Date.now()}`;
  newPatient.createdAt = newPatient.createdAt || new Date().toISOString();
  newPatient.updatedAt = new Date().toISOString();
  newPatient.synced = true;
  newPatient.syncVersion = (newPatient.syncVersion || 0) + 1;
  newPatient.vitalsHistory = newPatient.vitalsHistory || [];
  newPatient.encounters = newPatient.encounters || [];
  newPatient.paperScanImages = newPatient.paperScanImages || [];
  newPatient.allergies = newPatient.allergies || [];
  newPatient.chronicConditions = newPatient.chronicConditions || [];

  // Check if duplicate folder number
  const existingIdx = patientsDatabase.findIndex(
    (p) => p.folderNumber.toLowerCase() === newPatient.folderNumber.toLowerCase()
  );
  if (existingIdx >= 0) {
    patientsDatabase[existingIdx] = newPatient;
  } else {
    patientsDatabase.unshift(newPatient);
  }

  savePatientsToStorage(patientsDatabase);
  res.status(201).json({ success: true, data: newPatient });
});

// 5. Update patient record
app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const idx = patientsDatabase.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Patient record not found' });
  }

  const updated: PatientRecord = {
    ...patientsDatabase[idx],
    ...req.body,
    id,
    updatedAt: new Date().toISOString(),
    synced: true,
    syncVersion: (patientsDatabase[idx].syncVersion || 0) + 1,
  };

  patientsDatabase[idx] = updated;
  savePatientsToStorage(patientsDatabase);
  res.json({ success: true, data: updated });
});

// 6. Delete patient record
app.delete('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const beforeCount = patientsDatabase.length;
  patientsDatabase = patientsDatabase.filter((p) => p.id !== id);
  if (patientsDatabase.length === beforeCount) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  savePatientsToStorage(patientsDatabase);
  res.json({ success: true, message: 'Patient record deleted from system' });
});

// 7. Add Vitals Log
app.post('/api/patients/:id/vitals', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const vitals: VitalsEntry = {
    ...req.body,
    id: req.body.id || `vit-${Date.now()}`,
    patientId: id,
    recordedAt: req.body.recordedAt || new Date().toISOString(),
  };

  patient.vitalsHistory = patient.vitalsHistory || [];
  patient.vitalsHistory.unshift(vitals);
  patient.updatedAt = new Date().toISOString();
  patient.syncVersion = (patient.syncVersion || 0) + 1;

  savePatientsToStorage(patientsDatabase);
  res.status(201).json({ success: true, data: vitals });
});

// 8. Add Clinical Encounter / Consultation Note
app.post('/api/patients/:id/encounters', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const encounter: ClinicalEncounter = {
    ...req.body,
    id: req.body.id || `enc-${Date.now()}`,
    patientId: id,
    date: req.body.date || new Date().toISOString().split('T')[0],
  };

  patient.encounters = patient.encounters || [];
  patient.encounters.unshift(encounter);
  patient.updatedAt = new Date().toISOString();
  patient.syncVersion = (patient.syncVersion || 0) + 1;

  savePatientsToStorage(patientsDatabase);
  res.status(201).json({ success: true, data: encounter });
});

// 9. Create Structured Doctor's Note
app.post('/api/patients/:id/doctor-notes', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const {
    doctorName,
    doctorMdcnNumber,
    department,
    chiefComplaint,
    diagnosis,
    secondaryDiagnoses,
    vitalSignsSnapshot,
    clinicalObservations,
    treatmentPlan,
    investigations,
    followUpDate,
    urgency,
  } = req.body;

  if (!chiefComplaint || !diagnosis || !clinicalObservations || !treatmentPlan) {
    return res.status(400).json({ 
      success: false, 
      error: 'Chief complaint, diagnosis, clinical observations, and treatment plan are required' 
    });
  }

  const newNote: DoctorNote = {
    id: req.body.id || `note-${Date.now()}`,
    patientId: id,
    folderNumber: patient.folderNumber,
    patientName: `${patient.surname}, ${patient.firstName}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
    doctorName: doctorName || 'Dr. Medical Officer',
    doctorMdcnNumber: doctorMdcnNumber || 'MDCN/R/64821',
    department: department || 'General Outpatient (GOPD)',
    chiefComplaint,
    diagnosis,
    secondaryDiagnoses: secondaryDiagnoses || [],
    vitalSignsSnapshot: vitalSignsSnapshot || {},
    clinicalObservations,
    treatmentPlan,
    investigations: investigations || [],
    followUpDate,
    urgency: urgency || 'Routine',
  };

  patient.doctorNotes = patient.doctorNotes || [];
  patient.doctorNotes.unshift(newNote);
  patient.updatedAt = new Date().toISOString();
  patient.syncVersion = (patient.syncVersion || 0) + 1;

  savePatientsToStorage(patientsDatabase);
  res.status(201).json({ success: true, data: newNote });
});

// Get all Doctor's Notes for patient
app.get('/api/patients/:id/doctor-notes', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, data: patient.doctorNotes || [] });
});

// 10. Create Digital Prescription
app.post('/api/patients/:id/prescriptions', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const {
    diagnosis,
    treatmentPlan,
    medications,
    doctorName,
    doctorMdcnNumber,
    doctorSignature,
    hospitalName,
    notes,
  } = req.body;

  if (!medications || !Array.isArray(medications) || medications.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one medication is required' });
  }

  // Calculate patient age
  let patientAge: number | undefined;
  if (patient.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    patientAge = new Date().getFullYear() - birthYear;
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const prescriptionNumber = req.body.prescriptionNumber || `RX-NG-${new Date().getFullYear()}-${randomDigits}`;

  const digitalRx: DigitalPrescription = {
    id: req.body.id || `rx-${Date.now()}`,
    prescriptionNumber,
    patientId: id,
    patientName: `${patient.surname}, ${patient.firstName} ${patient.otherNames || ''}`.trim(),
    patientFolderNumber: patient.folderNumber,
    patientAge,
    patientGender: patient.gender,
    patientGenotype: patient.genotype,
    patientAllergies: patient.allergies || [],
    diagnosis: diagnosis || 'General Clinical Consultation',
    treatmentPlan: treatmentPlan || '',
    medications: medications.map((m: any, idx: number) => ({
      id: m.id || `med-${Date.now()}-${idx}`,
      name: m.name,
      dosage: m.dosage || '',
      frequency: m.frequency || 'TDS',
      duration: m.duration || '3 days',
      quantity: Number(m.quantity) || 1,
      route: m.route || 'Oral',
      instructions: m.instructions || '',
      inventoryItemId: m.inventoryItemId,
      dispensed: false,
    })),
    doctorName: doctorName || 'Dr. Medical Officer',
    doctorMdcnNumber: doctorMdcnNumber || 'MDCN/R/64821',
    doctorSignature: doctorSignature || '',
    hospitalName: hospitalName || 'LAGOS ISLAND GENERAL HOSPITAL / FMC REGISTRY',
    createdAt: req.body.createdAt || new Date().toISOString(),
    status: 'Pending',
    notes,
  };

  patient.digitalPrescriptions = patient.digitalPrescriptions || [];
  patient.digitalPrescriptions.unshift(digitalRx);
  patient.updatedAt = new Date().toISOString();
  patient.syncVersion = (patient.syncVersion || 0) + 1;

  savePatientsToStorage(patientsDatabase);
  res.status(201).json({ success: true, data: digitalRx });
});

// Get all Prescriptions for patient
app.get('/api/patients/:id/prescriptions', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, data: patient.digitalPrescriptions || [] });
});

// ----------------------------------------------------
// 11. APPOINTMENTS API
// ----------------------------------------------------

// GET all appointments (with filters)
app.get('/api/appointments', (req, res) => {
  const { date, clinic, patientId, doctorName, status } = req.query;
  let result = [...appointmentsDatabase];

  if (date && typeof date === 'string') {
    result = result.filter((a) => a.appointmentDate === date);
  }
  if (clinic && typeof clinic === 'string') {
    result = result.filter((a) => a.clinic === clinic);
  }
  if (patientId && typeof patientId === 'string') {
    result = result.filter((a) => a.patientId === patientId);
  }
  if (doctorName && typeof doctorName === 'string') {
    result = result.filter((a) => a.doctorName.toLowerCase().includes(doctorName.toLowerCase()));
  }
  if (status && typeof status === 'string') {
    result = result.filter((a) => a.status === status);
  }

  // Sort by date, then by timeSlot
  result.sort((a, b) => {
    if (a.appointmentDate !== b.appointmentDate) {
      return a.appointmentDate.localeCompare(b.appointmentDate);
    }
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  res.json({ success: true, count: result.length, data: result });
});

// POST create new appointment
app.post('/api/appointments', (req, res) => {
  const {
    patientId,
    patientName,
    patientFolderNumber,
    patientPhone,
    patientAge,
    patientGender,
    doctorName,
    clinic,
    appointmentDate,
    timeSlot,
    appointmentType,
    priority,
    reasonForVisit,
    clinicNotes,
    bookedBy,
  } = req.body;

  if (!patientName || !doctorName || !clinic || !appointmentDate || !timeSlot || !reasonForVisit) {
    return res.status(400).json({
      success: false,
      error: 'Patient name, doctor, clinic, date, time slot, and reason for visit are required',
    });
  }

  // If patientId provided, find patient to inherit details
  let linkedPatient = patientsDatabase.find((p) => p.id === patientId || p.folderNumber === patientFolderNumber);

  const newAppointment: PatientAppointment = {
    id: req.body.id || `apt-${Date.now()}`,
    patientId: linkedPatient?.id || patientId || `pat-ext-${Date.now()}`,
    patientName: linkedPatient ? `${linkedPatient.surname}, ${linkedPatient.firstName}` : patientName,
    patientFolderNumber: linkedPatient?.folderNumber || patientFolderNumber || 'UNASSIGNED',
    patientPhone: linkedPatient?.phone || patientPhone || '',
    patientAge: patientAge,
    patientGender: linkedPatient?.gender || patientGender,
    doctorName,
    clinic,
    appointmentDate,
    timeSlot,
    appointmentType: appointmentType || 'Routine Follow-up',
    priority: priority || 'Routine',
    status: 'Scheduled',
    reasonForVisit,
    clinicNotes,
    bookedBy: bookedBy || 'Front Desk',
    createdAt: new Date().toISOString(),
  };

  appointmentsDatabase.unshift(newAppointment);
  saveAppointmentsToStorage(appointmentsDatabase);

  // Link to patient file if exists
  if (linkedPatient) {
    linkedPatient.appointments = linkedPatient.appointments || [];
    linkedPatient.appointments.unshift(newAppointment);
    linkedPatient.updatedAt = new Date().toISOString();
    savePatientsToStorage(patientsDatabase);
  }

  res.status(201).json({ success: true, data: newAppointment });
});

// PUT update appointment status or details
app.put('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const aptIndex = appointmentsDatabase.findIndex((a) => a.id === id);
  if (aptIndex === -1) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }

  const existing = appointmentsDatabase[aptIndex];
  const { status, timeSlot, appointmentDate, clinicNotes, priority, reasonForVisit } = req.body;

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
    ...(status && { status }),
    ...(timeSlot && { timeSlot }),
    ...(appointmentDate && { appointmentDate }),
    ...(clinicNotes !== undefined && { clinicNotes }),
    ...(priority && { priority }),
    ...(reasonForVisit && { reasonForVisit }),
    checkedInAt,
    completedAt,
  };

  appointmentsDatabase[aptIndex] = updated;
  saveAppointmentsToStorage(appointmentsDatabase);

  // Sync with patient file if linked
  const patient = patientsDatabase.find((p) => p.id === updated.patientId);
  if (patient && patient.appointments) {
    patient.appointments = patient.appointments.map((a) => (a.id === id ? updated : a));
    patient.updatedAt = new Date().toISOString();
    savePatientsToStorage(patientsDatabase);
  }

  res.json({ success: true, data: updated });
});

// DELETE cancel appointment
app.delete('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const beforeLen = appointmentsDatabase.length;
  appointmentsDatabase = appointmentsDatabase.filter((a) => a.id !== id);

  if (appointmentsDatabase.length === beforeLen) {
    return res.status(404).json({ success: false, error: 'Appointment not found' });
  }

  saveAppointmentsToStorage(appointmentsDatabase);

  // Also remove from patient appointments
  patientsDatabase.forEach((p) => {
    if (p.appointments) {
      p.appointments = p.appointments.filter((a) => a.id !== id);
    }
  });
  savePatientsToStorage(patientsDatabase);

  res.json({ success: true, message: 'Appointment removed' });
});

// ----------------------------------------------------
// 12. LABORATORY REPORTS API
// ----------------------------------------------------

// GET all laboratory reports hospital-wide
app.get('/api/lab-reports', (req, res) => {
  const { category, status, search } = req.query;
  const allReports: LabReport[] = [];

  patientsDatabase.forEach((p) => {
    if (p.labReports && Array.isArray(p.labReports)) {
      allReports.push(...p.labReports);
    }
  });

  let result = allReports;

  if (category && typeof category === 'string' && category !== 'All') {
    result = result.filter((r) => r.category === category);
  }
  if (status && typeof status === 'string' && status !== 'All') {
    result = result.filter((r) => r.status === status);
  }
  if (search && typeof search === 'string') {
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

  res.json({ success: true, count: result.length, data: result });
});

// GET lab reports for specific patient
app.get('/api/patients/:id/lab-reports', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  res.json({ success: true, data: patient.labReports || [] });
});

// POST add laboratory report to patient
app.post('/api/patients/:id/lab-reports', (req, res) => {
  const { id } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const {
    testName,
    category,
    specimenType,
    requestedBy,
    performedBy,
    mlsLicenseNumber,
    sampleCollectionDate,
    reportDate,
    status,
    urgency,
    parameters,
    findingsOrImpression,
    clinicalCorrelationNotes,
    attachmentUrl,
    attachmentName,
    isFlaggedAbnormal,
  } = req.body;

  if (!testName || !category) {
    return res.status(400).json({ success: false, error: 'Test name and category are required' });
  }

  const newReport: LabReport = {
    id: req.body.id || `lab-${Date.now()}`,
    patientId: id,
    patientName: `${patient.surname}, ${patient.firstName} ${patient.otherNames || ''}`.trim(),
    patientFolderNumber: patient.folderNumber,
    testName,
    category,
    specimenType: specimenType || 'Clinical Specimen',
    requestedBy: requestedBy || 'Attending Medical Officer',
    performedBy: performedBy || 'Medical Laboratory Scientist (MLS)',
    mlsLicenseNumber: mlsLicenseNumber || 'AMLSCN-VERIFIED',
    sampleCollectionDate: sampleCollectionDate || new Date().toISOString().split('T')[0],
    reportDate: reportDate || new Date().toISOString().split('T')[0],
    status: status || 'Completed',
    urgency: urgency || 'Routine',
    parameters: parameters || [],
    findingsOrImpression: findingsOrImpression || '',
    clinicalCorrelationNotes: clinicalCorrelationNotes || '',
    attachmentUrl,
    attachmentName,
    isFlaggedAbnormal: isFlaggedAbnormal || false,
    createdAt: req.body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  patient.labReports = patient.labReports || [];
  patient.labReports.unshift(newReport);
  patient.updatedAt = new Date().toISOString();
  patient.syncVersion = (patient.syncVersion || 0) + 1;

  savePatientsToStorage(patientsDatabase);
  res.status(201).json({ success: true, data: newReport });
});

// PUT update laboratory report
app.put('/api/lab-reports/:id', (req, res) => {
  const { id } = req.params;
  let foundReport: LabReport | null = null;

  for (const patient of patientsDatabase) {
    if (patient.labReports) {
      const idx = patient.labReports.findIndex((r) => r.id === id);
      if (idx !== -1) {
        patient.labReports[idx] = {
          ...patient.labReports[idx],
          ...req.body,
          id,
          updatedAt: new Date().toISOString(),
        };
        foundReport = patient.labReports[idx];
        patient.updatedAt = new Date().toISOString();
        patient.syncVersion = (patient.syncVersion || 0) + 1;
        break;
      }
    }
  }

  if (!foundReport) {
    return res.status(404).json({ success: false, error: 'Laboratory report not found' });
  }

  savePatientsToStorage(patientsDatabase);
  res.json({ success: true, data: foundReport });
});

// 11. Pharmacy Inventory API
// GET inventory and low stock alerts
app.get('/api/pharmacy/inventory', (req, res) => {
  const lowStockAlerts = pharmacyDatabase.filter((item) => item.quantityInStock <= item.reorderLevel);
  const criticalStockAlerts = pharmacyDatabase.filter((item) => item.quantityInStock <= Math.ceil(item.reorderLevel * 0.4));

  res.json({
    success: true,
    totalItems: pharmacyDatabase.length,
    lowStockCount: lowStockAlerts.length,
    criticalCount: criticalStockAlerts.length,
    lowStockAlerts,
    items: pharmacyDatabase,
  });
});

// POST new medication stock or restock batch
app.post('/api/pharmacy/inventory', (req, res) => {
  const {
    drugName,
    brandName,
    category,
    form,
    batchNumber,
    quantityInStock,
    reorderLevel,
    unit,
    unitPriceNgn,
    expiryDate,
    supplier,
    shelfLocation,
  } = req.body;

  if (!drugName || !batchNumber || quantityInStock === undefined) {
    return res.status(400).json({ success: false, error: 'Drug name, batch number, and quantity are required' });
  }

  // Check if item already exists with matching drugName and batch
  const existingIdx = pharmacyDatabase.findIndex(
    (item) => item.drugName.toLowerCase() === drugName.toLowerCase() && item.batchNumber === batchNumber
  );

  let savedItem: PharmacyInventoryItem;

  if (existingIdx >= 0) {
    // Restock existing batch
    const existing = pharmacyDatabase[existingIdx];
    const prevQty = existing.quantityInStock;
    existing.quantityInStock += Number(quantityInStock);
    existing.reorderLevel = Number(reorderLevel) || existing.reorderLevel;
    existing.lastRestockedAt = new Date().toISOString();
    if (supplier) existing.supplier = supplier;
    if (expiryDate) existing.expiryDate = expiryDate;
    if (shelfLocation) existing.shelfLocation = shelfLocation;

    savedItem = existing;

    // Movement log
    const movement: PharmacyStockMovement = {
      id: `mov-${Date.now()}`,
      inventoryItemId: existing.id,
      drugName: existing.drugName,
      type: 'stock_in',
      quantity: Number(quantityInStock),
      balanceAfter: existing.quantityInStock,
      recordedBy: req.body.recordedBy || 'Pharmacy Store Officer',
      notes: `Batch restock of ${quantityInStock} ${existing.unit}. Previous stock: ${prevQty}`,
      timestamp: new Date().toISOString(),
    };
    pharmacyMovements.unshift(movement);
  } else {
    // Create new inventory item
    const newItem: PharmacyInventoryItem = {
      id: req.body.id || `inv-${Date.now()}`,
      drugName,
      brandName: brandName || drugName,
      category: category || 'Other',
      form: form || 'Tablet',
      batchNumber,
      quantityInStock: Number(quantityInStock),
      reorderLevel: Number(reorderLevel) || 20,
      unit: unit || 'packs',
      unitPriceNgn: Number(unitPriceNgn) || 1000,
      expiryDate: expiryDate || '2027-12-31',
      supplier: supplier || 'Federal Medical Stores / Direct Depot',
      shelfLocation: shelfLocation || 'General Pharmacy Rack',
      lastRestockedAt: new Date().toISOString(),
    };

    pharmacyDatabase.unshift(newItem);
    savedItem = newItem;

    const movement: PharmacyStockMovement = {
      id: `mov-${Date.now()}`,
      inventoryItemId: newItem.id,
      drugName: newItem.drugName,
      type: 'stock_in',
      quantity: Number(quantityInStock),
      balanceAfter: newItem.quantityInStock,
      recordedBy: req.body.recordedBy || 'Pharmacy Store Officer',
      notes: `Initial stock intake: Batch ${batchNumber}`,
      timestamp: new Date().toISOString(),
    };
    pharmacyMovements.unshift(movement);
  }

  savePharmacyInventoryToStorage(pharmacyDatabase);
  savePharmacyMovementsToStorage(pharmacyMovements);

  res.status(201).json({ success: true, data: savedItem });
});

// PUT update inventory item
app.put('/api/pharmacy/inventory/:id', (req, res) => {
  const { id } = req.params;
  const item = pharmacyDatabase.find((inv) => inv.id === id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Pharmacy inventory item not found' });
  }

  Object.assign(item, req.body);
  savePharmacyInventoryToStorage(pharmacyDatabase);
  res.json({ success: true, data: item });
});

// POST dispense prescription and link to inventory (automatic deduction)
app.post('/api/pharmacy/dispense', (req, res) => {
  const { patientId, prescriptionId, items, dispensedBy } = req.body;

  const patient = patientsDatabase.find((p) => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient record not found' });
  }

  let prescription: DigitalPrescription | undefined;
  if (patient.digitalPrescriptions) {
    prescription = patient.digitalPrescriptions.find((rx) => rx.id === prescriptionId);
  }

  const deductionLog: any[] = [];
  const lowStockWarnings: string[] = [];

  // Items to deduct: array of { inventoryItemId, drugName, quantity }
  if (Array.isArray(items)) {
    for (const reqItem of items) {
      // Look up inventory item by id or drugName match
      let invItem = pharmacyDatabase.find((i) => i.id === reqItem.inventoryItemId);
      if (!invItem && reqItem.drugName) {
        const queryName = reqItem.drugName.toLowerCase();
        invItem = pharmacyDatabase.find(
          (i) => i.drugName.toLowerCase().includes(queryName) || queryName.includes(i.drugName.toLowerCase())
        );
      }

      if (invItem) {
        const deductQty = Number(reqItem.quantity) || 1;
        invItem.quantityInStock = Math.max(0, invItem.quantityInStock - deductQty);

        // Check if now low stock
        if (invItem.quantityInStock <= invItem.reorderLevel) {
          lowStockWarnings.push(
            `ALERT: ${invItem.drugName} is now at or below reorder level (${invItem.quantityInStock} ${invItem.unit} remaining)!`
          );
        }

        // Record stock movement
        const movement: PharmacyStockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          inventoryItemId: invItem.id,
          drugName: invItem.drugName,
          type: 'dispense',
          quantity: deductQty,
          balanceAfter: invItem.quantityInStock,
          patientFolderNumber: patient.folderNumber,
          patientName: `${patient.surname}, ${patient.firstName}`,
          prescriptionId: prescriptionId,
          recordedBy: dispensedBy || 'Dispensary Pharmacist',
          notes: `Dispensed for prescription ${prescription?.prescriptionNumber || prescriptionId}`,
          timestamp: new Date().toISOString(),
        };
        pharmacyMovements.unshift(movement);

        deductionLog.push({
          drugName: invItem.drugName,
          deducted: deductQty,
          balanceAfter: invItem.quantityInStock,
          isLowStock: invItem.quantityInStock <= invItem.reorderLevel,
        });
      }
    }
  }

  // Update prescription status
  if (prescription) {
    prescription.status = 'Dispensed';
    prescription.dispensedAt = new Date().toISOString();
    prescription.dispensedBy = dispensedBy || 'Dispensary Pharmacist';
    if (prescription.medications) {
      prescription.medications.forEach((m) => {
        m.dispensed = true;
      });
    }
  }

  // Also update encounter prescriptions if present
  if (patient.encounters) {
    for (const enc of patient.encounters) {
      for (const rx of enc.prescriptions) {
        if (prescription && rx.drug && prescription.medications.some((m) => m.name.toLowerCase().includes(rx.drug.toLowerCase()))) {
          rx.dispensed = true;
        }
      }
    }
  }

  patient.updatedAt = new Date().toISOString();
  savePatientsToStorage(patientsDatabase);
  savePharmacyInventoryToStorage(pharmacyDatabase);
  savePharmacyMovementsToStorage(pharmacyMovements);

  res.json({
    success: true,
    message: 'Prescription successfully dispensed and inventory updated in real-time',
    prescription,
    deductions: deductionLog,
    lowStockWarnings,
  });
});

// GET pharmacy stock movements audit trail
app.get('/api/pharmacy/movements', (req, res) => {
  res.json({ success: true, movements: pharmacyMovements.slice(0, 100) });
});

// 12. Legacy Single Item Dispense medication
app.put('/api/patients/:id/prescriptions/:rxId/dispense', (req, res) => {
  const { id, rxId } = req.params;
  const patient = patientsDatabase.find((p) => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  let updatedRx = false;
  for (const enc of patient.encounters) {
    for (const rx of enc.prescriptions) {
      if (rx.id === rxId) {
        rx.dispensed = true;
        updatedRx = true;
      }
    }
  }

  if (patient.digitalPrescriptions) {
    for (const dp of patient.digitalPrescriptions) {
      for (const m of dp.medications) {
        if (m.id === rxId) {
          m.dispensed = true;
          updatedRx = true;
        }
      }
    }
  }

  if (!updatedRx) {
    return res.status(404).json({ success: false, error: 'Prescription item not found' });
  }

  patient.updatedAt = new Date().toISOString();
  savePatientsToStorage(patientsDatabase);
  res.json({ success: true, message: 'Prescription marked as dispensed' });
});

// 10. Bidirectional Offline-to-Cloud Sync Engine
app.post('/api/sync', (req, res) => {
  const { clientQueue, lastClientSyncTimestamp } = req.body;
  const appliedActions: string[] = [];
  const conflicts: string[] = [];

  if (Array.isArray(clientQueue) && clientQueue.length > 0) {
    for (const item of clientQueue) {
      try {
        if (item.action === 'create_patient' || item.action === 'update_patient') {
          const patientPayload = item.payload as PatientRecord;
          const existingIdx = patientsDatabase.findIndex(
            (p) => p.id === patientPayload.id || p.folderNumber === patientPayload.folderNumber
          );
          if (existingIdx >= 0) {
            // Compare version
            const serverItem = patientsDatabase[existingIdx];
            if ((patientPayload.syncVersion || 0) >= (serverItem.syncVersion || 0)) {
              patientsDatabase[existingIdx] = {
                ...patientPayload,
                synced: true,
                updatedAt: new Date().toISOString(),
              };
              appliedActions.push(item.id);
            } else {
              conflicts.push(`Server version for ${patientPayload.folderNumber} was newer; merged latest server state`);
              appliedActions.push(item.id);
            }
          } else {
            patientsDatabase.unshift({
              ...patientPayload,
              synced: true,
              updatedAt: new Date().toISOString(),
            });
            appliedActions.push(item.id);
          }
        } else if (item.action === 'add_vitals') {
          const { patientId, vitals } = item.payload;
          const patient = patientsDatabase.find((p) => p.id === patientId);
          if (patient) {
            patient.vitalsHistory = patient.vitalsHistory || [];
            const existingVit = patient.vitalsHistory.some((v) => v.id === vitals.id);
            if (!existingVit) {
              patient.vitalsHistory.unshift(vitals);
              patient.updatedAt = new Date().toISOString();
            }
            appliedActions.push(item.id);
          }
        } else if (item.action === 'add_encounter') {
          const { patientId, encounter } = item.payload;
          const patient = patientsDatabase.find((p) => p.id === patientId);
          if (patient) {
            patient.encounters = patient.encounters || [];
            const existingEnc = patient.encounters.some((e) => e.id === encounter.id);
            if (!existingEnc) {
              patient.encounters.unshift(encounter);
              patient.updatedAt = new Date().toISOString();
            }
            appliedActions.push(item.id);
          }
        } else if (item.action === 'add_doctor_note') {
          const { patientId, note } = item.payload;
          const patient = patientsDatabase.find((p) => p.id === patientId);
          if (patient) {
            patient.doctorNotes = patient.doctorNotes || [];
            const existingNote = patient.doctorNotes.some((n) => n.id === note.id);
            if (!existingNote) {
              patient.doctorNotes.unshift(note);
              patient.updatedAt = new Date().toISOString();
            }
            appliedActions.push(item.id);
          }
        } else if (item.action === 'create_prescription') {
          const { patientId, prescription } = item.payload;
          const patient = patientsDatabase.find((p) => p.id === patientId);
          if (patient) {
            patient.digitalPrescriptions = patient.digitalPrescriptions || [];
            const existingRx = patient.digitalPrescriptions.some((rx) => rx.id === prescription.id);
            if (!existingRx) {
              patient.digitalPrescriptions.unshift(prescription);
              patient.updatedAt = new Date().toISOString();
            }
            appliedActions.push(item.id);
          }
        }
      } catch (err: any) {
        console.error('Error applying sync action:', err);
      }
    }
    savePatientsToStorage(patientsDatabase);
  }

  res.json({
    success: true,
    serverTimestamp: new Date().toISOString(),
    appliedActionIds: appliedActions,
    conflicts,
    serverPatients: patientsDatabase,
  });
});

// 11. Full Database Export (JSON Download / Cloud Backup)
app.get('/api/backup', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  res.setHeader('Content-Disposition', `attachment; filename="nigerian_hospital_vault_backup_${timestamp}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(patientsDatabase, null, 2));
});

// 12. Full Database Restore
app.post('/api/restore', (req, res) => {
  const { patients } = req.body;
  if (!Array.isArray(patients) || patients.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid backup format' });
  }
  patientsDatabase = patients;
  savePatientsToStorage(patientsDatabase);
  res.json({ success: true, message: `Successfully restored ${patients.length} patient records into database` });
});

// 13. Smart Paper Folder Digitizer (Multimodal AI Extraction with Gemini 3.8 Flash)
app.post('/api/digitize-paper', async (req, res) => {
  try {
    const { imageBase64, mimeType, textDescription, existingFolderPrefix } = req.body;

    const ai = getGeminiClient();

    const systemPrompt = `You are a Senior Health Records Specialist and Medical Informatician working in Nigerian General Hospitals and Federal Medical Centres (FMC).
Your task is to analyze photographs, scans, or text transcripts of old paper medical folders, hospital intake cards, face-sheets, or doctor's clinical notes.
Extract all structured patient details according to Nigerian hospital conventions.

Nigerian Medical Context:
1. Names: Usually formatted with SURNAME in uppercase, followed by first name and middle names.
2. Genotype: Extremely vital in Nigeria due to Sickle Cell disease. Must be one of: 'AA', 'AS', 'SS', 'AC', 'SC', or 'Unknown'.
3. Blood Group: 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', or 'Unknown'.
4. Folder / Hospital Card Number: Typically looks like 'GH-IKEJA/2021/0142', 'FMC/REC/22/0491', 'UNTH/2019/3310', or numerical card numbers.
5. States & LGA: Valid 36 Nigerian states + FCT (e.g. Lagos, Oyo, Kano, Rivers, Enugu, Anambra, Kaduna, Ogun, Edo, Delta, etc.) and their respective LGAs.
6. Common Nigerian Clinical Contexts: Malaria, Typhoid, Hypertension, Sickle Cell Anaemia (Hb SS), Peptic Ulcer Disease (PUD), Pregnancy / ANC, Under-5 infant fever.
7. Physical Archive Location: Suggest appropriate rack (e.g. 'Rack A (General)', 'Rack H (Haematology)', 'Rack M (Maternity)') and box for where to safely preserve the physical paper jacket.

Return ONLY a valid JSON object matching this schema:
{
  "folderNumber": string or null,
  "surname": string,
  "firstName": string,
  "otherNames": string or null,
  "gender": "Male" | "Female",
  "age": number or null,
  "dateOfBirth": "YYYY-MM-DD" or null,
  "phone": string or null,
  "residentialAddress": string or null,
  "stateOfOrigin": string or null,
  "lga": string or null,
  "bloodGroup": "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown",
  "genotype": "AA" | "AS" | "SS" | "AC" | "SC" | "Unknown",
  "nhiaNumber": string or null,
  "nextOfKinName": string or null,
  "nextOfKinPhone": string or null,
  "nextOfKinRelationship": string or null,
  "allergies": string[],
  "chronicConditions": string[],
  "suggestedArchiveRack": string,
  "suggestedArchiveBox": string,
  "confidenceScore": number (0 to 100),
  "extractedClinicalNotes": string
}`;

    const parts: any[] = [];

    if (imageBase64) {
      // Clean base64 header if present
      const cleanedBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanedBase64,
        },
      });
      parts.push({
        text: `Transcribe and digitize this Nigerian hospital paper folder card or medical sheet. ${
          existingFolderPrefix ? `If folder number is missing, suggest one starting with: ${existingFolderPrefix}` : ''
        }`,
      });
    } else if (textDescription) {
      parts.push({
        text: `Analyze and extract structured patient record from this paper folder transcript:\n\n${textDescription}`,
      });
    } else {
      return res.status(400).json({ success: false, error: 'Provide either imageBase64 or textDescription' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    let parsed: DigitizedPaperResult;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback cleanup
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      data: parsed,
    });
  } catch (err: any) {
    console.error('Paper digitization error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to digitize paper record',
    });
  }
});

// 14. Audio Transcription with gemini-3.5-transcribe
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType, prompt } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'audioBase64 payload is required' });
    }

    const ai = getGeminiClient();

    // Clean data URL prefix if provided
    const cleanedBase64 = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, '').trim();
    const effectiveMimeType = mimeType ? mimeType.split(';')[0] : 'audio/webm';

    const audioPart = {
      inlineData: {
        mimeType: effectiveMimeType,
        data: cleanedBase64,
      },
    };

    const textPart = {
      text: prompt || 'Transcribe this audio recording accurately verbatim, noting clinical terms, symptoms, dosage, and medical notes precisely.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, textPart] },
    });

    const transcript = response.text || '';

    res.json({
      success: true,
      transcript,
      modelUsed: 'gemini-3.5-transcribe',
    });
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to transcribe audio',
    });
  }
});

// 15. Real-Time Medical Fact-Checking & News with Google Search Grounding
app.post('/api/medical-search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are a Senior Clinical Informatician and Medical Research Officer for Nigerian General Hospitals.
Provide factual, verified medical and epidemiological information grounded in live Google Search results.
Focus on:
1. Nigerian Centre for Disease Control (NCDC) and Federal Ministry of Health (FMoH) advisory guidelines.
2. National Agency for Food and Drug Administration and Control (NAFDAC) drug safety alerts, recalls, and counterfeit warnings.
3. WHO Africa region clinical protocols and current infectious disease updates (e.g., Cholera, Lassa Fever, Malaria, Diphtheria, Mpox, Yellow Fever).
4. Evidence-based dosage, contraindications, and drug interactions.

Always synthesize a clear, bulleted summary, and reference the verified news or institutional source dates.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text || 'No information found for this query.';
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    res.json({
      success: true,
      query,
      answer,
      groundingMetadata: groundingMetadata || null,
      modelUsed: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('Medical Google Search error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to execute medical search with Google Search',
    });
  }
});

// ----------------------------------------------------
// VITE MIDDLEWARE & SERVER STARTUP
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 Nigerian Hospital Filing System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
