import React, { useState } from 'react';
import { 
  Folder, 
  MapPin, 
  HeartPulse, 
  Stethoscope, 
  Pill, 
  Printer, 
  Plus, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Calendar, 
  Phone, 
  User, 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  ShieldCheck, 
  Tag, 
  Edit3, 
  Trash2,
  ExternalLink,
  Sparkles,
  FileSignature,
  ClipboardList,
  Download,
  FlaskConical,
  CalendarDays
} from 'lucide-react';
import { PatientRecord, StaffRole, VitalsEntry, ClinicalEncounter, DigitalPrescription, LabReport, PatientAppointment } from '../types';

interface PatientDetailProps {
  patient: PatientRecord;
  currentRole: StaffRole;
  onOpenAddVitals: () => void;
  onOpenAddEncounter: () => void;
  onOpenDoctorNotes?: () => void;
  onOpenPrescriptionGenerator?: (initialDiag?: string, initialPlan?: string) => void;
  onPrintCard: () => void;
  onLocateFolder: () => void;
  onDispenseMedication: (rxId: string) => void;
  onEditPatient: (patient: PatientRecord) => void;
  onDeletePatient: (patientId: string) => void;
  onOpenDigitizer: () => void;
  onOpenLabReportsModal?: () => void;
  onOpenAppointmentScheduler?: () => void;
}

type TabType = 'overview' | 'vitals' | 'encounters' | 'doctor_notes' | 'prescriptions' | 'lab_reports' | 'appointments' | 'physical_archive' | 'paper_scans';

export const PatientDetail: React.FC<PatientDetailProps> = ({
  patient,
  currentRole,
  onOpenAddVitals,
  onOpenAddEncounter,
  onOpenDoctorNotes,
  onOpenPrescriptionGenerator,
  onPrintCard,
  onLocateFolder,
  onDispenseMedication,
  onEditPatient,
  onDeletePatient,
  onOpenDigitizer,
  onOpenLabReportsModal,
  onOpenAppointmentScheduler
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedPrintPrescription, setSelectedPrintPrescription] = useState<DigitalPrescription | null>(null);

  const isSS = patient.genotype === 'SS';
  const latestVitals = patient.vitalsHistory?.[0];

  return (
    <div className="flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      
      {/* Top Banner & Patient Master Identity Header */}
      <div className="bg-white border-b border-slate-200 p-4 sm:p-6 sticky top-0 z-10 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Folder ID, Patient Name & Critical Clinical Tags */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-amber-300 flex flex-col items-center justify-center font-mono font-black shadow-xs shrink-0">
              <Folder className="w-6 h-6 text-teal-200" />
            </div>

            <div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-mono font-extrabold text-sm sm:text-base px-2.5 py-0.5 rounded-lg bg-slate-900 text-amber-300 tracking-wide shadow-xs">
                  {patient.folderNumber}
                </span>

                {/* Genotype Indicator */}
                <span 
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    isSS
                      ? 'bg-rose-600 text-white animate-pulse'
                      : patient.genotype === 'AS'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                  title={isSS ? 'Sickle Cell Disease (Hb SS) Alert' : `Genotype Hb ${patient.genotype}`}
                >
                  {isSS && <ShieldAlert className="w-3.5 h-3.5" />}
                  Hb {patient.genotype}
                </span>

                {/* Blood Group */}
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300">
                  Blood Group: {patient.bloodGroup}
                </span>

                {/* Physical Paper Folder Condition */}
                <span 
                  onClick={onLocateFolder}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md border cursor-pointer flex items-center gap-1 hover:underline ${
                    patient.physicalArchive.folderCondition === 'Good'
                      ? 'bg-slate-50 text-slate-700 border-slate-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                  title="Click to view shelf map"
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  {patient.physicalArchive.cabinetRack} ({patient.physicalArchive.boxNumber})
                </span>
              </div>

              {/* Patient Full Name */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 leading-tight">
                {patient.surname}, {patient.firstName} {patient.otherNames || ''}
              </h1>

              {/* Bio Subtitle */}
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                <span>{patient.gender}</span>
                <span>•</span>
                <span>DOB: {patient.dateOfBirth}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                </span>
                <span>•</span>
                <span>{patient.stateOfOrigin} State ({patient.lga})</span>
                {patient.nhiaNumber && (
                  <>
                    <span>•</span>
                    <span className="bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                      NHIA: {patient.nhiaNumber}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap lg:justify-end">
            <button
              onClick={onOpenAddVitals}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-teal-700 border border-teal-300 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-teal-600" />
              <span>Record Vitals</span>
            </button>

            {onOpenDoctorNotes && (
              <button
                onClick={onOpenDoctorNotes}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Structured Doctor's Clinical Note (Symptoms, Diagnosis, Plan)"
              >
                <ClipboardList className="w-4 h-4 text-teal-600" />
                <span>Doctor's Note</span>
              </button>
            )}

            {onOpenPrescriptionGenerator && (
              <button
                onClick={() => onOpenPrescriptionGenerator()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Generate Digital Prescription (MDCN Compliant, Printable & PDF)"
              >
                <FileSignature className="w-4 h-4 text-emerald-200" />
                <span>Digital Rx</span>
              </button>
            )}

            <button
              onClick={() => {
                if (onOpenLabReportsModal) onOpenLabReportsModal();
                else setActiveTab('lab_reports');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Upload or view patient laboratory test results and radiology scans"
            >
              <FlaskConical className="w-4 h-4 text-teal-600" />
              <span>Lab Results ({patient.labReports?.length || 0})</span>
            </button>

            <button
              onClick={() => {
                if (onOpenAppointmentScheduler) onOpenAppointmentScheduler();
                else setActiveTab('appointments');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Book follow-up consultation or view upcoming clinic schedule"
            >
              <CalendarDays className="w-4 h-4 text-teal-700" />
              <span>Schedule Visit</span>
            </button>

            <button
              onClick={onOpenAddEncounter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>Doctor Consultation</span>
            </button>

            <button
              onClick={onPrintCard}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Print laminated Folder Barcode / ID Card"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Print ID Card</span>
            </button>
          </div>

        </div>

        {/* Clinical Alert Banners (Allergies & Sickle Cell) */}
        {(isSS || (patient.allergies && patient.allergies.length > 0)) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            {isSS && (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Sickle Cell Alert: Hydration priority, caution with analgesics, VOC crisis protocol.</span>
              </div>
            )}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Drug Allergies: {patient.allergies.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-200/80 overflow-x-auto text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Bio-data & File Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'vitals'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Vitals History ({patient.vitalsHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('doctor_notes')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'doctor_notes'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Doctor's Notes ({patient.doctorNotes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'prescriptions'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>Digital Prescriptions ({patient.digitalPrescriptions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('lab_reports')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'lab_reports'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Lab & Imaging ({patient.labReports?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'appointments'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Appointments ({patient.appointments?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('encounters')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'encounters'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Consultations ({patient.encounters?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('physical_archive')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'physical_archive'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Physical Shelf Location</span>
          </button>

          <button
            onClick={() => setActiveTab('paper_scans')}
            className={`px-3.5 py-2 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'paper_scans'
                ? 'bg-teal-700 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Paper Scans ({patient.paperScanImages?.length || 0})</span>
          </button>
        </div>

      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-6 max-w-5xl w-full">
        
        {/* TAB 1: OVERVIEW & BIO-DATA */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Latest Vitals Snapshot Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Latest Vitals</span>
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                </div>
                {latestVitals ? (
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      {latestVitals.bpSystolic}/{latestVitals.bpDiastolic}{' '}
                      <span className="text-xs font-normal text-slate-400">mmHg</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Temp</span>
                        <strong className="text-slate-800">{latestVitals.temperature}°C</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Pulse</span>
                        <strong className="text-slate-800">{latestVitals.pulseRate} bpm</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">SpO2</span>
                        <strong className="text-slate-800">{latestVitals.spo2 || '--'}%</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">BMI</span>
                        <strong className="text-slate-800">{latestVitals.bmi || '--'}</strong>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      Recorded on {new Date(latestVitals.recordedAt).toLocaleDateString()} by {latestVitals.recordedBy}
                    </p>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400">No vitals logged yet</p>
                    <button
                      onClick={onOpenAddVitals}
                      className="mt-2 text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      + Record First Vitals
                    </button>
                  </div>
                )}
              </div>

              {/* Physical Archive Location Snapshot */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Physical Record Room</span>
                  <MapPin className="w-4 h-4 text-teal-600" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-black text-slate-900">
                    {patient.physicalArchive.cabinetRack}
                  </div>
                  <div className="text-xs text-slate-600">
                    {patient.physicalArchive.shelfLevel} • <strong>{patient.physicalArchive.boxNumber}</strong>
                  </div>
                  <div className="pt-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      patient.physicalArchive.folderCondition === 'Good'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      Paper Status: {patient.physicalArchive.folderCondition}
                    </span>
                  </div>
                  <button
                    onClick={onLocateFolder}
                    className="mt-2 text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View Room Map & Shelf Walkway →
                  </button>
                </div>
              </div>

              {/* Active Care & Prescriptions Snapshot */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Active Encounters</span>
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                </div>
                {patient.encounters && patient.encounters.length > 0 ? (
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      Last: {patient.encounters[0].department}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {patient.encounters[0].diagnoses.join(', ')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Dr. {patient.encounters[0].doctorName} • {patient.encounters[0].date}
                    </p>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400">No consultations logged</p>
                    <button
                      onClick={onOpenAddEncounter}
                      className="mt-2 text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                    >
                      + Add Consultation Note
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Detailed Biodata Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Patient Hospital Registration Bio-data
                </h3>
                <button
                  onClick={() => onPrintCard()}
                  className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Patient Folder Card
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Hospital Folder Number</span>
                  <strong className="text-slate-900 font-mono text-sm">{patient.folderNumber}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">National Identification Number (NIN)</span>
                  <strong className="text-slate-900 font-mono">{patient.nin || 'Not provided'}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">NHIA / HMO Insurance Number</span>
                  <strong className="text-slate-900">{patient.nhiaNumber || 'Private / Fee-for-Service'}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">State of Origin & LGA</span>
                  <strong className="text-slate-900">{patient.stateOfOrigin} State ({patient.lga} LGA)</strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Residential Street Address</span>
                  <strong className="text-slate-900">{patient.residentialAddress}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Occupation</span>
                  <strong className="text-slate-900">{patient.occupation || 'Self-employed / Trader'}</strong>
                </div>

                {/* Next of Kin */}
                <div className="md:col-span-2 pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">
                    Emergency Next of Kin
                  </span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px]">Name</span>
                      <p className="font-bold text-slate-800">{patient.nextOfKin.name}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Relationship</span>
                      <p className="font-bold text-slate-800">{patient.nextOfKin.relationship}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Phone Number</span>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {patient.nextOfKin.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chronic Conditions & Allergies */}
                <div className="md:col-span-2 pt-2 border-t border-slate-100 flex flex-wrap gap-4">
                  <div className="flex-1">
                    <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">
                      Chronic Diagnoses
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                        patient.chronicConditions.map((c) => (
                          <span key={c} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">None logged</span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <span className="text-slate-400 block mb-1 font-semibold uppercase text-[10px]">
                      Documented Allergies
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies && patient.allergies.length > 0 ? (
                        patient.allergies.map((a) => (
                          <span key={a} className="bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold">
                            ⚠️ {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">No known drug allergies (NKDA)</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: VITALS & TRIAGE HISTORY */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Patient Vitals & Triage History</h3>
                <p className="text-xs text-slate-500">Chronological history of nursing triage measurements</p>
              </div>
              <button
                onClick={onOpenAddVitals}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Log New Vitals
              </button>
            </div>

            {patient.vitalsHistory && patient.vitalsHistory.length > 0 ? (
              <div className="space-y-3">
                {patient.vitalsHistory.map((v) => (
                  <div key={v.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          v.triageCategory === 'Emergency (Red)'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : v.triageCategory === 'Priority (Yellow)'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {v.triageCategory}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(v.recordedAt).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        By {v.recordedBy}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mt-3 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Blood Pressure</span>
                        <strong className="text-sm text-slate-900">{v.bpSystolic}/{v.bpDiastolic}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Temperature</span>
                        <strong className="text-sm text-slate-900">{v.temperature}°C</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Pulse Rate</span>
                        <strong className="text-sm text-slate-900">{v.pulseRate} bpm</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Resp. Rate</span>
                        <strong className="text-sm text-slate-900">{v.respiratoryRate} /min</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
                        <strong className="text-sm text-slate-900">{v.spo2 ? `${v.spo2}%` : '--'}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">Weight</span>
                        <strong className="text-sm text-slate-900">{v.weightKg} kg</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 block font-semibold">BMI</span>
                        <strong className="text-sm text-slate-900">{v.bmi || '--'}</strong>
                      </div>
                    </div>

                    {v.clinicalNotes && (
                      <p className="mt-3 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                        <strong className="text-slate-800">Nurse Remarks:</strong> {v.clinicalNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <HeartPulse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Vitals History</p>
                <p className="text-xs text-slate-400 mt-0.5">No vitals have been captured for this patient yet.</p>
                <button
                  onClick={onOpenAddVitals}
                  className="mt-3 px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Record First Vitals
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: DOCTOR'S CLINICAL NOTES */}
        {activeTab === 'doctor_notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Doctor's Clinical Notes</h3>
                <p className="text-xs text-slate-500">Structured patient history, physical examination, diagnoses, and management plans</p>
              </div>
              {onOpenDoctorNotes && (
                <button
                  onClick={onOpenDoctorNotes}
                  className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Write Doctor's Note
                </button>
              )}
            </div>

            {patient.doctorNotes && patient.doctorNotes.length > 0 ? (
              <div className="space-y-4">
                {patient.doctorNotes.map((note) => (
                  <div key={note.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-teal-300">{note.doctorName}</span>
                          {note.doctorMdcn && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                              MDCN: {note.doctorMdcn}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">• {new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{note.department || 'General Practice'}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-teal-950 text-teal-200 border border-teal-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {note.primaryDiagnosis}
                        </span>
                        {onOpenPrescriptionGenerator && (
                          <button
                            onClick={() => onOpenPrescriptionGenerator(note.primaryDiagnosis, note.treatmentPlan)}
                            className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Generate a signed prescription matching this clinical note"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>Create Rx</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="p-5 space-y-4 text-xs">
                      {/* Symptoms & Presenting Complaints */}
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px] mb-1">
                          Presenting Complaints & Symptoms
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {note.symptoms.map((s, i) => (
                            <span key={i} className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Observations */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">
                          Clinical Observations & Examination Findings
                        </span>
                        <p className="text-slate-800 mt-1 whitespace-pre-line leading-relaxed font-sans bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {note.clinicalObservations}
                        </p>
                      </div>

                      {/* Vitals Snapshot if attached */}
                      {note.vitalsSnapshot && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 block font-bold uppercase text-[10px] mb-1">
                            Vitals at Consultation
                          </span>
                          <div className="flex flex-wrap gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            {note.vitalsSnapshot.bloodPressure && <span><strong>BP:</strong> {note.vitalsSnapshot.bloodPressure}</span>}
                            {note.vitalsSnapshot.temperature && <span><strong>Temp:</strong> {note.vitalsSnapshot.temperature}°C</span>}
                            {note.vitalsSnapshot.pulse && <span><strong>Pulse:</strong> {note.vitalsSnapshot.pulse} bpm</span>}
                            {note.vitalsSnapshot.spo2 && <span><strong>SpO2:</strong> {note.vitalsSnapshot.spo2}%</span>}
                          </div>
                        </div>
                      )}

                      {/* Treatment Plan & Investigations */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 block font-bold uppercase text-[10px]">Treatment Plan & Regimen</span>
                          <p className="text-slate-800 mt-1 font-medium">{note.treatmentPlan}</p>
                        </div>
                        {note.investigationsOrdered && note.investigationsOrdered.length > 0 && (
                          <div>
                            <span className="text-slate-400 block font-bold uppercase text-[10px]">Lab / Radiology Ordered</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.investigationsOrdered.map((inv, i) => (
                                <span key={i} className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                  {inv}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Doctor's Clinical Notes Logged</p>
                <p className="text-xs text-slate-400 mt-0.5">Capture comprehensive patient symptoms, examination findings, and clinical orders.</p>
                {onOpenDoctorNotes && (
                  <button
                    onClick={onOpenDoctorNotes}
                    className="mt-3 px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Write First Doctor's Note
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: DIGITAL PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Digital Prescriptions (e-Rx)</h3>
                <p className="text-xs text-slate-500">Official MDCN-authenticated prescriptions with auto-inventory linkage</p>
              </div>
              {onOpenPrescriptionGenerator && (
                <button
                  onClick={() => onOpenPrescriptionGenerator()}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Generate Prescription
                </button>
              )}
            </div>

            {patient.digitalPrescriptions && patient.digitalPrescriptions.length > 0 ? (
              <div className="space-y-4">
                {patient.digitalPrescriptions.map((rx) => (
                  <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Prescription Top Banner */}
                    <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-emerald-400">{rx.prescriptionNumber}</span>
                          <span className="text-xs text-slate-400">• Date: {rx.dateIssued}</span>
                          {rx.isDispensed ? (
                            <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Dispensed {rx.dispensedDate && `on ${rx.dispensedDate}`}
                            </span>
                          ) : (
                            <span className="bg-amber-950 text-amber-300 border border-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Pending Pharmacy Dispense
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          <strong>Diagnosis:</strong> {rx.diagnosis} {rx.notes ? `• ${rx.notes}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPrintPrescription(rx);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                          title="Print or save as PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-400" />
                          <span>Print / PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Medications Table */}
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                            <th className="pb-2">Medication</th>
                            <th className="pb-2">Dosage</th>
                            <th className="pb-2">Frequency</th>
                            <th className="pb-2">Duration</th>
                            <th className="pb-2">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rx.medications.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 font-bold text-slate-900">{m.medicationName}</td>
                              <td className="py-2.5 text-slate-700">{m.dosage}</td>
                              <td className="py-2.5 text-slate-700">{m.frequency}</td>
                              <td className="py-2.5 text-slate-700">{m.duration}</td>
                              <td className="py-2.5 text-slate-500 italic">{m.instructions || 'As directed'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Prescription Footer: Doctor's Signature & Verification */}
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <FileSignature className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{rx.doctorName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            MDCN Reg: {rx.doctorMdcn} • Verified Digital Signature Stamp
                          </p>
                        </div>
                      </div>

                      {rx.doctorSignature && (
                        <div className="border border-slate-300 rounded-lg px-3 py-1 bg-white shadow-2xs">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Doctor's Signature</span>
                          <span className="font-serif italic font-bold text-slate-900 text-sm">
                            {rx.doctorSignature}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <FileSignature className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Digital Prescriptions Issued</p>
                <p className="text-xs text-slate-400 mt-0.5">Authorized medical officers can generate and sign digital prescriptions linked to hospital pharmacy inventory.</p>
                {onOpenPrescriptionGenerator && (
                  <button
                    onClick={() => onOpenPrescriptionGenerator()}
                    className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Issue First Prescription
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'encounters' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Medical Doctor Consultations</h3>
                <p className="text-xs text-slate-500">Official clinical SOAP notes, prescriptions & investigations</p>
              </div>
              <button
                onClick={onOpenAddEncounter}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-300" /> New Consultation Note
              </button>
            </div>

            {patient.encounters && patient.encounters.length > 0 ? (
              <div className="space-y-4">
                {patient.encounters.map((enc) => (
                  <div key={enc.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-teal-300">{enc.department}</span>
                          <span className="text-xs text-slate-400">• {enc.date}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{enc.doctorName}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {enc.diagnoses.map((d) => (
                          <span key={d} className="bg-teal-950 text-teal-200 border border-teal-800/80 px-2 py-0.5 rounded text-[11px] font-bold">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* SOAP Body */}
                    <div className="p-5 space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-bold uppercase text-[10px]">Subjective (Chief Complaint & HPI)</span>
                        <p className="font-semibold text-slate-900 mt-0.5">{enc.chiefComplaint}</p>
                        {enc.historyOfPresentingIllness && (
                          <p className="text-slate-600 mt-1 leading-relaxed">{enc.historyOfPresentingIllness}</p>
                        )}
                      </div>

                      {enc.examinationFindings && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 block font-bold uppercase text-[10px]">Objective (Clinical Examination)</span>
                          <p className="text-slate-700 mt-0.5 leading-relaxed">{enc.examinationFindings}</p>
                        </div>
                      )}

                      {/* Prescriptions */}
                      {enc.prescriptions && enc.prescriptions.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <span className="text-slate-800 block font-bold uppercase text-[10px] mb-2 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-teal-700" />
                            Prescribed Medications & Pharmacy Status
                          </span>
                          <div className="space-y-2">
                            {enc.prescriptions.map((rx) => (
                              <div key={rx.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                                <div>
                                  <span className="font-bold text-slate-900">{rx.drug}</span>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    Dose: {rx.dose} • Route: {rx.route} • Freq: {rx.frequency} • Duration: {rx.duration}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {rx.dispensed ? (
                                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Dispensed
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => onDispenseMedication(rx.id)}
                                      className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold px-3 py-1 rounded-md transition shadow-2xs cursor-pointer"
                                      title="Mark medication as dispensed from pharmacy"
                                    >
                                      Dispense at Pharmacy
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Investigations Ordered */}
                      {enc.investigationsOrdered && enc.investigationsOrdered.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 block font-bold uppercase text-[10px] mb-1">
                            Laboratory & Diagnostic Investigations
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {enc.investigationsOrdered.map((test) => (
                              <span key={test} className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                                🔬 {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Management Plan & Follow-up */}
                      {enc.planAndFollowUp && (
                        <div className="pt-2 border-t border-slate-100 bg-teal-50/50 p-2.5 rounded-xl border border-teal-100">
                          <span className="text-teal-900 block font-bold uppercase text-[10px]">
                            Plan & Review Schedule
                          </span>
                          <p className="text-teal-950 mt-0.5">{enc.planAndFollowUp}</p>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Consultation Notes Yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Doctor encounters and case notes will appear here.</p>
                <button
                  onClick={onOpenAddEncounter}
                  className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Write First Doctor Note
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PHYSICAL SHELF ARCHIVE LOCATOR */}
        {activeTab === 'physical_archive' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Physical Filing Jacket Locator</h3>
                    <p className="text-xs text-slate-500">
                      Exact coordinates for hospital records staff to retrieve the physical card jacket.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLocateFolder}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  Open Record Room 2D Map →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Hospital Record Room</span>
                  <strong className="text-sm text-slate-900">{patient.physicalArchive.recordRoom}</strong>
                </div>

                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <span className="text-teal-700 text-[10px] uppercase font-bold block">Filing Rack / Cabinet</span>
                  <strong className="text-sm text-teal-950">{patient.physicalArchive.cabinetRack}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Shelf Tier Level</span>
                  <strong className="text-sm text-slate-900">{patient.physicalArchive.shelfLevel}</strong>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-800 text-[10px] uppercase font-bold block">Archival Storage Box</span>
                  <strong className="text-sm text-amber-950">{patient.physicalArchive.boxNumber}</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Physical Folder Condition</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">
                    {patient.physicalArchive.folderCondition}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Paper folder created: {patient.physicalArchive.originalPaperCreatedAt || 'Historical archive'}
                  </p>
                </div>
                <button
                  onClick={onPrintCard}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-teal-600 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Shelf Label Barcode
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: ORIGINAL PAPER SCANS */}
        {activeTab === 'paper_scans' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Original Digitized Paper Slips</h3>
                <p className="text-xs text-slate-500">Photographic proof of historical paper face-sheets and doctor notes</p>
              </div>
              <button
                onClick={onOpenDigitizer}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" /> Digitize Another Slip
              </button>
            </div>

            {patient.paperScanImages && patient.paperScanImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {patient.paperScanImages.map((scan) => (
                  <div key={scan.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="h-64 bg-slate-900 flex items-center justify-center relative overflow-hidden group">
                      <img
                        src={scan.url}
                        alt={scan.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <a
                          href={scan.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Full Resolution
                        </a>
                      </div>
                    </div>
                    <div className="p-3 text-xs bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{scan.label}</p>
                        <p className="text-[10px] text-slate-400">
                          Scanned on {new Date(scan.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {scan.extractedByAi && (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          AI Transcribed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Paper Scans Attached</p>
                <p className="text-xs text-slate-400 mt-0.5">You can upload a photo of the patient&apos;s old physical card slip.</p>
                <button
                  onClick={onOpenDigitizer}
                  className="mt-3 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Scan Paper Folder Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: LABORATORY & RADIOLOGY REPORTS */}
        {activeTab === 'lab_reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Diagnostic Laboratory & Radiology Reports</h3>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                    AMLSCN & RRBN
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pathology investigations, chemical pathology, ultrasound scans, urinalysis and X-ray films for {patient.surname}, {patient.firstName}.
                </p>
              </div>

              {onOpenLabReportsModal && (
                <button
                  type="button"
                  onClick={onOpenLabReportsModal}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enter New Test Result</span>
                </button>
              )}
            </div>

            {patient.labReports && patient.labReports.length > 0 ? (
              <div className="space-y-5">
                {patient.labReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 hover:border-teal-600 transition"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-bold rounded-md ${
                              report.category === 'Blood Work'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : report.category === 'Radiology'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : report.category === 'Urinalysis'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {report.category}
                          </span>

                          <h4 className="text-sm font-extrabold text-slate-900">{report.testName}</h4>

                          {report.status === 'Critical Alert' && (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-600 text-white rounded-md flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              CRITICAL
                            </span>
                          )}
                          {report.isFlaggedAbnormal && report.status !== 'Critical Alert' && (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                              Abnormal Values
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Specimen: <strong className="text-slate-700">{report.specimenType}</strong></span>
                          <span>Report Date: <strong className="text-slate-700">{report.reportDate}</strong></span>
                          <span>Scientist: <strong className="text-slate-700">{report.performedBy || 'MLS'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <span className="text-xs px-2.5 py-1 font-semibold bg-slate-100 text-slate-700 rounded-lg">
                          {report.status}
                        </span>
                        {onOpenLabReportsModal && (
                          <button
                            type="button"
                            onClick={onOpenLabReportsModal}
                            className="px-2.5 py-1 text-xs font-medium text-teal-800 hover:bg-teal-50 rounded-lg border border-teal-200 transition"
                          >
                            View Full Slip
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Parameters Table */}
                    {report.parameters && report.parameters.length > 0 && (
                      <div className="overflow-x-auto border border-slate-100 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                            <tr>
                              <th className="py-2 px-3">Parameter</th>
                              <th className="py-2 px-3">Observed Value</th>
                              <th className="py-2 px-3">Unit</th>
                              <th className="py-2 px-3">Reference Range</th>
                              <th className="py-2 px-3">Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {report.parameters.map((p, idx) => (
                              <tr key={idx} className={p.isAbnormal ? 'bg-rose-50/40 font-medium' : 'bg-white'}>
                                <td className="py-2 px-3 text-slate-800">{p.name}</td>
                                <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.value}</td>
                                <td className="py-2 px-3 text-slate-500">{p.unit || '—'}</td>
                                <td className="py-2 px-3 text-slate-400">{p.referenceRange || '—'}</td>
                                <td className="py-2 px-3">
                                  {p.flag === 'Critical' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">
                                      CRIT
                                    </span>
                                  )}
                                  {p.flag === 'High' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded">
                                      HIGH
                                    </span>
                                  )}
                                  {p.flag === 'Low' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded">
                                      LOW
                                    </span>
                                  )}
                                  {p.flag === 'Normal' && (
                                    <span className="px-1.5 py-0.5 text-[10px] text-emerald-800 bg-emerald-50 rounded">
                                      Normal
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Microscopic Findings or Radiologist Impression */}
                    {report.findingsOrImpression && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        <strong className="block text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                          Diagnostic Findings / Impression:
                        </strong>
                        {report.findingsOrImpression}
                      </div>
                    )}

                    {/* Clinical Notes */}
                    {report.clinicalCorrelationNotes && (
                      <p className="text-xs text-slate-600 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                        <strong className="text-amber-900">Clinical Advisory: </strong>
                        {report.clinicalCorrelationNotes}
                      </p>
                    )}

                    {/* Attached Scan Preview */}
                    {report.attachmentUrl && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <img
                          src={report.attachmentUrl}
                          alt="Scan preview"
                          className="w-12 h-12 object-cover rounded-md border border-slate-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">{report.attachmentName || 'Diagnostic Scan Film'}</p>
                          <a
                            href={report.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-700 font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>Open Full Scan in Viewer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Laboratory Reports Logged</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record full blood count, malaria microscopy, urinalysis, chemistry, or radiology ultrasound scans.
                </p>
                {onOpenLabReportsModal && (
                  <button
                    type="button"
                    onClick={onOpenLabReportsModal}
                    className="mt-3 px-4 py-2 bg-teal-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Enter First Test Result
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: APPOINTMENTS & CLINIC SCHEDULE */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">Patient Appointment History & Follow-ups</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled clinic visits, follow-up consultations, and specialist reviews linked to folder {patient.folderNumber}.
                </p>
              </div>

              {onOpenAppointmentScheduler && (
                <button
                  type="button"
                  onClick={onOpenAppointmentScheduler}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Next Visit</span>
                </button>
              )}
            </div>

            {patient.appointments && patient.appointments.length > 0 ? (
              <div className="space-y-3">
                {patient.appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-teal-600 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-center shrink-0">
                        <span className="block text-xs font-mono font-bold text-slate-900">{apt.appointmentDate}</span>
                        <span className="text-[10px] text-teal-700 font-bold font-mono">{apt.timeSlot}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{apt.clinic}</h4>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              apt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : apt.status === 'Checked-In'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : apt.status === 'In Consultation'
                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-600">
                          <span>Doctor: <strong className="text-slate-800">{apt.doctorName}</strong></span>
                          <span>Type: <strong className="text-slate-700">{apt.appointmentType}</strong></span>
                        </div>

                        <p className="mt-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <strong className="text-slate-500">Reason: </strong>
                          {apt.reasonForVisit}
                        </p>

                        {apt.clinicNotes && (
                          <p className="mt-1 text-[11px] text-slate-500 italic">
                            Special Instructions: {apt.clinicNotes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {onOpenAppointmentScheduler && (
                        <button
                          type="button"
                          onClick={onOpenAppointmentScheduler}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition cursor-pointer"
                        >
                          View in Schedule
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Scheduled Follow-ups</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  The front desk or doctor can schedule subsequent clinic dates, lab review appointments, or ANC sessions.
                </p>
                {onOpenAppointmentScheduler && (
                  <button
                    type="button"
                    onClick={onOpenAppointmentScheduler}
                    className="mt-3 px-4 py-2 bg-teal-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Schedule an Appointment
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
