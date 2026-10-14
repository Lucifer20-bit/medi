export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
export type Genotype = 'AA' | 'AS' | 'SS' | 'AC' | 'SC' | 'Unknown';
export type Gender = 'Male' | 'Female';

export interface NextOfKin {
  name: string;
  relationship: string;
  phone: string;
  address: string;
}

export interface PhysicalArchiveLocation {
  recordRoom: string;       // e.g. "Central Card Room A"
  cabinetRack: string;      // e.g. "Rack 04 (General Outpatient)"
  shelfLevel: string;       // e.g. "Shelf 3 (Top Tier)"
  boxNumber: string;        // e.g. "Box B-112"
  folderCondition: 'Good' | 'Fragile / Torn' | 'Water Damaged' | 'Pest Damaged' | 'Missing Spine';
  originalPaperCreatedAt?: string;
  shelfBarCode?: string;
}

export interface PaperScanImage {
  id: string;
  label: string;
  url: string;
  uploadedAt: string;
  extractedByAi?: boolean;
}

export interface VitalsEntry {
  id: string;
  patientId: string;
  recordedAt: string;
  recordedBy: string;
  bpSystolic: number;     // mmHg (e.g. 120)
  bpDiastolic: number;    // mmHg (e.g. 80)
  pulseRate: number;      // bpm (e.g. 72)
  temperature: number;    // °C (e.g. 36.8)
  respiratoryRate?: number; // breaths/min
  weightKg: number;       // kg
  heightCm?: number;      // cm
  bmi?: number;
  spo2?: number;          // %
  randomBloodSugar?: number; // mg/dL
  triageCategory: 'Routine (Green)' | 'Priority (Yellow)' | 'Emergency (Red)';
  clinicalNotes?: string;
}

export interface PrescriptionItem {
  id: string;
  drug: string;
  dose: string;
  route: 'Oral' | 'IV' | 'IM' | 'Topical' | 'Inhalation' | 'Eye Drops';
  frequency: 'OD (Once daily)' | 'BD (Twice daily)' | 'TDS (3x daily)' | 'QDS (4x daily)' | 'PRN (As needed)' | 'STAT (Immediately)';
  duration: string;
  dispensed: boolean;
  instructions?: string;
}

export interface ClinicalEncounter {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  department: 'General Outpatient (GOPD)' | 'Emergency / Casualty' | 'Antenatal / Maternity' | 'Pediatrics' | 'Internal Medicine' | 'Surgical Outpatient';
  chiefComplaint: string;
  historyOfPresentingIllness: string;
  examinationFindings: string;
  diagnoses: string[];
  prescriptions: PrescriptionItem[];
  investigationsOrdered: string[];
  planAndFollowUp: string;
}

export interface DoctorNote {
  id: string;
  patientId: string;
  folderNumber: string;
  patientName: string;
  createdAt: string;
  doctorName: string;
  doctorMdcnNumber: string;
  department: string;
  chiefComplaint: string;
  diagnosis: string;
  secondaryDiagnoses?: string[];
  vitalSignsSnapshot?: {
    bp?: string;
    pulse?: number;
    temp?: number;
    spo2?: number;
    weight?: number;
    rbs?: number;
  };
  clinicalObservations: string; // free-text area for detailed observations
  treatmentPlan: string;
  investigations?: string[];
  followUpDate?: string;
  urgency: 'Routine' | 'Urgent' | 'Critical / Admit';
}

export interface PrescriptionMedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route?: string;
  instructions?: string;
  inventoryItemId?: string;
  dispensed?: boolean;
}

export interface DigitalPrescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientFolderNumber: string;
  patientAge?: number;
  patientGender?: string;
  patientGenotype?: string;
  patientAllergies?: string[];
  diagnosis: string;
  treatmentPlan: string;
  medications: PrescriptionMedicationItem[];
  doctorName: string;
  doctorMdcnNumber: string;
  doctorSignature?: string; // canvas drawing or digital stamp
  hospitalName: string;
  createdAt: string;
  status: 'Pending' | 'Dispensed' | 'Cancelled';
  dispensedAt?: string;
  dispensedBy?: string;
  notes?: string;
}

export interface PharmacyStockMovement {
  id: string;
  inventoryItemId: string;
  drugName: string;
  type: 'stock_in' | 'dispense' | 'adjustment' | 'expired_waste';
  quantity: number;
  balanceAfter: number;
  patientFolderNumber?: string;
  patientName?: string;
  prescriptionId?: string;
  recordedBy: string;
  notes?: string;
  timestamp: string;
}

export interface PharmacyInventoryItem {
  id: string;
  drugName: string;
  brandName?: string;
  strength?: string;
  category: 'Antimalarial' | 'Antibiotic' | 'Analgesic / Antipyretic' | 'Antihypertensive' | 'Antidiabetic' | 'IV Fluids' | 'Vitamins / Supplements' | 'Sedatives / Controlled' | 'Other';
  form: 'Tablet' | 'Capsule' | 'Syrup / Suspension' | 'Injection / Ampoule' | 'Infusion IV' | 'Ointment' | 'Eye Drops';
  batchNumber: string;
  quantityInStock: number;
  reorderLevel: number; // threshold for low stock alert
  unit: 'tablets' | 'capsules' | 'bottles' | 'vials' | 'packs' | 'ampoules';
  unitPriceNgn: number;
  expiryDate: string; // YYYY-MM-DD
  supplier?: string;
  shelfLocation?: string;
  lastRestockedAt: string;
}

export type LabCategory = 'Blood Work' | 'Radiology' | 'Urinalysis' | 'Microbiology' | 'Other';
export type LabReportStatus = 'Pending' | 'In-Progress' | 'Completed' | 'Critical Alert';

export interface LabTestParameter {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  flag?: 'Normal' | 'High' | 'Low' | 'Abnormal' | 'Critical';
}

export interface LabReport {
  id: string;
  patientId: string;
  patientName: string;
  patientFolderNumber: string;
  testName: string;
  category: LabCategory;
  specimenType?: string;
  requestedBy: string;
  performedBy?: string;
  mlsLicenseNumber?: string;
  sampleCollectionDate: string;
  reportDate: string;
  status: LabReportStatus;
  urgency: 'Routine' | 'Urgent' | 'STAT / Emergency';
  parameters?: LabTestParameter[];
  findingsOrImpression?: string;
  clinicalCorrelationNotes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  isFlaggedAbnormal?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type AppointmentStatus = 'Scheduled' | 'Checked-In' | 'In Consultation' | 'Completed' | 'Cancelled' | 'No-Show';
export type AppointmentPriority = 'Routine' | 'Priority' | 'Emergency';
export type AppointmentClinic = 
  | 'General Outpatient (GOPD)' 
  | 'Antenatal / Maternity Clinic (ANC)' 
  | 'Antenatal Clinic (ANC)'
  | 'Paediatric Outpatient Clinic' 
  | 'Paediatrics & Child Health'
  | 'Surgical Outpatient (SOPD)' 
  | 'Internal Medicine / Hypertension' 
  | 'Internal Medicine / Chronic Disease'
  | 'Obstetrics & Gynaecology (O&G)'
  | 'Eye Clinic (Ophthalmology)' 
  | 'Ophthalmology (Eye Clinic)'
  | 'Dental Clinic' 
  | 'Orthopaedics & Trauma'
  | 'Accident & Emergency Follow-Up';

export interface PatientAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientFolderNumber: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: Gender;
  doctorName: string;
  clinic: AppointmentClinic;
  appointmentDate: string; // YYYY-MM-DD
  timeSlot: string;
  appointmentType: 'Routine Follow-up' | 'Lab Review' | 'New Consultation' | 'Antenatal Booking' | 'Post-Op Check' | 'Medication Refill';
  priority: AppointmentPriority;
  status: AppointmentStatus;
  reasonForVisit: string;
  clinicNotes?: string;
  bookedBy: string;
  checkedInAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ----------------------------------------------------
// BILLING & INVOICING TYPES
// ----------------------------------------------------
export type BillingCategory = 
  | 'Consultation' 
  | 'Laboratory' 
  | 'Pharmacy' 
  | 'Radiology' 
  | 'Nursing & Ward' 
  | 'Consumables / Registration';

export interface BillLineItem {
  id: string;
  category: BillingCategory;
  description: string;
  quantity: number;
  unitPrice: number; // in NGN (₦)
  totalPrice: number; // quantity * unitPrice
  referenceId?: string; // encounterId, labReportId, prescriptionId, or inventoryItemId
  coveredByNhia?: boolean;
  nhiaCoveredPercent?: number; // e.g. 90 (90% covered, 10% co-pay)
  notes?: string;
}

export type PaymentMethod = 
  | 'Cash' 
  | 'POS / Debit Card' 
  | 'Bank Transfer' 
  | 'NHIA / State Health Scheme' 
  | 'HMO Retainership';

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  amount: number; // in NGN
  paymentMethod: PaymentMethod;
  paymentDate: string; // ISO string
  transactionReference?: string;
  cashierName: string;
  notes?: string;
}

export type InvoiceStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Waived' | 'Refunded';

export interface PatientInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0042"
  patientId: string;
  patientName: string;
  patientFolderNumber: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: Gender;
  nhiaNumber?: string;
  hmoProvider?: string;
  lineItems: BillLineItem[];
  subtotal: number;
  discountOrWaiver: number;
  nhiaCoverageAmount: number;
  totalPayable: number; // subtotal - discountOrWaiver - nhiaCoverageAmount
  totalPaid: number;
  balanceDue: number; // totalPayable - totalPaid
  status: InvoiceStatus;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
  cashierOrBiller: string;
  dueDate?: string;
  notes?: string;
}

export interface DailyRevenueSummary {
  date: string;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalNhiaClaims: number;
  totalWaivers: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  partiallyPaidCount: number;
  revenueByDepartment: {
    consultations: number;
    pharmacy: number;
    laboratory: number;
    radiology: number;
    nursingAndWards: number;
    consumables: number;
  };
  revenueByPaymentMethod: {
    cash: number;
    pos: number;
    transfer: number;
    nhiaHmo: number;
  };
  recentTransactions: {
    id: string;
    receiptNumber: string;
    invoiceNumber: string;
    patientName: string;
    patientFolderNumber: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    cashierName: string;
  }[];
}

export interface PatientRecord {
  id: string;
  folderNumber: string;         // e.g. "GH-IKEJA/2022/0419"
  nin?: string;                 // 11 digits National ID Number
  nhiaNumber?: string;          // National Health Insurance Authority / State Health Scheme
  hmoProvider?: string;
  surname: string;
  firstName: string;
  otherNames?: string;
  gender: Gender;
  dateOfBirth: string;
  bloodGroup: BloodGroup;
  genotype: Genotype;
  phone: string;
  alternatePhone?: string;
  email?: string;
  residentialAddress: string;
  stateOfOrigin: string;
  lga: string;
  occupation?: string;
  maritalStatus?: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  religion?: 'Christianity' | 'Islam' | 'Traditional' | 'Other';
  nextOfKin: NextOfKin;
  allergies: string[];
  chronicConditions: string[];
  physicalArchive: PhysicalArchiveLocation;
  paperScanImages: PaperScanImage[];
  vitalsHistory: VitalsEntry[];
  encounters: ClinicalEncounter[];
  doctorNotes?: DoctorNote[];
  digitalPrescriptions?: DigitalPrescription[];
  labReports?: LabReport[];
  appointments?: PatientAppointment[];
  invoices?: PatientInvoice[];
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  syncVersion: number;
}

export type StaffRole = 
  | 'records_clerk'    // Health Records Officer (Registration, Digitizer, Shelf Management)
  | 'triage_nurse'     // Nurse (Vitals, Triage Queuing, Emergency Flagging)
  | 'medical_officer'  // Doctor (Clinical Consultations, Diagnoses, Prescriptions)
  | 'pharmacist'       // Dispensary & Pharmacy Fulfillment
  | 'cashier_accounts' // Hospital Cashier & Billing Accounts Officer
  | 'records_admin';   // Hospital Admin (Audit trail, Cloud Sync, Backup & Restore)

export interface UserProfile {
  name: string;
  role: StaffRole;
  hospitalName: string;
  station: string;
}

export interface OfflineSyncQueueItem {
  id: string;
  action: 'create_patient' | 'update_patient' | 'add_encounter' | 'add_vitals' | 'delete_patient';
  patientId: string;
  timestamp: string;
  payload: any;
  retryCount: number;
}

export interface DigitizedPaperResult {
  folderNumber?: string;
  surname?: string;
  firstName?: string;
  otherNames?: string;
  gender?: Gender;
  age?: number;
  dateOfBirth?: string;
  phone?: string;
  residentialAddress?: string;
  stateOfOrigin?: string;
  lga?: string;
  bloodGroup?: BloodGroup;
  genotype?: Genotype;
  nhiaNumber?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  allergies?: string[];
  chronicConditions?: string[];
  suggestedArchiveRack?: string;
  suggestedArchiveBox?: string;
  confidenceScore: number;
  extractedClinicalNotes?: string;
}
