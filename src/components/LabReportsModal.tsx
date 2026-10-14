import React, { useState } from 'react';
import { 
  X, 
  FlaskConical, 
  FileText, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Printer, 
  Upload, 
  Image as ImageIcon,
  ChevronRight,
  ShieldCheck,
  User,
  Stethoscope,
  Activity,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { 
  LabReport, 
  LabCategory, 
  LabReportStatus, 
  LabTestParameter, 
  PatientRecord 
} from '../types';
import { 
  addPatientLabReport, 
  updateLabReport, 
  getLocalPatients 
} from '../lib/storage';

interface LabReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: PatientRecord | null;
  onSelectPatient?: (patient: PatientRecord) => void;
}

const TEST_TEMPLATES: Record<LabCategory, { name: string; specimen: string; parameters: LabTestParameter[]; defaultImpression: string }[]> = {
  'Blood Work': [
    {
      name: 'Full Blood Count (FBC) with PCV',
      specimen: 'Whole Blood (EDTA)',
      parameters: [
        { name: 'Haemoglobin (Hb)', value: '13.5', unit: 'g/dL', referenceRange: '12.0 - 17.0 g/dL', isAbnormal: false, flag: 'Normal' },
        { name: 'Packed Cell Volume (PCV)', value: '41', unit: '%', referenceRange: '36 - 50 %', isAbnormal: false, flag: 'Normal' },
        { name: 'Total White Blood Cells (WBC)', value: '6,400', unit: '/μL', referenceRange: '4,000 - 11,000 /μL', isAbnormal: false, flag: 'Normal' },
        { name: 'Platelet Count', value: '240,000', unit: '/μL', referenceRange: '150,000 - 450,000 /μL', isAbnormal: false, flag: 'Normal' },
        { name: 'Neutrophils', value: '58', unit: '%', referenceRange: '40 - 75 %', isAbnormal: false, flag: 'Normal' },
        { name: 'Lymphocytes', value: '34', unit: '%', referenceRange: '20 - 45 %', isAbnormal: false, flag: 'Normal' },
      ],
      defaultImpression: 'Haematological indices within normal adult physiological limits. No morphological evidence of anaemia or active leukocytosis.',
    },
    {
      name: 'Malaria Parasite (MP) Giemsa Thick & Thin Smear',
      specimen: 'Capillary / EDTA Whole Blood',
      parameters: [
        { name: 'Malaria Parasite Microscopy', value: 'Positive (++)', unit: 'Thick film', referenceRange: 'Negative / Nil', isAbnormal: true, flag: 'High' },
        { name: 'Species Identification', value: 'Plasmodium falciparum (Ring forms)', unit: 'Thin film', referenceRange: 'Nil', isAbnormal: true, flag: 'High' },
        { name: 'Estimated Parasite Density', value: '2,800', unit: 'parasites/μL', referenceRange: 'Nil', isAbnormal: true, flag: 'High' },
      ],
      defaultImpression: 'Moderate P. falciparum parasitaemia. Recommend immediate weight-based Artemisinin-based Combination Therapy (ACT).',
    },
    {
      name: 'Electrolytes, Urea & Creatinine (EUCr)',
      specimen: 'Venous Blood (Lithium Heparin / Serum)',
      parameters: [
        { name: 'Sodium (Na+)', value: '138', unit: 'mmol/L', referenceRange: '135 - 145 mmol/L', isAbnormal: false, flag: 'Normal' },
        { name: 'Potassium (K+)', value: '4.1', unit: 'mmol/L', referenceRange: '3.5 - 5.0 mmol/L', isAbnormal: false, flag: 'Normal' },
        { name: 'Chloride (Cl-)', value: '101', unit: 'mmol/L', referenceRange: '96 - 106 mmol/L', isAbnormal: false, flag: 'Normal' },
        { name: 'Bicarbonate (HCO3-)', value: '24', unit: 'mmol/L', referenceRange: '22 - 28 mmol/L', isAbnormal: false, flag: 'Normal' },
        { name: 'Serum Urea', value: '4.5', unit: 'mmol/L', referenceRange: '2.5 - 6.7 mmol/L', isAbnormal: false, flag: 'Normal' },
        { name: 'Serum Creatinine', value: '88', unit: 'μmol/L', referenceRange: '62 - 106 μmol/L', isAbnormal: false, flag: 'Normal' },
      ],
      defaultImpression: 'Normal renal nitrogenous excretion and electrolyte balance. No biochemical azotemia detected.',
    },
    {
      name: 'Fasting Blood Glucose (FBG) & Lipid Profile',
      specimen: 'Venous Blood (Fluoride Oxalate & Plain)',
      parameters: [
        { name: 'Fasting Blood Sugar', value: '94', unit: 'mg/dL', referenceRange: '70 - 99 mg/dL', isAbnormal: false, flag: 'Normal' },
        { name: 'Total Cholesterol', value: '182', unit: 'mg/dL', referenceRange: '< 200 mg/dL', isAbnormal: false, flag: 'Normal' },
        { name: 'Triglycerides', value: '124', unit: 'mg/dL', referenceRange: '< 150 mg/dL', isAbnormal: false, flag: 'Normal' },
        { name: 'HDL Cholesterol', value: '48', unit: 'mg/dL', referenceRange: '> 40 mg/dL', isAbnormal: false, flag: 'Normal' },
        { name: 'LDL Cholesterol', value: '109', unit: 'mg/dL', referenceRange: '< 100 mg/dL', isAbnormal: true, flag: 'High' },
      ],
      defaultImpression: 'Euglycaemic fasting profile. Mild border elevation of LDL cholesterol; diet counselling advised.',
    },
  ],
  'Radiology': [
    {
      name: 'Chest Radiograph (PA View, Erect)',
      specimen: 'Plain Digital Radiograph',
      parameters: [],
      defaultImpression: 'The trachea is central. Both lung fields demonstrate clear vascular markings with no parenchymal consolidation, cavitation, or pleural effusion. The cardiothoracic ratio is normal (< 0.50). The costophrenic angles are sharp and clear. Visualized thoracic cage and bony margins are intact.\n\nCONCLUSION: Normal Posteroanterior Chest Radiograph. No active cardiopulmonary lesion.',
    },
    {
      name: 'Abdominal & Pelvic Ultrasonography',
      specimen: 'B-Mode Diagnostic Ultrasound',
      parameters: [],
      defaultImpression: 'Liver is normal in size and homogeneous in echotexture. No focal hepatic mass or intrahepatic duct dilatation. Gallbladder is well-distended with thin wall; no calculi or acoustic shadowing seen. Both kidneys are orthotopic with preserved corticomedullary demarcation and normal cortical thickness (Right: 10.4cm, Left: 10.7cm). Spleen and pancreas are unremarkable. Urinary bladder has smooth contour with no intravesical lesion.\n\nCONCLUSION: Unremarkable Abdominopelvic Ultrasonogram.',
    },
    {
      name: 'Obstetric Ultrasound Scan (2nd / 3rd Trimester)',
      specimen: 'Transabdominal Real-Time Sonogram',
      parameters: [],
      defaultImpression: 'Single active intrauterine gestation visualized in longitudinal lie and cephalic presentation. Regular fetal cardiac activity confirmed (FHR: 142 bpm). Placenta is fundal-anterior, Grade II maturity, clear of the internal cervical os. Amniotic fluid volume is adequate with Amniotic Fluid Index (AFI) of 14.5 cm. Estimated Gestational Age (EGA): 28 weeks 4 days. Estimated Fetal Weight: 1,220 grams.\n\nCONCLUSION: Viable singleton pregnancy with normal interval fetal biometry.',
    },
  ],
  'Urinalysis': [
    {
      name: 'Automated 10-Parameter Dipstick Urinalysis & Microscopy',
      specimen: 'Fresh Clean-Catch Mid-Stream Urine',
      parameters: [
        { name: 'Color', value: 'Straw / Pale Amber', referenceRange: 'Straw / Amber', isAbnormal: false, flag: 'Normal' },
        { name: 'Appearance', value: 'Clear', referenceRange: 'Clear', isAbnormal: false, flag: 'Normal' },
        { name: 'Specific Gravity', value: '1.018', referenceRange: '1.005 - 1.030', isAbnormal: false, flag: 'Normal' },
        { name: 'pH', value: '6.0', referenceRange: '5.0 - 7.5', isAbnormal: false, flag: 'Normal' },
        { name: 'Protein', value: 'Negative', unit: 'Dipstick', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Glucose', value: 'Negative', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Ketones', value: 'Negative', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Bilirubin', value: 'Negative', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Blood / Haemoglobin', value: 'Negative', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Nitrites', value: 'Negative', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Leukocyte Esterase', value: 'Negative', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Microscopy: Pus cells', value: '0 - 2', unit: '/HPF', referenceRange: '0 - 5 /HPF', isAbnormal: false, flag: 'Normal' },
        { name: 'Microscopy: Red blood cells', value: 'Nil', unit: '/HPF', referenceRange: '0 - 2 /HPF', isAbnormal: false, flag: 'Normal' },
        { name: 'Microscopy: Epithelial cells', value: 'Few', referenceRange: 'Few', isAbnormal: false, flag: 'Normal' },
        { name: 'Microscopy: Casts / Crystals', value: 'None seen', referenceRange: 'None', isAbnormal: false, flag: 'Normal' },
      ],
      defaultImpression: 'Normal urine chemical and sediment analysis. No evidence of urinary tract infection, proteinuria, or haematuria.',
    },
  ],
  'Microbiology': [
    {
      name: 'Stool Microscopy & Parasitology',
      specimen: 'Fresh Stool Specimen',
      parameters: [
        { name: 'Macroscopy', value: 'Formed, Brown', referenceRange: 'Formed', isAbnormal: false, flag: 'Normal' },
        { name: 'Occult Blood', value: 'Negative', referenceRange: 'Negative', isAbnormal: false, flag: 'Normal' },
        { name: 'Saline Wet Mount', value: 'No ova or parasites seen', referenceRange: 'No parasites', isAbnormal: false, flag: 'Normal' },
        { name: 'Iodine Preparation', value: 'No cysts of E. histolytica or G. lamblia', referenceRange: 'No cysts', isAbnormal: false, flag: 'Normal' },
      ],
      defaultImpression: 'No helminthic ova, protozoan cysts, or trophozoites seen on wet saline/iodine concentration.',
    },
    {
      name: 'High Vaginal / Urethral Swab Microscopy & Gram Stain',
      specimen: 'Endocervical / High Vaginal Swab',
      parameters: [
        { name: 'Gram Stain', value: 'Gram-positive bacilli (Lactobacilli predominant)', referenceRange: 'Lactobacilli', isAbnormal: false, flag: 'Normal' },
        { name: 'Clue Cells', value: 'Absent', referenceRange: 'Absent', isAbnormal: false, flag: 'Normal' },
        { name: 'Yeast Cells / Pseudohyphae', value: 'None seen', referenceRange: 'None', isAbnormal: false, flag: 'Normal' },
        { name: 'Trichomonas vaginalis', value: 'Not seen', referenceRange: 'Not seen', isAbnormal: false, flag: 'Normal' },
      ],
      defaultImpression: 'Normal vaginal microbial flora with preserved Doderlein bacilli. No Candida or Bacterial Vaginosis.',
    },
  ],
  'Other': [
    {
      name: 'Standard Electrocardiogram (12-Lead ECG)',
      specimen: 'Cardiac Electrophysiological Tracing',
      parameters: [
        { name: 'Heart Rate', value: '72', unit: 'bpm', referenceRange: '60 - 100 bpm', isAbnormal: false, flag: 'Normal' },
        { name: 'PR Interval', value: '160', unit: 'ms', referenceRange: '120 - 200 ms', isAbnormal: false, flag: 'Normal' },
        { name: 'QRS Duration', value: '88', unit: 'ms', referenceRange: '< 120 ms', isAbnormal: false, flag: 'Normal' },
        { name: 'QTc Interval', value: '412', unit: 'ms', referenceRange: '< 440 ms', isAbnormal: false, flag: 'Normal' },
      ],
      defaultImpression: 'Normal sinus rhythm at 72 bpm. Normal axis, intervals, and voltage. No acute ST-segment elevation, depression, or T-wave inversion.',
    },
  ],
};

export const LabReportsModal: React.FC<LabReportsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSelectPatient,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LabCategory | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<LabReportStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'view'>('list');
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);

  // Form state for creating a new report
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patient?.id || '');
  const [formCategory, setFormCategory] = useState<LabCategory>('Blood Work');
  const [testName, setTestName] = useState('');
  const [specimenType, setSpecimenType] = useState('Whole Blood (EDTA)');
  const [urgency, setUrgency] = useState<'Routine' | 'Urgent' | 'STAT / Emergency'>('Routine');
  const [status, setStatus] = useState<LabReportStatus>('Completed');
  const [requestedBy, setRequestedBy] = useState('Dr. Medical Officer, MBBS');
  const [performedBy, setPerformedBy] = useState('MLS Babajide Ogunlesi, BMLS, AMLSCN');
  const [mlsLicenseNumber, setMlsLicenseNumber] = useState('AMLSCN/R/88210');
  const [sampleCollectionDate, setSampleCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [findingsOrImpression, setFindingsOrImpression] = useState('');
  const [clinicalCorrelationNotes, setClinicalCorrelationNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isFlaggedAbnormal, setIsFlaggedAbnormal] = useState(false);
  const [parameters, setParameters] = useState<LabTestParameter[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!isOpen) return null;

  const allPatients = getLocalPatients();
  const currentPatient = patient || allPatients.find((p) => p.id === selectedPatientId) || allPatients[0];

  // Reports to display
  let reportsToDisplay: LabReport[] = [];
  if (patient) {
    reportsToDisplay = patient.labReports || [];
  } else {
    allPatients.forEach((p) => {
      if (p.labReports) reportsToDisplay.push(...p.labReports);
    });
  }

  // Apply filters
  if (selectedCategory !== 'All') {
    reportsToDisplay = reportsToDisplay.filter((r) => r.category === selectedCategory);
  }
  if (statusFilter !== 'All') {
    reportsToDisplay = reportsToDisplay.filter((r) => r.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    reportsToDisplay = reportsToDisplay.filter(
      (r) =>
        r.testName.toLowerCase().includes(q) ||
        r.patientName.toLowerCase().includes(q) ||
        r.patientFolderNumber.toLowerCase().includes(q) ||
        (r.findingsOrImpression && r.findingsOrImpression.toLowerCase().includes(q))
    );
  }

  // Load a test template into form
  const handleSelectTemplate = (templateName: string) => {
    const templates = TEST_TEMPLATES[formCategory] || [];
    const template = templates.find((t) => t.name === templateName);
    if (template) {
      setTestName(template.name);
      setSpecimenType(template.specimen);
      setParameters([...template.parameters]);
      setFindingsOrImpression(template.defaultImpression);
      const hasAbnormal = template.parameters.some((p) => p.isAbnormal);
      setIsFlaggedAbnormal(hasAbnormal);
    }
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      { name: '', value: '', unit: '', referenceRange: '', isAbnormal: false, flag: 'Normal' },
    ]);
  };

  const handleRemoveParameter = (idx: number) => {
    setParameters(parameters.filter((_, i) => i !== idx));
  };

  const handleUpdateParameter = (idx: number, field: keyof LabTestParameter, val: any) => {
    const updated = [...parameters];
    updated[idx] = { ...updated[idx], [field]: val };
    if (field === 'flag') {
      updated[idx].isAbnormal = val !== 'Normal';
    }
    setParameters(updated);
    setIsFlaggedAbnormal(updated.some((p) => p.isAbnormal));
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    const targetPatientId = patient?.id || selectedPatientId || allPatients[0]?.id;
    if (!targetPatientId) return;

    setIsSubmitting(true);
    try {
      const created = await addPatientLabReport(targetPatientId, {
        testName,
        category: formCategory,
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
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
        isFlaggedAbnormal,
      });

      setFeedbackMsg('Laboratory report saved to patient record successfully.');
      setTimeout(() => {
        setFeedbackMsg('');
        setSelectedReport(created);
        setActiveTab('view');
      }, 700);
    } catch (err: any) {
      setFeedbackMsg(`Error: ${err.message || 'Could not save report'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-900 text-white rounded-lg">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Hospital Diagnostic Laboratory & Imaging Suite
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full">
                  AMLSCN & RRBN Certified
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {patient ? (
                  <span>
                    Viewing reports for <strong>{patient.surname}, {patient.firstName}</strong> ({patient.folderNumber})
                  </span>
                ) : (
                  <span>Central Registry — Clinical Pathology, Haematology, Radiology & Microscopy</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab !== 'list' && (
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Back to Reports List
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 text-sm">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Reports ({reportsToDisplay.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('add');
                // preload first template of current category
                const first = TEST_TEMPLATES[formCategory]?.[0];
                if (first && !testName) {
                  setTestName(first.name);
                  setSpecimenType(first.specimen);
                  setParameters([...first.parameters]);
                  setFindingsOrImpression(first.defaultImpression);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1.5 ${
                activeTab === 'add'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Enter New Test Result</span>
            </button>
            {selectedReport && (
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1.5 ${
                  activeTab === 'view'
                    ? 'bg-teal-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>View Selected Report</span>
              </button>
            )}
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Category:</span>
              {(['All', 'Blood Work', 'Radiology', 'Urinalysis', 'Microbiology'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {feedbackMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* TAB 1: LIST VIEW */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Search & Status Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by test name, patient, folder number, or findings..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Critical Alert">Critical Alert</option>
                    <option value="Pending">Pending</option>
                    <option value="In-Progress">In-Progress</option>
                  </select>
                </div>
              </div>

              {/* Reports Grid */}
              {reportsToDisplay.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                  <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-800">No laboratory reports match your criteria</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                    Staff can enter test parameters manually or upload digital scans for blood work, radiology, and urinalysis.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-semibold hover:bg-teal-950 transition-colors inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enter New Patient Report</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportsToDisplay.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => {
                        setSelectedReport(report);
                        setActiveTab('view');
                      }}
                      className="group cursor-pointer bg-white border border-slate-200 hover:border-teal-700 rounded-xl p-4 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-md ${
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

                          <div className="flex items-center space-x-1.5">
                            {report.status === 'Critical Alert' && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-md inline-flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>CRITICAL</span>
                              </span>
                            )}
                            {report.status === 'Completed' && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                                Completed
                              </span>
                            )}
                            {report.status === 'Pending' && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                          {report.testName}
                        </h4>

                        <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center text-slate-800 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400 mr-1" />
                            {report.patientName} ({report.patientFolderNumber})
                          </span>
                          <span className="inline-flex items-center text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1" />
                            {report.reportDate}
                          </span>
                        </div>

                        {report.findingsOrImpression && (
                          <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                            {report.findingsOrImpression}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>{report.parameters?.length ? `${report.parameters.length} parameters logged` : 'Visual impression'}</span>
                        <span className="font-semibold text-teal-900 inline-flex items-center group-hover:translate-x-0.5 transition-transform">
                          <span>View Full Slip</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENTER NEW TEST RESULT FORM */}
          {activeTab === 'add' && (
            <form onSubmit={handleCreateReport} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-xs">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-base font-bold text-slate-900">Enter Structured Patient Diagnostic Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record analytical lab values, microscopic findings, or diagnostic imaging reports for immediate patient folder archiving.
                </p>
              </div>

              {/* Patient and Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {!patient && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient File *</label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      required
                      className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                    >
                      {allPatients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.surname}, {p.firstName} — {p.folderNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnostic Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as LabCategory;
                      setFormCategory(newCat);
                      const t = TEST_TEMPLATES[newCat]?.[0];
                      if (t) {
                        setTestName(t.name);
                        setSpecimenType(t.specimen);
                        setParameters([...t.parameters]);
                        setFindingsOrImpression(t.defaultImpression);
                      }
                    }}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-medium"
                  >
                    <option value="Blood Work">Blood Work (Haematology & Chemistry)</option>
                    <option value="Radiology">Radiology & Medical Imaging</option>
                    <option value="Urinalysis">Urinalysis & Renal Microscopy</option>
                    <option value="Microbiology">Microbiology & Parasitology</option>
                    <option value="Other">Other Diagnostic Tests</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quick Test Template</label>
                  <select
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 text-teal-900 font-medium"
                  >
                    <option value="">-- Select standard hospital test template --</option>
                    {TEST_TEMPLATES[formCategory]?.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Test Name & Specimen */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Test / Examination Name *</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. Full Blood Count (FBC) with PCV, or Chest X-Ray PA View"
                    required
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specimen / Diagnostic Modality</label>
                  <input
                    type="text"
                    value={specimenType}
                    onChange={(e) => setSpecimenType(e.target.value)}
                    placeholder="e.g. Whole Blood (EDTA), Clean-Catch Urine, B-Mode Sonogram"
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* Doctors & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested By (Doctor)</label>
                  <input
                    type="text"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Performed By (MLS / Radiographer)</label>
                  <input
                    type="text"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">License / Reg Number</label>
                  <input
                    type="text"
                    value={mlsLicenseNumber}
                    onChange={(e) => setMlsLicenseNumber(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Report Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* Status and Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Report Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-medium"
                  >
                    <option value="Completed">Completed & Verified</option>
                    <option value="Critical Alert">Critical Value Alert (Requires Action)</option>
                    <option value="In-Progress">In-Progress / Processing</option>
                    <option value="Pending">Pending Specimen Analysis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT / Emergency">STAT / Emergency</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3 pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFlaggedAbnormal}
                      onChange={(e) => setIsFlaggedAbnormal(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded-sm border-slate-300 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-rose-800">
                      Flag as Abnormal / Pathological
                    </span>
                  </label>
                </div>
              </div>

              {/* Quantitative Parameters Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Quantitative / Microscopic Test Parameters ({parameters.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="px-3 py-1 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Parameter Row</span>
                  </button>
                </div>

                {parameters.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Parameter Name</th>
                          <th className="py-2.5 px-3">Result / Value</th>
                          <th className="py-2.5 px-3">Unit</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3">Flag</th>
                          <th className="py-2.5 px-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {parameters.map((param, idx) => (
                          <tr key={idx} className={param.isAbnormal ? 'bg-rose-50/50' : 'bg-white'}>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={param.name}
                                onChange={(e) => handleUpdateParameter(idx, 'name', e.target.value)}
                                placeholder="e.g. Haemoglobin"
                                className="w-full py-1 px-2 border border-slate-300 rounded-md text-xs font-medium"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={param.value}
                                onChange={(e) => handleUpdateParameter(idx, 'value', e.target.value)}
                                placeholder="e.g. 13.5"
                                className="w-full py-1 px-2 border border-slate-300 rounded-md text-xs font-bold text-slate-900"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={param.unit || ''}
                                onChange={(e) => handleUpdateParameter(idx, 'unit', e.target.value)}
                                placeholder="g/dL"
                                className="w-full py-1 px-2 border border-slate-300 rounded-md text-xs"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={param.referenceRange || ''}
                                onChange={(e) => handleUpdateParameter(idx, 'referenceRange', e.target.value)}
                                placeholder="12.0 - 16.0"
                                className="w-full py-1 px-2 border border-slate-300 rounded-md text-xs text-slate-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={param.flag || 'Normal'}
                                onChange={(e) => handleUpdateParameter(idx, 'flag', e.target.value)}
                                className={`py-1 px-2 border rounded-md text-xs font-semibold ${
                                  param.flag === 'Critical'
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : param.flag === 'High' || param.flag === 'Low' || param.flag === 'Abnormal'
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                              >
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Low">Low</option>
                                <option value="Abnormal">Abnormal</option>
                                <option value="Critical">Critical</option>
                              </select>
                            </td>
                            <td className="py-2 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveParameter(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                                title="Delete row"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    No discrete numerical parameters defined. For imaging or qualitative pathology, use the Clinical Impression section below.
                  </p>
                )}
              </div>

              {/* Detailed Findings & Impression */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Findings, Radiologist Impression or Microscopic Description *
                </label>
                <textarea
                  rows={4}
                  value={findingsOrImpression}
                  onChange={(e) => setFindingsOrImpression(e.target.value)}
                  placeholder="Record anatomical observations, organ measurements, microscopic smear description, or radiologist conclusions..."
                  required
                  className="w-full p-3 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* Clinical Correlation Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Correlation & Advisory Recommendations
                </label>
                <input
                  type="text"
                  value={clinicalCorrelationNotes}
                  onChange={(e) => setClinicalCorrelationNotes(e.target.value)}
                  placeholder="e.g. Recommend repeat PCV post-transfusion in 24 hours, or follow-up sonogram in 4 weeks."
                  className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* File Attachment / Scan Upload Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-teal-800" />
                  <span className="text-xs font-bold text-slate-800">
                    Upload or Link Scanned Result Slip / Radiograph Film
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Image / Slip URL</label>
                    <input
                      type="url"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">File Label / Filename</label>
                    <input
                      type="text"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      placeholder="e.g. Chest_XRay_PA_Digital.jpg"
                      className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>

                {attachmentUrl && (
                  <div className="mt-2 p-2 bg-white border border-slate-200 rounded-md flex items-center space-x-3">
                    <img
                      src={attachmentUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-sm border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-800">{attachmentName || 'Scanned File'}</p>
                      <p className="text-slate-500">Image attached and ready to archive in patient record.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg transition-colors shadow-sm disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Archiving Report...' : 'Save & Archive Laboratory Report'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DETAILED VIEW SLIP */}
          {activeTab === 'view' && selectedReport && (
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="flex items-center justify-between bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    All Reports
                  </button>
                  {selectedReport.status === 'Critical Alert' ? (
                    <span className="px-3 py-1 text-xs font-bold bg-rose-600 text-white rounded-md inline-flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>CRITICAL VALUE ALERT</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md">
                      Status: {selectedReport.status}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Official Report</span>
                  </button>
                </div>
              </div>

              {/* Printable Official Medical Lab Report Slip */}
              <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-sm print:border-none print:shadow-none print:p-0">
                {/* Hospital Letterhead */}
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Federal Republic of Nigeria — Ministry of Health
                  </p>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5 uppercase">
                    Department of Pathology, Medical Laboratory & Imaging
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    General Hospital & Federal Medical Centre Clinical Diagnostics Service
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    AMLSCN Accreditation No: AML/2026/0419 • RRBN Radiation Board Licensure No: RRBN/RAD/9910
                  </p>
                </div>

                {/* Patient & Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-6">
                  <div>
                    <span className="text-slate-500 block">Patient Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedReport.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Folder Number:</span>
                    <span className="font-bold text-teal-900 font-mono text-sm">{selectedReport.patientFolderNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sample Date:</span>
                    <span className="font-medium text-slate-800">{selectedReport.sampleCollectionDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Report Verified:</span>
                    <span className="font-medium text-slate-800">{selectedReport.reportDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Requested By:</span>
                    <span className="font-medium text-slate-800">{selectedReport.requestedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Medical Lab Scientist:</span>
                    <span className="font-medium text-slate-800">{selectedReport.performedBy || 'Duty Scientist'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">License No:</span>
                    <span className="font-mono text-slate-700">{selectedReport.mlsLicenseNumber || 'AMLSCN-VERIFIED'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Category:</span>
                    <span className="font-bold text-slate-900">{selectedReport.category}</span>
                  </div>
                </div>

                {/* Test Title Banner */}
                <div className="py-2 px-4 bg-slate-900 text-white rounded-md mb-6 flex items-center justify-between">
                  <span className="font-bold text-sm uppercase tracking-wide">{selectedReport.testName}</span>
                  <span className="text-xs text-slate-300 font-mono">Specimen: {selectedReport.specimenType || 'Clinical'}</span>
                </div>

                {/* Quantitative Parameters Table */}
                {selectedReport.parameters && selectedReport.parameters.length > 0 && (
                  <div className="mb-6">
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-2 px-3">Test Parameter</th>
                          <th className="py-2 px-3">Observed Result</th>
                          <th className="py-2 px-3">Unit</th>
                          <th className="py-2 px-3">Biological Reference Range</th>
                          <th className="py-2 px-3 text-center">Status Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedReport.parameters.map((param, i) => (
                          <tr key={i} className={param.isAbnormal ? 'bg-rose-50 font-semibold' : 'bg-white'}>
                            <td className="py-2.5 px-3 text-slate-900">{param.name}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-950 text-sm">{param.value}</td>
                            <td className="py-2.5 px-3 text-slate-600">{param.unit || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-500">{param.referenceRange || '—'}</td>
                            <td className="py-2.5 px-3 text-center">
                              {param.flag === 'Critical' && (
                                <span className="px-2 py-0.5 bg-rose-600 text-white font-bold rounded-sm text-[11px]">
                                  CRITICAL
                                </span>
                              )}
                              {param.flag === 'High' && (
                                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-sm text-[11px]">
                                  HIGH [H]
                                </span>
                              )}
                              {param.flag === 'Low' && (
                                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded-sm text-[11px]">
                                  LOW [L]
                                </span>
                              )}
                              {param.flag === 'Abnormal' && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-sm text-[11px]">
                                  ABNORMAL
                                </span>
                              )}
                              {param.flag === 'Normal' && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-sm text-[11px]">
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

                {/* Findings / Impression */}
                {selectedReport.findingsOrImpression && (
                  <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                      Microscopic Findings / Radiologist Impression:
                    </h5>
                    <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                      {selectedReport.findingsOrImpression}
                    </p>
                  </div>
                )}

                {/* Clinical Notes */}
                {selectedReport.clinicalCorrelationNotes && (
                  <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <strong>Clinical Note:</strong> {selectedReport.clinicalCorrelationNotes}
                  </div>
                )}

                {/* Attached Scan / Image */}
                {selectedReport.attachmentUrl && (
                  <div className="mb-6">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                      Attached Diagnostic Scan / Analytical Strip:
                    </h5>
                    <div className="border border-slate-300 rounded-lg overflow-hidden max-w-xl bg-slate-900">
                      <img
                        src={selectedReport.attachmentUrl}
                        alt="Test attachment"
                        className="w-full max-h-96 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-2 bg-slate-900 text-white text-[11px] flex justify-between">
                        <span>{selectedReport.attachmentName || 'Diagnostic Scan'}</span>
                        <span className="text-slate-400">Validated Archival Image</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sign-off Stamps */}
                <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-700">
                  <div>
                    <div className="h-12 border-b border-slate-400 mb-1 flex items-end">
                      <span className="font-serif italic text-slate-800 text-sm font-bold">
                        {selectedReport.performedBy || 'Signed, Laboratory Scientist'}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900">Medical Laboratory Scientist / Radiographer</p>
                    <p className="text-[11px] text-slate-500">License: {selectedReport.mlsLicenseNumber || 'AMLSCN Registered'}</p>
                  </div>

                  <div className="text-right">
                    <div className="h-12 border-b border-slate-400 mb-1 flex items-end justify-end">
                      <span className="font-mono text-teal-900 font-bold">
                        HOSPITAL ARCHIVE VERIFIED ✓
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900">Hospital Central Medical Records Unit</p>
                    <p className="text-[11px] text-slate-500">Digital Filing System Verification Code: MF-LAB-{selectedReport.id.slice(-6)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
