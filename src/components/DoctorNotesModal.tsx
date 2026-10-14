import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Stethoscope, 
  Activity, 
  Check, 
  Mic, 
  Calendar, 
  AlertCircle, 
  Save, 
  ArrowRight,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { PatientRecord, DoctorNote } from '../types';
import { HOSPITAL_DEPARTMENTS, COMMON_DIAGNOSES } from '../lib/nigerianData';
import { createDoctorNote } from '../lib/storage';
import { AudioTranscriberModal } from './AudioTranscriberModal';

interface DoctorNotesModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onNoteCreated?: (note: DoctorNote) => void;
  onOpenPrescriptionGenerator?: (initialDiag: string, initialPlan: string) => void;
}

export const DoctorNotesModal: React.FC<DoctorNotesModalProps> = ({
  patient,
  onClose,
  onNoteCreated,
  onOpenPrescriptionGenerator,
}) => {
  // Predefined fields
  const [department, setDepartment] = useState<string>('General Outpatient (GOPD)');
  const [urgency, setUrgency] = useState<'Routine' | 'Urgent' | 'Critical / Admit'>('Routine');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState<string[]>([]);
  const [customSecondary, setCustomSecondary] = useState('');

  // Latest vitals prefill
  const latestVitals = patient.vitalsHistory && patient.vitalsHistory.length > 0 ? patient.vitalsHistory[0] : null;
  const [vitalBp, setVitalBp] = useState(latestVitals ? `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic} mmHg` : '120/80 mmHg');
  const [vitalPulse, setVitalPulse] = useState<number | undefined>(latestVitals?.pulseRate || 76);
  const [vitalTemp, setVitalTemp] = useState<number | undefined>(latestVitals?.temperature || 36.8);
  const [vitalSpo2, setVitalSpo2] = useState<number | undefined>(latestVitals?.spo2 || 98);
  const [vitalWeight, setVitalWeight] = useState<number | undefined>(latestVitals?.weightKg || 70);

  // Free-text area for detailed observations
  const [clinicalObservations, setClinicalObservations] = useState('');

  // Treatment plan
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [investigations, setInvestigations] = useState<string[]>([]);
  const [customLab, setCustomLab] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Doctor credentials
  const [doctorName, setDoctorName] = useState('Dr. Chidi Okafor (MBBS, FWACP)');
  const [doctorMdcnNumber, setDoctorMdcnNumber] = useState('MDCN/R/64821');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDictationField, setActiveDictationField] = useState<'chiefComplaint' | 'clinicalObservations' | 'treatmentPlan' | null>(null);

  // Common quick investigations
  const COMMON_LABS = [
    'Malaria Parasite (MP) / RDT',
    'Full Blood Count (FBC/PCV)',
    'Widal Test (Typhoid)',
    'Urinalysis',
    'Serum Electrolytes, Urea, Creatinine (E/U/Cr)',
    'Blood Glucose (Fasting/RBS)',
    'Chest X-Ray',
    'Abdominal Ultrasound'
  ];

  const handleApplyAudioTranscript = (transcriptText: string) => {
    if (!activeDictationField) return;
    if (activeDictationField === 'chiefComplaint') {
      setChiefComplaint((prev) => (prev ? `${prev} ${transcriptText}` : transcriptText));
    } else if (activeDictationField === 'clinicalObservations') {
      setClinicalObservations((prev) => (prev ? `${prev}\n${transcriptText}` : transcriptText));
    } else if (activeDictationField === 'treatmentPlan') {
      setTreatmentPlan((prev) => (prev ? `${prev}\n${transcriptText}` : transcriptText));
    }
  };

  const toggleInvestigation = (lab: string) => {
    if (investigations.includes(lab)) {
      setInvestigations(investigations.filter((l) => l !== lab));
    } else {
      setInvestigations([...investigations, lab]);
    }
  };

  const handleAddCustomLab = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customLab.trim()) {
      e.preventDefault();
      if (!investigations.includes(customLab.trim())) {
        setInvestigations([...investigations, customLab.trim()]);
      }
      setCustomLab('');
    }
  };

  const handleSubmit = async (andOpenRx: boolean = false) => {
    if (!chiefComplaint.trim()) {
      alert('Please enter the Chief Complaint.');
      return;
    }
    if (!diagnosis.trim()) {
      alert('Please select or specify a Primary Diagnosis.');
      return;
    }
    if (!clinicalObservations.trim()) {
      alert('Please provide Clinical Observations.');
      return;
    }
    if (!treatmentPlan.trim()) {
      alert('Please outline the Treatment Plan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const note = await createDoctorNote(patient.id, {
        doctorName,
        doctorMdcnNumber,
        department,
        chiefComplaint,
        diagnosis,
        secondaryDiagnoses,
        vitalSignsSnapshot: {
          bp: vitalBp,
          pulse: vitalPulse,
          temp: vitalTemp,
          spo2: vitalSpo2,
          weight: vitalWeight,
        },
        clinicalObservations,
        treatmentPlan,
        investigations,
        followUpDate: followUpDate || undefined,
        urgency,
      });

      if (onNoteCreated) {
        onNoteCreated(note);
      }

      if (andOpenRx && onOpenPrescriptionGenerator) {
        onClose();
        onOpenPrescriptionGenerator(diagnosis, treatmentPlan);
      } else {
        onClose();
      }
    } catch (err: any) {
      alert('Failed to save doctor note: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Doctor's Clinical Notes & Treatment Plan</h3>
              <p className="text-[11px] text-slate-300">
                Patient: <span className="font-bold text-white">{patient.surname}, {patient.firstName}</span> • Folder: <span className="font-mono text-teal-300">{patient.folderNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}
          className="p-5 max-h-[85vh] overflow-y-auto space-y-4"
        >
          {/* Top Metadata Bar: Doctor, Dept, Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Attending Doctor & MDCN
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full font-bold text-slate-900 text-xs px-2 py-1 bg-white border border-slate-300 rounded-md"
              />
              <input
                type="text"
                value={doctorMdcnNumber}
                onChange={(e) => setDoctorMdcnNumber(e.target.value)}
                className="w-full font-mono text-[11px] text-slate-600 px-2 py-0.5 bg-white border border-slate-300 rounded-md mt-1"
                placeholder="MDCN Reg #"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Clinic / Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-md font-medium"
              >
                {HOSPITAL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                Clinical Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className={`w-full text-xs px-2 py-1.5 bg-white border rounded-md font-bold ${
                  urgency === 'Critical / Admit'
                    ? 'border-red-500 text-red-700 bg-red-50'
                    : urgency === 'Urgent'
                    ? 'border-amber-500 text-amber-700 bg-amber-50'
                    : 'border-slate-300 text-slate-800'
                }`}
              >
                <option value="Routine">Routine Outpatient</option>
                <option value="Urgent">Urgent Review</option>
                <option value="Critical / Admit">Critical / Require Admission</option>
              </select>
            </div>
          </div>

          {/* Vitals Signs Snapshot at Time of Note */}
          <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-teal-900 flex items-center gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5 text-teal-700" />
                Vitals Snapshot (Triage Record)
              </span>
              <span className="text-[10px] text-teal-700">Auto-linked to patient case history</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div>
                <label className="text-[10px] text-slate-500 block">BP</label>
                <input
                  type="text"
                  value={vitalBp}
                  onChange={(e) => setVitalBp(e.target.value)}
                  className="w-full bg-white px-2 py-1 border border-teal-200 rounded font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Pulse (bpm)</label>
                <input
                  type="number"
                  value={vitalPulse || ''}
                  onChange={(e) => setVitalPulse(Number(e.target.value))}
                  className="w-full bg-white px-2 py-1 border border-teal-200 rounded font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalTemp || ''}
                  onChange={(e) => setVitalTemp(Number(e.target.value))}
                  className="w-full bg-white px-2 py-1 border border-teal-200 rounded font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">SpO2 (%)</label>
                <input
                  type="number"
                  value={vitalSpo2 || ''}
                  onChange={(e) => setVitalSpo2(Number(e.target.value))}
                  className="w-full bg-white px-2 py-1 border border-teal-200 rounded font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={vitalWeight || ''}
                  onChange={(e) => setVitalWeight(Number(e.target.value))}
                  className="w-full bg-white px-2 py-1 border border-teal-200 rounded font-bold"
                />
              </div>
            </div>
          </div>

          {/* Predefined Field: Chief Complaint */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                1. Chief Complaint & Presenting Symptoms <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setActiveDictationField('chiefComplaint')}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer border border-sky-200"
                title="Dictate with microphone (gemini-3.5-transcribe)"
              >
                <Mic className="w-3 h-3 text-sky-600" />
                <span>Dictate (Voice)</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. High-grade fever for 4 days, persistent headache, bitter taste, joint pains"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Predefined Field: Diagnosis (Primary & Secondary) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              2. Clinical Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Primary Diagnosis (e.g. Severe Uncomplicated Malaria, Acute Tonsillopharyngitis)"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-bold text-slate-900 mb-1.5"
            />
            
            {/* Quick Nigerian Common Diagnoses Chips */}
            <div className="flex flex-wrap gap-1 mb-2">
              <span className="text-[10px] text-slate-500 font-bold self-center mr-1">Quick Select:</span>
              {COMMON_DIAGNOSES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiagnosis(d)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                    diagnosis === d
                      ? 'bg-teal-700 text-white border-teal-700 font-bold'
                      : 'bg-slate-100 hover:bg-teal-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Free-text Area: Detailed Clinical Observations & Physical Findings */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                3. Detailed Clinical Observations & Doctor's Progress Narrative (Free-Text) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setActiveDictationField('clinicalObservations')}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer border border-sky-200"
                title="Dictate with microphone (gemini-3.5-transcribe)"
              >
                <Mic className="w-3 h-3 text-sky-600" />
                <span>Dictate (Voice)</span>
              </button>
            </div>
            <textarea
              rows={4}
              required
              value={clinicalObservations}
              onChange={(e) => setClinicalObservations(e.target.value)}
              placeholder="Record detailed physical examination findings, system review, pallor, icterus, chest auscultation, abdominal palpation, neurological exam, response to prior treatments, and differential thoughts..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-sans leading-relaxed"
            />
          </div>

          {/* Predefined Field: Treatment Plan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                4. Treatment Plan & Management Strategy <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setActiveDictationField('treatmentPlan')}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer border border-sky-200"
                title="Dictate with microphone (gemini-3.5-transcribe)"
              >
                <Mic className="w-3 h-3 text-sky-600" />
                <span>Dictate (Voice)</span>
              </button>
            </div>
            <textarea
              rows={2}
              required
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              placeholder="Outline specific therapeutic actions (e.g. prescribe Artemether-Lumefantrine + Paracetamol, encourage oral hydration, tepid sponging, advise on danger signs)..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Investigations & Follow-Up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Ordered Lab Investigations
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {COMMON_LABS.slice(0, 6).map((lab) => {
                  const isSelected = investigations.includes(lab);
                  return (
                    <button
                      key={lab}
                      type="button"
                      onClick={() => toggleInvestigation(lab)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{lab}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={customLab}
                onChange={(e) => setCustomLab(e.target.value)}
                onKeyDown={handleAddCustomLab}
                placeholder="Type other test and press Enter"
                className="w-full text-[11px] px-2 py-1 bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Follow-Up / Next Review Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md font-medium mb-2"
              />
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] text-amber-800">
                <span className="font-bold">Timestamp:</span> Note will be permanently recorded with current Nigerian server timestamp ({new Date().toLocaleTimeString('en-GB')}, {new Date().toLocaleDateString('en-GB')}) and linked to Folder <span className="font-mono font-bold">{patient.folderNumber}</span>.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving Note...' : 'Save Doctor\'s Note'}</span>
              </button>

              {onOpenPrescriptionGenerator && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <span>Save & Generate Prescription</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                </button>
              )}
            </div>
          </div>

        </form>

      </div>

      {/* Inline Audio Transcriber Modal */}
      {activeDictationField && (
        <AudioTranscriberModal
          onClose={() => setActiveDictationField(null)}
          onApplyTranscript={handleApplyAudioTranscript}
          initialContext={`Doctor dictation for ${activeDictationField} (${patient.folderNumber})`}
        />
      )}
    </div>
  );
};
