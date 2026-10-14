import React, { useState, useEffect, useCallback } from 'react';
import { 
  getLocalPatients, 
  subscribeToStorage, 
  bootstrapCloudData, 
  isDeviceOnline, 
  getOfflineQueue,
  createPatient,
  logPatientVitals,
  logClinicalEncounter,
  dispensePrescription,
  deletePatientRecord,
  saveLocalPatients
} from './lib/storage';
import { PatientRecord, StaffRole, VitalsEntry, ClinicalEncounter } from './types';
import { Navbar } from './components/Navbar';
import { PatientList } from './components/PatientList';
import { PatientDetail } from './components/PatientDetail';
import { PaperDigitizerModal } from './components/PaperDigitizerModal';
import { NewPatientModal } from './components/NewPatientModal';
import { AddVitalsModal } from './components/AddVitalsModal';
import { AddEncounterModal } from './components/AddEncounterModal';
import { PhysicalArchiveRoomView } from './components/PhysicalArchiveRoomView';
import { PrintableFolderCardModal } from './components/PrintableFolderCardModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { AudioTranscriberModal } from './components/AudioTranscriberModal';
import { DoctorNotesModal } from './components/DoctorNotesModal';
import { PrescriptionGeneratorModal } from './components/PrescriptionGeneratorModal';
import { PharmacyInventoryModal } from './components/PharmacyInventoryModal';
import { MedicalSearchModal } from './components/MedicalSearchModal';
import { LandingPage } from './components/LandingPage';
import { LabReportsModal } from './components/LabReportsModal';
import { AppointmentSchedulerModal } from './components/AppointmentSchedulerModal';
import { getLocalPharmacyInventory, fetchPharmacyInventory } from './lib/storage';
import { 
  Folder, 
  ScanLine, 
  Plus, 
  HeartPulse, 
  Layers, 
  ShieldAlert, 
  DownloadCloud, 
  ArrowLeft,
  Sparkles,
  Building2,
  FileText,
  Mic,
  Calendar,
  FlaskConical,
  Compass
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<StaffRole>('records_clerk');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Modals state
  const [showLandingPage, setShowLandingPage] = useState<boolean>(false);
  const [showLabReportsModal, setShowLabReportsModal] = useState<boolean>(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [showDigitizerModal, setShowDigitizerModal] = useState<boolean>(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState<boolean>(false);
  const [showArchiveMapModal, setShowArchiveMapModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showVitalsModal, setShowVitalsModal] = useState<boolean>(false);
  const [showEncounterModal, setShowEncounterModal] = useState<boolean>(false);
  const [showDoctorNotesModal, setShowDoctorNotesModal] = useState<boolean>(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState<boolean>(false);
  const [showPharmacyModal, setShowPharmacyModal] = useState<boolean>(false);
  const [showMedicalSearchModal, setShowMedicalSearchModal] = useState<boolean>(false);
  const [showPrintCardModal, setShowPrintCardModal] = useState<boolean>(false);
  const [showAudioTranscriberModal, setShowAudioTranscriberModal] = useState<boolean>(false);
  const [locateHighlightFolder, setLocateHighlightFolder] = useState<string | undefined>(undefined);
  const [prescriptionInitialData, setPrescriptionInitialData] = useState<{ diagnosis?: string; treatmentPlan?: string }>({});
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  // Sync state and bootstrap
  const refreshFromStorage = useCallback(() => {
    const list = getLocalPatients();
    setPatients(list);
    setPendingSyncCount(getOfflineQueue().length);
    setIsOnline(isDeviceOnline());
    
    // Low stock inventory calculation
    const inventory = getLocalPharmacyInventory();
    const low = inventory.filter((item) => item.quantityInStock <= item.reorderLevel).length;
    setLowStockCount(low);

    // Auto-select first patient if none selected
    if (!selectedPatientId && list.length > 0) {
      setSelectedPatientId(list[0].id);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    // Initial load
    refreshFromStorage();
    bootstrapCloudData().then(() => refreshFromStorage());
    fetchPharmacyInventory().then((inv) => {
      setLowStockCount(inv.lowStockCount);
    }).catch(() => {});

    // Subscription to storage changes
    const unsubscribe = subscribeToStorage(() => {
      refreshFromStorage();
    });

    const handleNetworkChange = () => {
      setIsOnline(isDeviceOnline());
      setPendingSyncCount(getOfflineQueue().length);
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [refreshFromStorage]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || null;

  // Handlers
  const handleSavePatient = async (patientData: any): Promise<PatientRecord> => {
    const saved = await createPatient(patientData);
    setSelectedPatientId(saved.id);
    return saved;
  };

  const handleAddVitals = async (vitalsData: any) => {
    if (!selectedPatientId) return;
    await logPatientVitals(selectedPatientId, vitalsData);
  };

  const handleAddEncounter = async (encounterData: any) => {
    if (!selectedPatientId) return;
    await logClinicalEncounter(selectedPatientId, encounterData);
  };

  const handleDispenseMedication = async (rxId: string) => {
    if (!selectedPatientId) return;
    await dispensePrescription(selectedPatientId, rxId);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (confirm('Are you sure you want to delete this patient record from the registry?')) {
      await deletePatientRecord(patientId);
      const remaining = patients.filter((p) => p.id !== patientId);
      if (remaining.length > 0) {
        setSelectedPatientId(remaining[0].id);
      } else {
        setSelectedPatientId(null);
      }
    }
  };

  const handleOpenLocateFolder = (patient?: PatientRecord) => {
    setLocateHighlightFolder(patient ? patient.folderNumber : selectedPatient?.folderNumber);
    setShowArchiveMapModal(true);
  };

  if (showLandingPage) {
    return (
      <LandingPage
        onEnterApp={() => setShowLandingPage(false)}
        onOpenAppointments={() => {
          setShowLandingPage(false);
          setShowAppointmentModal(true);
        }}
        onOpenLabs={() => {
          setShowLandingPage(false);
          setShowLabReportsModal(true);
        }}
        onOpenPharmacy={() => {
          setShowLandingPage(false);
          setShowPharmacyModal(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden text-slate-800 font-sans antialiased">
      
      {/* Universal Hospital Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        lowStockCount={lowStockCount}
        onOpenDigitizer={() => setShowDigitizerModal(true)}
        onOpenNewPatient={() => setShowNewPatientModal(true)}
        onOpenArchiveMap={() => handleOpenLocateFolder()}
        onOpenSyncPanel={() => setShowSyncModal(true)}
        onOpenPharmacy={() => setShowPharmacyModal(true)}
        onOpenMedicalSearch={() => setShowMedicalSearchModal(true)}
        onOpenAudioTranscriber={() => setShowAudioTranscriberModal(true)}
        onOpenLandingPage={() => setShowLandingPage(true)}
        onOpenAppointments={() => setShowAppointmentModal(true)}
        onOpenLabs={() => setShowLabReportsModal(true)}
      />

      {/* Main Dual-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Pane: Patient Folder Directory & Filters (Full width on mobile when no patient selected) */}
        <aside className={`w-full md:w-96 lg:w-[420px] shrink-0 h-full ${
          selectedPatient ? 'hidden md:flex flex-col' : 'flex flex-col'
        }`}>
          <PatientList
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={(p) => setSelectedPatientId(p.id)}
            onOpenNewPatient={() => setShowNewPatientModal(true)}
            onOpenDigitizer={() => setShowDigitizerModal(true)}
            onPrintCard={(p) => {
              setSelectedPatientId(p.id);
              setShowPrintCardModal(true);
            }}
            onLocateFolder={(p) => handleOpenLocateFolder(p)}
            currentRole={currentRole}
          />
        </aside>

        {/* Right Pane: Patient Comprehensive Electronic Medical File */}
        <main className={`flex-1 h-full overflow-hidden ${
          !selectedPatient ? 'hidden md:flex' : 'flex'
        } flex-col bg-white`}>
          
          {/* Mobile Back Button when inspecting file */}
          <div className="md:hidden bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
            <button
              onClick={() => setSelectedPatientId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Folder Directory</span>
            </button>
            <span className="font-mono text-xs font-bold text-amber-300">
              {selectedPatient?.folderNumber}
            </span>
          </div>

          {selectedPatient ? (
            <PatientDetail
              patient={selectedPatient}
              currentRole={currentRole}
              onOpenAddVitals={() => setShowVitalsModal(true)}
              onOpenAddEncounter={() => setShowEncounterModal(true)}
              onOpenDoctorNotes={() => setShowDoctorNotesModal(true)}
              onOpenPrescriptionGenerator={(diag, plan) => {
                setPrescriptionInitialData({ diagnosis: diag, treatmentPlan: plan });
                setShowPrescriptionModal(true);
              }}
              onPrintCard={() => setShowPrintCardModal(true)}
              onLocateFolder={() => handleOpenLocateFolder(selectedPatient)}
              onDispenseMedication={handleDispenseMedication}
              onEditPatient={() => {}}
              onDeletePatient={handleDeletePatient}
              onOpenDigitizer={() => setShowDigitizerModal(true)}
              onOpenLabReportsModal={() => setShowLabReportsModal(true)}
              onOpenAppointmentScheduler={() => setShowAppointmentModal(true)}
            />
          ) : (
            /* Welcome / Zero State Dashboard */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
              <div className="w-16 h-16 rounded-2xl bg-teal-800 text-teal-100 flex items-center justify-center shadow-lg mb-4">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Nigerian Hospital Medical Filing System
              </h2>
              <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                Autonomous offline-first electronic health record vault designed specifically for Nigerian hospitals transitioning from paper folders.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 w-full max-w-4xl">
                <button
                  onClick={() => setShowDigitizerModal(true)}
                  className="p-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs text-left transition cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-emerald-200 mb-1" />
                  <h4 className="font-bold text-sm">Digitize Paper</h4>
                  <p className="text-[11px] text-emerald-100 mt-0.5">
                    Scan or snapshot old paper card slip with AI
                  </p>
                </button>

                <button
                  onClick={() => setShowNewPatientModal(true)}
                  className="p-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs text-left transition cursor-pointer"
                >
                  <Plus className="w-5 h-5 text-teal-200 mb-1" />
                  <h4 className="font-bold text-sm">New File</h4>
                  <p className="text-[11px] text-teal-100 mt-0.5">
                    Allocate hospital folder number and shelf location
                  </p>
                </button>

                <button
                  onClick={() => setShowPharmacyModal(true)}
                  className="p-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xs text-left transition cursor-pointer relative"
                >
                  {lowStockCount > 0 && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {lowStockCount} Low
                    </span>
                  )}
                  <Building2 className="w-5 h-5 text-slate-300 mb-1" />
                  <h4 className="font-bold text-sm">Pharmacy Stock</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Manage inventory, reorder thresholds & auto-dispense
                  </p>
                </button>

                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="p-4 bg-teal-800 hover:bg-teal-900 text-white rounded-xl shadow-xs text-left transition cursor-pointer"
                >
                  <Calendar className="w-5 h-5 text-teal-300 mb-1" />
                  <h4 className="font-bold text-sm">Appointments</h4>
                  <p className="text-[11px] text-teal-100 mt-0.5">
                    Book clinic follow-ups & review doctor's today schedule
                  </p>
                </button>

                <button
                  onClick={() => setShowLabReportsModal(true)}
                  className="p-4 bg-rose-800 hover:bg-rose-900 text-white rounded-xl shadow-xs text-left transition cursor-pointer"
                >
                  <FlaskConical className="w-5 h-5 text-rose-200 mb-1" />
                  <h4 className="font-bold text-sm">Lab & Imaging</h4>
                  <p className="text-[11px] text-rose-100 mt-0.5">
                    Blood work, urinalysis, malaria parasite & X-ray films
                  </p>
                </button>

                <button
                  onClick={() => setShowMedicalSearchModal(true)}
                  className="p-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-xs text-left transition cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-teal-300 mb-1" />
                  <h4 className="font-bold text-sm">NAFDAC & Search</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Live Google Search grounded clinical alerts & drug safety
                  </p>
                </button>

                <button
                  onClick={() => setShowLandingPage(true)}
                  className="p-4 bg-teal-950 hover:bg-slate-950 text-white rounded-xl shadow-xs text-left transition cursor-pointer border border-teal-800/60"
                >
                  <Compass className="w-5 h-5 text-teal-400 mb-1" />
                  <h4 className="font-bold text-sm">Hospital Overview</h4>
                  <p className="text-[11px] text-teal-200 mt-0.5">
                    Read the dual-archiving clinical operating system architecture
                  </p>
                </button>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* MODALS */}
      
      {/* 1. Paper Folder AI Digitizer Modal */}
      {showDigitizerModal && (
        <PaperDigitizerModal
          onClose={() => setShowDigitizerModal(false)}
          onSaveNewPatient={handleSavePatient}
          onSelectCreatedPatient={(p) => setSelectedPatientId(p.id)}
        />
      )}

      {/* 2. New Patient Registration Modal */}
      {showNewPatientModal && (
        <NewPatientModal
          onClose={() => setShowNewPatientModal(false)}
          onSubmit={handleSavePatient}
          onSelectCreatedPatient={(p) => setSelectedPatientId(p.id)}
        />
      )}

      {/* 3. Add Vitals Modal */}
      {showVitalsModal && selectedPatient && (
        <AddVitalsModal
          patient={selectedPatient}
          onClose={() => setShowVitalsModal(false)}
          onSubmit={handleAddVitals}
        />
      )}

      {/* 4. Add Encounter (Doctor Consultation) Modal */}
      {showEncounterModal && selectedPatient && (
        <AddEncounterModal
          patient={selectedPatient}
          onClose={() => setShowEncounterModal(false)}
          onSubmit={handleAddEncounter}
        />
      )}

      {/* 5. Doctor's Clinical Notes Modal */}
      {showDoctorNotesModal && selectedPatient && (
        <DoctorNotesModal
          patient={selectedPatient}
          onClose={() => setShowDoctorNotesModal(false)}
          onNoteCreated={() => {
            refreshFromStorage();
          }}
          onOpenPrescriptionGenerator={(initialDiag, initialPlan) => {
            setShowDoctorNotesModal(false);
            setPrescriptionInitialData({ diagnosis: initialDiag, treatmentPlan: initialPlan });
            setShowPrescriptionModal(true);
          }}
        />
      )}

      {/* 6. Digital Prescription Generator Modal */}
      {showPrescriptionModal && selectedPatient && (
        <PrescriptionGeneratorModal
          patient={selectedPatient}
          initialDiagnosis={prescriptionInitialData.diagnosis}
          initialTreatmentPlan={prescriptionInitialData.treatmentPlan}
          onClose={() => setShowPrescriptionModal(false)}
          onPrescriptionCreated={() => {
            refreshFromStorage();
          }}
        />
      )}

      {/* 7. Pharmacy Inventory Management & Dispensary Modal */}
      {showPharmacyModal && (
        <PharmacyInventoryModal
          onClose={() => {
            setShowPharmacyModal(false);
            refreshFromStorage();
          }}
          onOpenPatient={(patientId) => {
            setSelectedPatientId(patientId);
            setShowPharmacyModal(false);
          }}
        />
      )}

      {/* 8. Live Google Search Grounded Medical & NAFDAC Intelligence */}
      {showMedicalSearchModal && (
        <MedicalSearchModal
          onClose={() => setShowMedicalSearchModal(false)}
        />
      )}

      {/* 9. Physical Records Room 2D Map Modal */}
      {showArchiveMapModal && (
        <PhysicalArchiveRoomView
          patients={patients}
          onClose={() => setShowArchiveMapModal(false)}
          onSelectPatient={(p) => setSelectedPatientId(p.id)}
          highlightFolderNumber={locateHighlightFolder}
        />
      )}

      {/* 10. Printable Folder Card Modal */}
      {showPrintCardModal && selectedPatient && (
        <PrintableFolderCardModal
          patient={selectedPatient}
          onClose={() => setShowPrintCardModal(false)}
        />
      )}

      {/* 11. Offline Cloud Sync & Vault Backup Modal */}
      {showSyncModal && (
        <OfflineSyncModal
          onClose={() => setShowSyncModal(false)}
          isOnline={isOnline}
          onRefreshData={refreshFromStorage}
        />
      )}

      {/* 12. Audio Dictation & Voice Transcription (gemini-3.5-transcribe) */}
      {showAudioTranscriberModal && (
        <AudioTranscriberModal
          onClose={() => setShowAudioTranscriberModal(false)}
          onApplyTranscript={async (transcriptText) => {
            if (selectedPatientId) {
              await logClinicalEncounter(selectedPatientId, {
                date: new Date().toISOString().split('T')[0],
                doctorName: 'Medical Dictation',
                department: 'General Outpatient (GOPD)',
                chiefComplaint: 'Voice Dictation Intake',
                historyOfPresentingIllness: transcriptText,
                examinationFindings: 'Recorded via Voice Dictation',
                diagnoses: ['Clinical Dictation'],
                prescriptions: [],
                investigationsOrdered: [],
                planAndFollowUp: 'Recorded via Voice Transcriber (gemini-3.5-transcribe)',
              });
            }
          }}
          initialContext={selectedPatient ? `Dictation for ${selectedPatient.folderNumber}` : 'General Clinical Dictation'}
        />
      )}

      {/* 13. Laboratory Reports & Imaging Diagnostics Modal */}
      {showLabReportsModal && (
        <LabReportsModal
          isOpen={showLabReportsModal}
          patient={selectedPatient}
          allPatients={patients}
          onClose={() => {
            setShowLabReportsModal(false);
            refreshFromStorage();
          }}
          onReportAdded={() => refreshFromStorage()}
        />
      )}

      {/* 14. Appointment Scheduler & Clinic Roster Modal */}
      {showAppointmentModal && (
        <AppointmentSchedulerModal
          isOpen={showAppointmentModal}
          currentRole={currentRole}
          patients={patients}
          selectedPatient={selectedPatient}
          onClose={() => {
            setShowAppointmentModal(false);
            refreshFromStorage();
          }}
          onSelectPatient={(p) => {
            setSelectedPatientId(p.id);
            setShowAppointmentModal(false);
          }}
          onAppointmentUpdated={() => refreshFromStorage()}
        />
      )}

    </div>
  );
}
