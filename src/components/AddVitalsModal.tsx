import React, { useState } from 'react';
import { HeartPulse, X, AlertCircle } from 'lucide-react';
import { PatientRecord, VitalsEntry } from '../types';

interface AddVitalsModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onSubmit: (vitals: Omit<VitalsEntry, 'id' | 'patientId' | 'recordedAt'>) => Promise<void>;
  defaultStaffName?: string;
}

export const AddVitalsModal: React.FC<AddVitalsModalProps> = ({
  patient,
  onClose,
  onSubmit,
  defaultStaffName = 'Nurse Ngozi Okafor, RN'
}) => {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(72);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(170);
  const [spo2, setSpo2] = useState<number>(98);
  const [rbs, setRbs] = useState<number>(100);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculate BMI
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : undefined;

  // Auto evaluate triage category based on Nigerian clinic thresholds
  let autoTriage: VitalsEntry['triageCategory'] = 'Routine (Green)';
  let warningMessage = '';

  if (systolic >= 180 || diastolic >= 110 || temperature >= 39.5 || (spo2 && spo2 < 90) || (rbs && rbs > 300)) {
    autoTriage = 'Emergency (Red)';
    warningMessage = 'CRITICAL ALERT: Severe vital sign derangement requiring immediate medical officer evaluation.';
  } else if (systolic >= 140 || diastolic >= 90 || temperature >= 37.8 || pulse >= 100) {
    autoTriage = 'Priority (Yellow)';
    warningMessage = 'ELEVATED VITALS: Patient should be prioritized in the GOPD consultation queue.';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        recordedBy: defaultStaffName,
        bpSystolic: Number(systolic),
        bpDiastolic: Number(diastolic),
        pulseRate: Number(pulse),
        temperature: Number(temperature),
        respiratoryRate: Number(respiratoryRate),
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        bmi,
        spo2: Number(spo2),
        randomBloodSugar: Number(rbs),
        triageCategory: autoTriage,
        clinicalNotes: clinicalNotes.trim() || undefined,
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="bg-teal-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-200" />
            <div>
              <h3 className="font-bold text-base">Record Patient Vitals & Triage</h3>
              <p className="text-xs text-teal-100 font-mono">
                {patient.folderNumber} • {patient.surname}, {patient.firstName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-teal-100 hover:text-white hover:bg-teal-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Triage Live Assessment Box */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            autoTriage === 'Emergency (Red)'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : autoTriage === 'Priority (Yellow)'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block">
                Calculated Triage: {autoTriage}
              </span>
              {warningMessage && <p className="mt-0.5">{warningMessage}</p>}
            </div>
          </div>

          {/* Blood Pressure & Pulse */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Systolic (mmHg)
              </label>
              <input
                type="number"
                required
                min={50}
                max={280}
                value={systolic}
                onChange={(e) => setSystolic(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diastolic (mmHg)
              </label>
              <input
                type="number"
                required
                min={30}
                max={180}
                value={diastolic}
                onChange={(e) => setDiastolic(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pulse (bpm)
              </label>
              <input
                type="number"
                required
                min={30}
                max={220}
                value={pulse}
                onChange={(e) => setPulse(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Temperature & Respiratory Rate & SpO2 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                required
                min={32}
                max={43}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resp. Rate (/min)
              </label>
              <input
                type="number"
                min={8}
                max={60}
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SpO2 (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Weight, Height & Calculated BMI */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.5"
                required
                min={2}
                max={300}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min={40}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Calculated BMI
              </label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                {bmi || '--'} kg/m²
              </div>
            </div>
          </div>

          {/* Random Blood Sugar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Random Blood Sugar - RBS (mg/dL)
            </label>
            <input
              type="number"
              min={30}
              max={600}
              value={rbs}
              onChange={(e) => setRbs(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Clinical triage observations */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Triage Nurse Clinical Remarks
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Febrile, patient complains of severe chills and headache. Fast-tracked for malaria RDT."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Vitals to File'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
