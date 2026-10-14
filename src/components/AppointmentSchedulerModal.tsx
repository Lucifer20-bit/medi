import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Filter,
  Search,
  ChevronRight,
  Phone,
  Building2,
  Stethoscope,
  ClipboardList,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import {
  PatientAppointment,
  AppointmentClinic,
  AppointmentStatus,
  AppointmentPriority,
  PatientRecord
} from '../types';
import {
  getAppointments,
  bookAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getLocalPatients,
  subscribeToStorage
} from '../lib/storage';
import { getTodayDateStr } from '../data/labAndAppointmentSeed';

interface AppointmentSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPatient?: (patient: PatientRecord) => void;
  onSelectPatient?: (patient: PatientRecord) => void;
  defaultView?: 'schedule' | 'book';
  selectedPatient?: PatientRecord | null;
  patients?: PatientRecord[];
  currentRole?: any;
  onAppointmentUpdated?: () => void;
}

const calculateAge = (dob?: string): number | undefined => {
  if (!dob) return undefined;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return undefined;
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

const CLINICS: AppointmentClinic[] = [
  'General Outpatient (GOPD)',
  'Antenatal Clinic (ANC)',
  'Paediatrics & Child Health',
  'Surgical Outpatient (SOPD)',
  'Internal Medicine / Chronic Disease',
  'Obstetrics & Gynaecology (O&G)',
  'Ophthalmology (Eye Clinic)',
  'Dental Clinic',
  'Orthopaedics & Trauma',
];

const TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
];

export const AppointmentSchedulerModal: React.FC<AppointmentSchedulerModalProps> = ({
  isOpen,
  onClose,
  onOpenPatient,
  onSelectPatient,
  defaultView = 'schedule',
  selectedPatient = null,
  patients,
  onAppointmentUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'book' | 'all'>(defaultView);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [selectedClinic, setSelectedClinic] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  // Booking Form State
  const [bookPatientId, setBookPatientId] = useState<string>(selectedPatient?.id || '');
  const [bookPatientName, setBookPatientName] = useState<string>(
    selectedPatient ? `${selectedPatient.surname}, ${selectedPatient.firstName}` : ''
  );
  const [bookFolderNumber, setBookFolderNumber] = useState<string>(selectedPatient?.folderNumber || '');
  const [bookPhone, setBookPhone] = useState<string>(selectedPatient?.phone || '');
  const [bookAge, setBookAge] = useState<number | undefined>(calculateAge(selectedPatient?.dateOfBirth));
  const [bookGender, setBookGender] = useState<string | undefined>(selectedPatient?.gender);
  const [bookDoctor, setBookDoctor] = useState('Dr. Chidi Okafor, FWACS');
  const [bookClinic, setBookClinic] = useState<AppointmentClinic>('General Outpatient (GOPD)');
  const [bookDate, setBookDate] = useState<string>(getTodayDateStr());
  const [bookTimeSlot, setBookTimeSlot] = useState<string>('09:00 AM');
  const [bookType, setBookType] = useState<string>('Routine Follow-up');
  const [bookPriority, setBookPriority] = useState<AppointmentPriority>('Routine');
  const [bookReason, setBookReason] = useState<string>('');
  const [bookClinicNotes, setBookClinicNotes] = useState<string>('');
  const [bookOfficer, setBookOfficer] = useState<string>('Sister Ngozi (Front Desk)');

  const allPatients = getLocalPatients();

  const loadAppointmentsList = async () => {
    setLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAppointmentsList();
      if (selectedPatient) {
        setBookPatientId(selectedPatient.id);
        setBookPatientName(`${selectedPatient.surname}, ${selectedPatient.firstName}`);
        setBookFolderNumber(selectedPatient.folderNumber);
        setBookPhone(selectedPatient.phone || '');
        setBookAge(selectedPatient.age);
        setBookGender(selectedPatient.gender);
      }
    }
  }, [isOpen, selectedPatient]);

  useEffect(() => {
    const unsub = subscribeToStorage(() => {
      loadAppointmentsList();
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  // Filter appointments for "Today's Schedule"
  const todaysAppointments = appointments.filter((a) => a.appointmentDate === selectedDate);
  let displayedSchedule = todaysAppointments;

  if (selectedClinic !== 'All') {
    displayedSchedule = displayedSchedule.filter((a) => a.clinic === selectedClinic);
  }
  if (statusFilter !== 'All') {
    displayedSchedule = displayedSchedule.filter((a) => a.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedSchedule = displayedSchedule.filter(
      (a) =>
        a.patientName.toLowerCase().includes(q) ||
        a.patientFolderNumber.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.reasonForVisit.toLowerCase().includes(q)
    );
  }

  // Count stats for selected date
  const stats = {
    total: todaysAppointments.length,
    scheduled: todaysAppointments.filter((a) => a.status === 'Scheduled').length,
    checkedIn: todaysAppointments.filter((a) => a.status === 'Checked-In').length,
    inConsult: todaysAppointments.filter((a) => a.status === 'In Consultation').length,
    completed: todaysAppointments.filter((a) => a.status === 'Completed').length,
  };

  const handlePatientSelectChange = (patId: string) => {
    setBookPatientId(patId);
    const pat = (patients || allPatients).find((p) => p.id === patId);
    if (pat) {
      setBookPatientName(`${pat.surname}, ${pat.firstName}`);
      setBookFolderNumber(pat.folderNumber);
      setBookPhone(pat.phone || '');
      setBookAge(calculateAge(pat.dateOfBirth));
      setBookGender(pat.gender);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setActionFeedback(`Appointment status updated to ${newStatus}`);
      await loadAppointmentsList();
      if (onAppointmentUpdated) onAppointmentUpdated();
      setTimeout(() => setActionFeedback(''), 2500);
    } catch (err: any) {
      setActionFeedback(`Error updating: ${err.message}`);
    }
  };

  const handleOpenFolder = (appointment: PatientAppointment) => {
    const patient = (patients || allPatients).find(
      (p) => p.id === appointment.patientId || p.folderNumber === appointment.patientFolderNumber
    );
    if (patient) {
      if (onSelectPatient) {
        onSelectPatient(patient);
      } else if (onOpenPatient) {
        onOpenPatient(patient);
      }
      onClose();
    } else {
      setActionFeedback(`Could not locate full patient folder for ${appointment.patientFolderNumber}`);
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPatientName || !bookReason.trim()) {
      setActionFeedback('Please provide a patient name and reason for visit.');
      return;
    }

    try {
      await bookAppointment({
        patientId: bookPatientId,
        patientName: bookPatientName,
        patientFolderNumber: bookFolderNumber || 'UNASSIGNED',
        patientPhone: bookPhone,
        patientAge: bookAge,
        patientGender: bookGender,
        doctorName: bookDoctor,
        clinic: bookClinic,
        appointmentDate: bookDate,
        timeSlot: bookTimeSlot,
        appointmentType: bookType,
        priority: bookPriority,
        reasonForVisit: bookReason,
        clinicNotes: bookClinicNotes,
        bookedBy: bookOfficer,
      });

      setActionFeedback(`Appointment successfully scheduled for ${bookPatientName} on ${bookDate} at ${bookTimeSlot}!`);
      await loadAppointmentsList();
      setSelectedDate(bookDate);
      setTimeout(() => {
        setActionFeedback('');
        setActiveTab('schedule');
      }, 900);
    } catch (err: any) {
      setActionFeedback(`Booking failed: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-900 text-white rounded-lg shadow-xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Hospital Outpatient Appointments & Clinic Queue
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-300 rounded-full">
                  Front Desk & Doctor Station
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Synchronized booking calendar linking directly to physical and digital medical records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 text-sm">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Today&apos;s Schedule (Doctor&apos;s View)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('book')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1.5 ${
                activeTab === 'book'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Book New Appointment (Front Desk)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center space-x-1.5 ${
                activeTab === 'all'
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>All Upcoming ({appointments.length})</span>
            </button>
          </div>

          {activeTab === 'schedule' && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Date:</span>
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayDateStr())}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                  selectedDate === getTodayDateStr()
                    ? 'bg-teal-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Today
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="py-1 px-2 text-xs bg-slate-100 border border-slate-300 rounded-md font-medium text-slate-800"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {actionFeedback && (
            <div className="mb-4 p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}

          {/* TAB 1: TODAY'S SCHEDULE (DOCTOR'S DASHBOARD VIEW) */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {/* Daily Overview Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <p className="text-[11px] text-slate-500 font-medium">Total Booked</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <p className="text-[11px] text-amber-700 font-medium">Expected</p>
                  <p className="text-xl font-black text-amber-900 mt-0.5">{stats.scheduled}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <p className="text-[11px] text-sky-700 font-medium">Arrived / Checked In</p>
                  <p className="text-xl font-black text-sky-900 mt-0.5">{stats.checkedIn}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <p className="text-[11px] text-purple-700 font-medium">In Consultation</p>
                  <p className="text-xl font-black text-purple-900 mt-0.5">{stats.inConsult}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                  <p className="text-[11px] text-emerald-700 font-medium">Completed</p>
                  <p className="text-xl font-black text-emerald-900 mt-0.5">{stats.completed}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient, doctor, or reason..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <select
                    value={selectedClinic}
                    onChange={(e) => setSelectedClinic(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-medium text-slate-800"
                  >
                    <option value="All">All Specialty Clinics</option>
                    {CLINICS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 text-slate-800"
                  >
                    <option value="All">All Visit Statuses</option>
                    <option value="Scheduled">Scheduled (Not Arrived)</option>
                    <option value="Checked-In">Checked-In (Waiting in Hall)</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Patient Appointments List */}
              {displayedSchedule.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">
                    No patient appointments scheduled for {selectedDate}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    The front desk can book routine consultations, antenatal checkups, and post-op follow-ups.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('book')}
                    className="px-4 py-2 bg-teal-900 text-white rounded-lg text-xs font-semibold hover:bg-teal-950 transition-colors inline-flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Book Appointment for This Date</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedSchedule.map((apt) => (
                    <div
                      key={apt.id}
                      className={`p-4 bg-white border rounded-xl transition-all shadow-xs ${
                        apt.status === 'Checked-In'
                          ? 'border-sky-300 bg-sky-50/20'
                          : apt.status === 'In Consultation'
                          ? 'border-purple-300 bg-purple-50/20 ring-1 ring-purple-400'
                          : apt.status === 'Completed'
                          ? 'border-emerald-200 bg-emerald-50/10'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Time & Patient Info */}
                        <div className="flex items-start space-x-3.5">
                          <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-center shrink-0">
                            <span className="block text-xs font-mono font-bold text-slate-900">
                              {apt.timeSlot}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Slot</span>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-bold text-slate-900">{apt.patientName}</h4>
                              <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-teal-50 text-teal-900 border border-teal-200 rounded-md">
                                {apt.patientFolderNumber}
                              </span>
                              {apt.priority === 'Emergency' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-md">
                                  EMERGENCY
                                </span>
                              )}
                              {apt.priority === 'Priority' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-md">
                                  PRIORITY
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              <span className="inline-flex items-center text-slate-800 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                {apt.clinic}
                              </span>
                              <span className="inline-flex items-center text-slate-700">
                                <Stethoscope className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                {apt.doctorName}
                              </span>
                              {apt.patientPhone && (
                                <span className="inline-flex items-center text-slate-500">
                                  <Phone className="w-3 h-3 text-slate-400 mr-1" />
                                  {apt.patientPhone}
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-xs text-slate-700 font-medium bg-slate-50 p-2 rounded-md border border-slate-100">
                              <span className="text-slate-400 font-normal">Reason: </span>
                              {apt.reasonForVisit}
                            </p>
                          </div>
                        </div>

                        {/* Status Badges & Actions */}
                        <div className="flex flex-wrap items-center gap-2 md:self-center shrink-0">
                          {/* Current Status Pill */}
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                              apt.status === 'Checked-In'
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : apt.status === 'In Consultation'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : apt.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : apt.status === 'Cancelled'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {apt.status}
                          </span>

                          {/* Quick Workflow Action Buttons */}
                          {apt.status === 'Scheduled' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(apt.id, 'Checked-In')}
                              className="px-3 py-1.5 text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white rounded-lg transition-colors inline-flex items-center space-x-1"
                              title="Front desk check-in when patient arrives at hospital"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Check-In</span>
                            </button>
                          )}

                          {apt.status === 'Checked-In' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(apt.id, 'In Consultation')}
                              className="px-3 py-1.5 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors inline-flex items-center space-x-1"
                              title="Call patient into doctor consulting room"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Call Patient</span>
                            </button>
                          )}

                          {apt.status === 'In Consultation' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(apt.id, 'Completed')}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors inline-flex items-center space-x-1"
                              title="Mark consultation concluded"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete</span>
                            </button>
                          )}

                          {/* Direct link to patient file */}
                          <button
                            type="button"
                            onClick={() => handleOpenFolder(apt)}
                            className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors inline-flex items-center space-x-1"
                            title="Open full medical history, vitals, prescriptions and lab reports"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Open File</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FRONT DESK BOOKING FORM */}
          {activeTab === 'book' && (
            <form onSubmit={handleBookSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">Front Desk Patient Appointment Booking</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schedule follow-ups, specialist clinic referrals, or antenatal visits with instant patient record linking.
                </p>
              </div>

              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Patient from Hospital Registry *
                  </label>
                  <select
                    value={bookPatientId}
                    onChange={(e) => handlePatientSelectChange(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-medium"
                  >
                    <option value="">-- Choose registered patient or enter below --</option>
                    {allPatients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.surname}, {p.firstName} — {p.folderNumber} ({p.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient Name (as per file) *
                  </label>
                  <input
                    type="text"
                    value={bookPatientName}
                    onChange={(e) => setBookPatientName(e.target.value)}
                    placeholder="Surname, First Name"
                    required
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Folder / Card Number</label>
                  <input
                    type="text"
                    value={bookFolderNumber}
                    onChange={(e) => setBookFolderNumber(e.target.value)}
                    placeholder="e.g. FMA-2023-0891"
                    className="w-full py-2 px-3 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={bookPhone}
                    onChange={(e) => setBookPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Type</label>
                  <select
                    value={bookType}
                    onChange={(e) => setBookType(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  >
                    <option value="Routine Follow-up">Routine Follow-up</option>
                    <option value="New Consultation">New Consultation</option>
                    <option value="Antenatal Booking">Antenatal Booking (ANC)</option>
                    <option value="Post-Operative Check">Post-Operative Check</option>
                    <option value="Lab & Radiology Review">Lab & Radiology Review</option>
                    <option value="Chronic Care Refill">Chronic Care / Hypertension / Diabetes</option>
                    <option value="Paediatric Immunization">Paediatric Immunization</option>
                  </select>
                </div>
              </div>

              {/* Clinic and Doctor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty Clinic / Unit *</label>
                  <select
                    value={bookClinic}
                    onChange={(e) => setBookClinic(e.target.value as AppointmentClinic)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-medium"
                  >
                    {CLINICS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor / Consultant</label>
                  <select
                    value={bookDoctor}
                    onChange={(e) => setBookDoctor(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-medium"
                  >
                    <option value="Dr. Chidi Okafor, FWACS">Dr. Chidi Okafor, FWACS (Consultant Surgeon)</option>
                    <option value="Dr. Amina Bello, MBBS, FMCOG">Dr. Amina Bello, MBBS, FMCOG (Senior Consultant O&G)</option>
                    <option value="Dr. Emeka Nnamdi, MBBS, MPH">Dr. Emeka Nnamdi, MBBS, MPH (Family Medicine)</option>
                    <option value="Dr. Zainab Aliyu, MBBS, FMCPaed">Dr. Zainab Aliyu, MBBS, FMCPaed (Consultant Paediatrician)</option>
                    <option value="Duty Medical Officer (GOPD)">Duty Medical Officer (GOPD)</option>
                  </select>
                </div>
              </div>

              {/* Date, Slot and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Time Slot *</label>
                  <select
                    value={bookTimeSlot}
                    onChange={(e) => setBookTimeSlot(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-mono font-medium"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Triage Priority</label>
                  <select
                    value={bookPriority}
                    onChange={(e) => setBookPriority(e.target.value as AppointmentPriority)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-semibold"
                  >
                    <option value="Routine">Routine Visit</option>
                    <option value="Priority">Priority (Elderly / Antenatal / Infant)</option>
                    <option value="Emergency">Emergency / Fast-Track</option>
                  </select>
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Visit / Presenting Complaint *
                </label>
                <textarea
                  rows={3}
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  placeholder="e.g. 4-week BP review, review fasting lipid profile, recurrent epigastric pain, or routine 32-week ANC palpation..."
                  required
                  className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                />
              </div>

              {/* Clinic Instructions & Front Desk Officer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Clinic Instructions for Patient
                  </label>
                  <input
                    type="text"
                    value={bookClinicNotes}
                    onChange={(e) => setBookClinicNotes(e.target.value)}
                    placeholder="e.g. Come with previous scan film and ANC green card"
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Booked By (Staff Member)</label>
                  <input
                    type="text"
                    value={bookOfficer}
                    onChange={(e) => setBookOfficer(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-900 hover:bg-teal-950 rounded-lg transition-colors shadow-sm inline-flex items-center space-x-1.5"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Confirm & Schedule Appointment</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ALL APPOINTMENTS REGISTRY */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Hospital Central Appointment Registry ({appointments.length})
                </h4>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-3 px-3.5">Date & Time</th>
                      <th className="py-3 px-3.5">Patient Name</th>
                      <th className="py-3 px-3.5">Folder No.</th>
                      <th className="py-3 px-3.5">Specialty Clinic</th>
                      <th className="py-3 px-3.5">Doctor</th>
                      <th className="py-3 px-3.5">Reason for Visit</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 whitespace-nowrap">
                          <div>{apt.appointmentDate}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{apt.timeSlot}</div>
                        </td>
                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {apt.patientName}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-teal-900 font-semibold">
                          {apt.patientFolderNumber}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700">{apt.clinic}</td>
                        <td className="py-2.5 px-3.5 text-slate-600">{apt.doctorName}</td>
                        <td className="py-2.5 px-3.5 text-slate-600 max-w-xs truncate">{apt.reasonForVisit}</td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                              apt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-800'
                                : apt.status === 'Checked-In'
                                ? 'bg-sky-50 text-sky-800'
                                : apt.status === 'In Consultation'
                                ? 'bg-purple-50 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenFolder(apt)}
                            className="px-2.5 py-1 text-xs font-semibold text-teal-900 hover:bg-teal-50 rounded-md border border-teal-200 transition-colors"
                          >
                            Open Folder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
