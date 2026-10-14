import React, { useState } from 'react';
import { Stethoscope, X, Plus, Trash2, Pill, Activity, Check, Mic } from 'lucide-react';
import { PatientRecord, ClinicalEncounter, PrescriptionItem } from '../types';
import { HOSPITAL_DEPARTMENTS, COMMON_DIAGNOSES, COMMON_DRUGS } from '../lib/nigerianData';
import { AudioTranscriberModal } from './AudioTranscriberModal';

interface AddEncounterModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onSubmit: (encounter: Omit<ClinicalEncounter, 'id' | 'patientId'>) => Promise<void>;
  defaultDoctorName?: string;
}

export const AddEncounterModal: React.FC<AddEncounterModalProps> = ({
  patient,
  onClose,
  onSubmit,
  defaultDoctorName = 'Dr. Babatunde Alabi, MBBS, FWACP'
}) => {
  const [department, setDepartment] = useState<ClinicalEncounter['department']>('General Outpatient (GOPD)');
  const [doctorName, setDoctorName] = useState(defaultDoctorName);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyPresenting, setHistoryPresenting] = useState('');
  const [examFindings, setExamFindings] = useState('');
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [labOrders, setLabOrders] = useState<string[]>([]);
  const [customLab, setCustomLab] = useState('');
  const [planAndFollowUp, setPlanAndFollowUp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDictationField, setActiveDictationField] = useState<'chiefComplaint' | 'historyPresenting' | 'examFindings' | 'planAndFollowUp' | null>(null);

  const handleApplyAudioTranscript = (transcriptText: string) => {
    if (!activeDictationField) return;
    if (activeDictationField === 'chiefComplaint') {
      setChiefComplaint((prev) => (prev ? `${prev} ${transcriptText}` : transcriptText));
    } else if (activeDictationField === 'historyPresenting') {
      setHistoryPresenting((prev) => (prev ? `${prev}\n${transcriptText}` : transcriptText));
    } else if (activeDictationField === 'examFindings') {
      setExamFindings((prev) => (prev ? `${prev}\n${transcriptText}` : transcriptText));
    } else if (activeDictationField === 'planAndFollowUp') {
      setPlanAndFollowUp((prev) => (prev ? `${prev}\n${transcriptText}` : transcriptText));
    }
  };

  const toggleDiagnosis = (diag: string) => {
    if (diagnoses.includes(diag)) {
      setDiagnoses(diagnoses.filter((d) => d !== diag));
    } else {
      setDiagnoses([...diagnoses, diag]);
    }
  };

  const addCustomDiagnosis = () => {
    if (customDiagnosis.trim() && !diagnoses.includes(customDiagnosis.trim())) {
      setDiagnoses([...diagnoses, customDiagnosis.trim()]);
      setCustomDiagnosis('');
    }
  };

  const addPrebuiltDrug = (template: typeof COMMON_DRUGS[0]) => {
    const newRx: PrescriptionItem = {
      id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      drug: template.drug,
      dose: template.dose,
      route: template.route as any,
      frequency: template.frequency as any,
      duration: template.duration,
      dispensed: false,
    };
    setPrescriptions([...prescriptions, newRx]);
  };

  const removeDrug = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const addLabOrder = (test: string) => {
    if (test && !labOrders.includes(test)) {
      setLabOrders([...labOrders, test]);
    }
  };

  const removeLabOrder = (test: string) => {
    setLabOrders(labOrders.filter((t) => t !== test));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (diagnoses.length === 0) {
      alert('Please select or specify at least one clinical diagnosis.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        date: new Date().toISOString().split('T')[0],
        doctorName: doctorName.trim() || defaultDoctorName,
        department,
        chiefComplaint: chiefComplaint.trim() || 'General clinical review',
        historyOfPresentingIllness: historyPresenting.trim(),
        examinationFindings: examFindings.trim(),
        diagnoses,
        prescriptions,
        investigationsOrdered: labOrders,
        planAndFollowUp: planAndFollowUp.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Doctor&apos;s Consultation & Case Note</h3>
              <p className="text-xs text-slate-400 font-mono">
                {patient.folderNumber} • {patient.surname}, {patient.firstName} (Hb {patient.genotype} • {patient.bloodGroup})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Clinic & Doctor Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital Clinic / Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {HOSPITAL_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Attending Medical Officer
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Chief Complaint (Subjective) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Chief Complaint & Presenting Symptoms (Subjective)
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
              placeholder="e.g. Fever, body aches and loss of appetite for 3 days; severe bone pain in both legs."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* History of Presenting Illness */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                History of Presenting Illness (HPI)
              </label>
              <button
                type="button"
                onClick={() => setActiveDictationField('historyPresenting')}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer border border-sky-200"
                title="Dictate with microphone (gemini-3.5-transcribe)"
              >
                <Mic className="w-3 h-3 text-sky-600" />
                <span>Dictate (Voice)</span>
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="Detail onset, aggravating factors, relieving factors, previous treatment taken at chemist/home..."
              value={historyPresenting}
              onChange={(e) => setHistoryPresenting(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Physical Examination Findings (Objective) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Physical Examination Findings (Objective)
              </label>
              <button
                type="button"
                onClick={() => setActiveDictationField('examFindings')}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer border border-sky-200"
                title="Dictate with microphone (gemini-3.5-transcribe)"
              >
                <Mic className="w-3 h-3 text-sky-600" />
                <span>Dictate (Voice)</span>
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="General exam (pale, jaundiced, febrile), Chest, CVS, Abdomen (tenderness, organomegaly), CNS..."
              value={examFindings}
              onChange={(e) => setExamFindings(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Assessment & Diagnoses */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Assessment & Clinical Diagnoses (Select or type custom)</span>
              <span className="text-[11px] font-normal text-teal-700">{diagnoses.length} selected</span>
            </label>

            {/* Quick Pick Nigerian Diagnoses */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COMMON_DIAGNOSES.map((diag) => {
                const isSelected = diagnoses.includes(diag);
                return (
                  <button
                    key={diag}
                    type="button"
                    onClick={() => toggleDiagnosis(diag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-teal-700 text-white font-semibold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {diag}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Diagnosis input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Or add other diagnosis..."
                value={customDiagnosis}
                onChange={(e) => setCustomDiagnosis(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomDiagnosis();
                  }
                }}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={addCustomDiagnosis}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Prescriptions & Pharmacy Order */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-700" />
                Prescriptions & Medication Orders
              </label>
            </div>

            {/* Common Fast-Add Prescriptions */}
            <div className="mb-3">
              <p className="text-[11px] text-slate-500 mb-1 font-semibold">Quick-Add Standard Therapy:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_DRUGS.slice(0, 6).map((item) => (
                  <button
                    key={item.drug}
                    type="button"
                    onClick={() => addPrebuiltDrug(item)}
                    className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded text-[11px] font-medium transition cursor-pointer"
                  >
                    + {item.drug.split('(')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescribed list */}
            {prescriptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-dashed border-slate-200 text-center">
                No medications added yet. Use the quick-add buttons above or type below.
              </p>
            ) : (
              <div className="space-y-2 mb-3">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{rx.drug}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Dose: {rx.dose} • Route: {rx.route} • Freq: {rx.frequency} • Duration: {rx.duration}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDrug(rx.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Laboratory & Diagnostic Investigations */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-700" />
              Laboratory & Diagnostic Orders
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Malaria Parasite (MP) Slide / RDT',
                'Full Blood Count (FBC) + PCV',
                'Electrolytes, Urea & Creatinine (E/U/Cr)',
                'Urinalysis',
                'Fasting Blood Sugar (FBS)',
                'Widal Reaction Test',
                'Obstetric Ultrasound Scan',
              ].map((test) => {
                const isOrdered = labOrders.includes(test);
                return (
                  <button
                    key={test}
                    type="button"
                    onClick={() => isOrdered ? removeLabOrder(test) : addLabOrder(test)}
                    className={`px-2 py-1 text-[11px] rounded transition cursor-pointer ${
                      isOrdered
                        ? 'bg-purple-700 text-white font-semibold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isOrdered ? `✓ ${test}` : `+ ${test}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plan & Follow-up */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Management Plan & Clinic Review Date
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Counselled on adherence. Hydration advice. Review in GOPD in 2 weeks with lab results."
              value={planAndFollowUp}
              onChange={(e) => setPlanAndFollowUp(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving Encounter...' : 'Save Consultation to Medical Record'}
            </button>
          </div>

        </form>

      </div>

      {/* Inline Audio Transcriber Modal */}
      {activeDictationField && (
        <AudioTranscriberModal
          onClose={() => setActiveDictationField(null)}
          onApplyTranscript={handleApplyAudioTranscript}
          initialContext={`Consultation dictation for ${activeDictationField}`}
        />
      )}
    </div>
  );
};
