import React, { useState, useRef, useEffect } from 'react';
import { 
  FileCheck2, 
  Printer, 
  Download, 
  X, 
  Plus, 
  Trash2, 
  Pill, 
  ShieldAlert, 
  Stethoscope, 
  Eraser, 
  Building2, 
  Send, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { PatientRecord, DigitalPrescription, PrescriptionMedicationItem, PharmacyInventoryItem } from '../types';
import { COMMON_DRUGS, COMMON_DIAGNOSES } from '../lib/nigerianData';
import { createDigitalPrescription, getLocalPharmacyInventory } from '../lib/storage';

interface PrescriptionGeneratorModalProps {
  patient: PatientRecord;
  onClose: () => void;
  onPrescriptionCreated?: (rx: DigitalPrescription) => void;
  initialDiagnosis?: string;
  initialTreatmentPlan?: string;
  hospitalName?: string;
}

export const PrescriptionGeneratorModal: React.FC<PrescriptionGeneratorModalProps> = ({
  patient,
  onClose,
  onPrescriptionCreated,
  initialDiagnosis = '',
  initialTreatmentPlan = '',
  hospitalName = 'LAGOS ISLAND GENERAL HOSPITAL / FMC REGISTRY'
}) => {
  // Diagnosis & Treatment
  const [diagnosis, setDiagnosis] = useState(
    initialDiagnosis || (patient.chronicConditions.length > 0 ? patient.chronicConditions[0] : 'Malaria with Acute Febrile Illness')
  );
  const [treatmentPlan, setTreatmentPlan] = useState(
    initialTreatmentPlan || 'Oral anti-infective therapy, symptomatic antipyretic control, oral rehydration, and review in 5 days.'
  );
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Doctor credentials
  const [doctorName, setDoctorName] = useState('Dr. Chidi Okafor (MBBS, FWACP)');
  const [doctorMdcnNumber, setDoctorMdcnNumber] = useState('MDCN/R/64821');

  // Pharmacy inventory suggestions
  const [inventoryItems, setInventoryItems] = useState<PharmacyInventoryItem[]>([]);

  // Medications list
  const [medications, setMedications] = useState<Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    route: string;
    instructions: string;
    inventoryItemId?: string;
  }>>([
    {
      id: 'med-1',
      name: 'Artemether-Lumefantrine (Coartem 80/480mg)',
      dosage: '1 tablet',
      frequency: 'BD (Twice daily)',
      duration: '3 days',
      quantity: 1,
      route: 'Oral',
      instructions: 'Take strictly after a fatty meal or milk.',
    },
    {
      id: 'med-2',
      name: 'Paracetamol 500mg',
      dosage: '2 tablets (1000mg)',
      frequency: 'TDS (3x daily)',
      duration: '5 days',
      quantity: 30,
      route: 'Oral',
      instructions: 'For fever and body pains. Take after food.',
    }
  ]);

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRx, setGeneratedRx] = useState<DigitalPrescription | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  useEffect(() => {
    const items = getLocalPharmacyInventory();
    setInventoryItems(items);
  }, []);

  // Signature Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setSignatureDataUrl('');
    }
  };

  // Add & Remove Medications
  const handleAddMedication = () => {
    setMedications([
      ...medications,
      {
        id: `med-${Date.now()}`,
        name: '',
        dosage: '',
        frequency: 'TDS (3x daily)',
        duration: '5 days',
        quantity: 1,
        route: 'Oral',
        instructions: 'Take as directed.',
      }
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index: number, field: string, value: any) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill route or matching inventory item
    if (field === 'name') {
      const match = inventoryItems.find((inv) => inv.drugName.toLowerCase() === value.toLowerCase());
      if (match) {
        updated[index].inventoryItemId = match.id;
        if (match.form === 'Infusion IV') updated[index].route = 'IV';
        if (match.form === 'Injection / Ampoule') updated[index].route = 'IM';
        if (match.form === 'Eye Drops') updated[index].route = 'Eye Drops';
      }
    }

    setMedications(updated);
  };

  // Submit and Create Digital Prescription
  const handleSubmit = async (andPrint: boolean = false) => {
    if (medications.length === 0 || !medications.some((m) => m.name.trim())) {
      alert('Please specify at least one medication.');
      return;
    }

    setIsSubmitting(true);
    try {
      const rx = await createDigitalPrescription(patient.id, {
        diagnosis,
        treatmentPlan,
        medications: medications.filter((m) => m.name.trim()).map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          quantity: Number(m.quantity) || 1,
          route: m.route,
          instructions: m.instructions,
          inventoryItemId: m.inventoryItemId,
        })),
        doctorName,
        doctorMdcnNumber,
        doctorSignature: signatureDataUrl,
        hospitalName,
        notes: specialInstructions,
      });

      setGeneratedRx(rx);
      if (onPrescriptionCreated) {
        onPrescriptionCreated(rx);
      }

      if (andPrint) {
        setIsPrintMode(true);
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } catch (err: any) {
      alert('Failed to generate prescription: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectPrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Calculate age
  const calculateAge = () => {
    if (!patient.dateOfBirth) return 'N/A';
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    return `${new Date().getFullYear() - birthYear} yrs`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4 print:shadow-none print:border-0 print:m-0 print:max-w-none">
        
        {/* Header (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Official Digital Prescription Generator</h3>
              <p className="text-[11px] text-slate-300">
                Medical & Dental Council of Nigeria (MDCN) Compliant Digital Rx
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {generatedRx && (
              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          
          {/* Printable Prescription Layout */}
          <div className="bg-white border-2 border-slate-900 p-6 rounded-xl shadow-xs print:rounded-none print:shadow-none print:border-2 print:border-black print:p-6 print:w-full">
            
            {/* Top Official Letterhead */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    Rx
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                      {hospitalName}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600">
                      DEPARTMENT OF PHARMACEUTICAL SERVICES & CLINICAL OUTPATIENT
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Federal Republic of Nigeria • Official Health Records & Dispensary Order
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-md font-mono text-xs font-bold text-slate-800">
                    {generatedRx ? generatedRx.prescriptionNumber : `RX-DRAFT-${new Date().getFullYear()}`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Credentials Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Patient Name</span>
                <span className="font-bold text-slate-900">{patient.surname}, {patient.firstName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Folder Number</span>
                <span className="font-mono font-bold text-emerald-800">{patient.folderNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Age / Gender</span>
                <span className="font-semibold text-slate-800">{calculateAge()} • {patient.gender}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Genotype / Blood</span>
                <span className="font-semibold text-slate-800">{patient.genotype} • {patient.bloodGroup}</span>
              </div>
            </div>

            {/* Allergies Warning Banner */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800 font-bold">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>KNOWN ALLERGIES / CONTRAINDICATIONS: {patient.allergies.join(', ')}</span>
              </div>
            )}

            {/* Clinical Diagnosis & Treatment Plan Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 print:hidden">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Clinical Diagnosis
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Severe Plasmodium Falciparum Malaria"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {/* Nigerian Quick Diagnosis Pills */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_DIAGNOSES.slice(0, 5).map((cd) => (
                    <button
                      key={cd}
                      type="button"
                      onClick={() => setDiagnosis(cd)}
                      className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 px-1.5 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                    >
                      {cd}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Treatment Plan & Clinical Goals
                </label>
                <textarea
                  rows={2}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Outline oral drug therapy, lifestyle advice, and review intervals..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Print View of Diagnosis & Treatment Plan */}
            <div className="hidden print:block mb-4 text-xs border-b border-slate-300 pb-2">
              <div className="flex gap-4">
                <div>
                  <span className="font-bold text-slate-800">Primary Diagnosis: </span>
                  <span className="font-semibold text-slate-900">{diagnosis}</span>
                </div>
                {treatmentPlan && (
                  <div>
                    <span className="font-bold text-slate-800">Treatment Plan: </span>
                    <span className="text-slate-700">{treatmentPlan}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Medications Prescription Table */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Prescribed Medications (Rx Formulation)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 transition cursor-pointer print:hidden"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              </div>

              {/* Responsive Prescription Items */}
              <div className="space-y-3">
                {medications.map((med, idx) => (
                  <div
                    key={med.id}
                    className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl relative group print:bg-white print:border-b print:border-slate-300 print:rounded-none print:p-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      
                      {/* Drug Name with Autocomplete from Hospital Inventory */}
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5 print:hidden">
                          Medication Name ({idx + 1})
                        </label>
                        <input
                          type="text"
                          required
                          list={`drug-list-${idx}`}
                          value={med.name}
                          onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                          placeholder="Drug name (e.g. Coartem, Amoxicillin)"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                        <datalist id={`drug-list-${idx}`}>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={`${inv.drugName} (${inv.brandName || ''})`} />
                          ))}
                          {COMMON_DRUGS.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </div>

                      {/* Dosage */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5 print:hidden">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Frequency */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5 print:hidden">
                          Frequency
                        </label>
                        <select
                          value={med.frequency}
                          onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-md font-semibold focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="OD (Once daily)">OD (1x daily)</option>
                          <option value="BD (Twice daily)">BD (2x daily)</option>
                          <option value="TDS (3x daily)">TDS (3x daily)</option>
                          <option value="QDS (4x daily)">QDS (4x daily)</option>
                          <option value="PRN (As needed)">PRN (As needed)</option>
                          <option value="STAT (Immediately)">STAT (Immediate)</option>
                        </select>
                      </div>

                      {/* Duration */}
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5 print:hidden">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-semibold focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5 print:hidden">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={med.quantity}
                          onChange={(e) => handleMedicationChange(idx, 'quantity', e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="sm:col-span-1 flex items-end justify-center print:hidden">
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                            title="Remove medication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Instructions / Sig */}
                      <div className="sm:col-span-12 mt-1">
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                          placeholder="Instructions for patient (e.g. Take after meals with full glass of water)"
                          className="w-full text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-600 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor's Signature & Verification Section */}
            <div className="border-t-2 border-slate-900 pt-4 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Left: Doctor's Identity */}
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    Prescribing Doctor
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full text-xs font-bold text-slate-900 px-2 py-1 border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">
                    MDCN Registration Number
                  </label>
                  <input
                    type="text"
                    value={doctorMdcnNumber}
                    onChange={(e) => setDoctorMdcnNumber(e.target.value)}
                    className="w-full text-xs font-mono font-bold text-slate-800 px-2 py-1 border border-slate-300 rounded-md"
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  Certified registered medical practitioner authorized under the Medical and Dental Practitioners Act of Nigeria.
                </div>
              </div>

              {/* Right: Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Doctor's Signature & Stamp
                  </span>
                  {!signatureDataUrl && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer print:hidden"
                    >
                      <Eraser className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {signatureDataUrl ? (
                  <div className="relative border border-slate-300 rounded-lg p-2 bg-slate-50/50 flex flex-col items-center">
                    <img
                      src={signatureDataUrl}
                      alt="Doctor Signature"
                      className="h-16 object-contain"
                    />
                    <div className="text-[10px] font-mono text-emerald-800 font-bold mt-1">
                      [ DIGITALLY SIGNED & VERIFIED ]
                    </div>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[10px] text-red-600 underline mt-1 print:hidden cursor-pointer"
                    >
                      Redraw Signature
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-400 rounded-lg bg-slate-50 relative p-1">
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={75}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-18 bg-white cursor-crosshair rounded touch-none"
                    />
                    <p className="text-[10px] text-center text-slate-400 mt-0.5 print:hidden">
                      Sign here using mouse or touch
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Official Footer Verification */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <div>
                Valid for fulfillment across accredited NHIA & Hospital Dispensaries.
              </div>
              <div className="font-mono font-bold">
                MEDIFILE-NG • SECURE RX VAULT
              </div>
            </div>

          </div>

          {/* Action Buttons (Hidden when printing) */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Save & Print / PDF</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSubmitting ? 'Sending...' : 'Send to Hospital Pharmacy'}</span>
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {generatedRx && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>
                  Prescription {generatedRx.prescriptionNumber} successfully generated and queued for dispensary fulfillment!
                </span>
              </div>
              <button
                type="button"
                onClick={handleDirectPrint}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Print Now
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
