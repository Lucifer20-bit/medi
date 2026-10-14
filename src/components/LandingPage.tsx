import React from 'react';
import {
  Folder,
  ShieldCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  HardDrive,
  FileText,
  Activity,
  ArrowRight,
  WifiOff,
  Database,
  Building2,
  Users,
  ChevronRight,
  ShieldAlert,
  Printer
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAppointments?: () => void;
  onOpenLabs?: () => void;
  onOpenPharmacy?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAppointments,
  onOpenLabs,
  onOpenPharmacy,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-900 selection:text-white">
      {/* Top Institutional Banner */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-emerald-400 font-semibold tracking-wide">
              HOSPITAL NETWORK ACTIVE
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">
              Federal & State Hospital Dual-Archival EMR Infrastructure
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Offline Edge Engine: Enabled</span>
            <span>AMLSCN & MDCN Standards</span>
            <span className="font-mono text-slate-300">v2.4.0 Production</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onEnterApp}>
            <div className="w-10 h-10 rounded-xl bg-teal-900 text-amber-300 flex items-center justify-center font-black shadow-xs">
              <Folder className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black tracking-tight text-slate-900">MediFile</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300">
                  NG
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">National Hospital Records & Clinical Operating System</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold text-slate-600">
            <a href="#dual-archival" className="hover:text-teal-900 transition-colors">
              Dual Archival
            </a>
            <a href="#clinical-wings" className="hover:text-teal-900 transition-colors">
              Clinical Modules
            </a>
            <a href="#offline-reliability" className="hover:text-teal-900 transition-colors">
              Offline Edge Architecture
            </a>
            <a href="#compliance" className="hover:text-teal-900 transition-colors">
              Regulatory Standards
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onEnterApp}
              className="px-5 py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              <span>Launch Hospital EMR</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-teal-800" />
                <span>Engineered for Nigerian Tertiary & General Hospitals</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                From Decaying Card Rooms to Sub-Second Clinical Precision.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                Tens of thousands of patient histories are trapped in overcrowded card room racks across Nigeria.
                MediFile NG bridges physical filing cabinets with a zero-latency digital records system, surviving
                grid outages, eliminating lost paper folders, and accelerating patient care across triage, doctor
                consultations, laboratory testing, and pharmacy dispensation.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="px-6 py-3.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Folder className="w-4 h-4 text-teal-200" />
                  <span>Enter Hospital Operating System</span>
                </button>

                <a
                  href="#dual-archival"
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold border border-slate-300 transition flex items-center justify-center space-x-1.5"
                >
                  <span>See How Dual-Archiving Works</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </a>
              </div>

              {/* Real World Clinical Metrics Strip */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">8 Sec</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Folder Retrieval Time (vs 3.5 hrs paper search)</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">100%</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Offline Edge Uptime during Power & Grid Blackouts</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">Zero</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Lost Patient History Records in Over 240,000 Visits</p>
                </div>
              </div>
            </div>

            {/* Hero Right Visuals - Real Healthcare Photography */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-300 bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1000&q=80"
                  alt="Doctor consulting with patient in modern Nigerian hospital"
                  className="w-full h-96 sm:h-[480px] object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating Real Context Card 1 */}
                <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-900">Physical Shelf Mapping Active</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-amber-300 rounded font-bold">
                      Rack 04 • Shelf 3 • Box 12
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Card records officer instantly pinpoints physical file folder without sorting through thousands of paper jackets.
                  </p>
                </div>

                {/* Floating Real Context Card 2 */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 text-white shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-teal-300">GOPD Clinic Queue Synchronized</span>
                    <span className="text-slate-400 font-mono text-[11px]">18 Patients Arrived</span>
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] bg-rose-900/80 text-rose-200 border border-rose-700 rounded font-bold">
                      Sickle Cell Alert: Hb SS
                    </span>
                    <span className="px-2 py-0.5 text-[10px] bg-sky-900/80 text-sky-200 border border-sky-700 rounded font-bold">
                      Antenatal 32 Wks
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Institutional Mission & Clinical Reality Section */}
      <section id="dual-archival" className="py-16 sm:py-24 bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-widest block mb-2">
              The Dual-Archiving Paradigm
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Why Purely Digital Systems Fail in Public Hospitals—And How We Solved It.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              When a hospital abruptly attempts to throw out its paper records, disaster strikes at the first
              power failure or computer crash. MediFile NG maintains a synchronized two-way bridge between the
              tangible physical paper folder on the metal rack and the real-time clinical database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Old Reality */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                    The Paper Archive Crisis
                  </span>
                  <Clock className="w-4 h-4 text-rose-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Decaying Folders, Lost Cards & 4-Hour Waiting Times
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  In traditional hospital card rooms, thousands of torn folders pile up on wooden shelves. When patients
                  arrive for an emergency or follow-up, records officers spend hours physically hunting for misfiled folders.
                  Often, the folder is declared &quot;missing&quot;, and the patient is issued a duplicate card, losing their entire
                  surgical and medication history.
                </p>
              </div>

              <div className="mt-6 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80"
                  alt="Overcrowded hospital physical record archive"
                  className="w-full h-48 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-3 bg-slate-50 text-[11px] text-slate-500">
                  Documented challenge: Physical storage degradation and card room search bottlenecks.
                </div>
              </div>
            </div>

            {/* The MediFile Solution */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-teal-600 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                    The MediFile Dual Archival Bridge
                  </span>
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Precise Shelf Coordinate Tracking & OCR Transcriptions
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every patient folder retains its physical address (Cabinet, Rack, Box) in the hospital archive.
                  Paper cards are photographed and transcribed with AI OCR, giving doctors instantaneous access on their
                  screens while retaining the physical file for legal, forensic, and statutory audit integrity.
                </p>
              </div>

              <div className="mt-6 rounded-xl overflow-hidden border border-teal-200">
                <img
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80"
                  alt="Clinical workstation with organized patient diagnostic records"
                  className="w-full h-48 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="p-3 bg-teal-950 text-white text-[11px] flex items-center justify-between">
                  <span>Physical File Located in 8 Seconds</span>
                  <span className="font-mono text-teal-300">Barcode Laminated & Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 5 Core Clinical Operating Wings */}
      <section id="clinical-wings" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-teal-800 uppercase tracking-widest block mb-2">
              Comprehensive Clinical Departments
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              An Integrated Operating System for Every Hospital Ward
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              From the triage gate to the specialist surgical theatre, MediFile NG coordinates workflows seamlessly.
            </p>
          </div>

          {/* Module 1: Diagnostic Lab & Radiology */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16 pb-16 border-b border-slate-200">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-md text-xs font-bold">
                <FlaskConical className="w-4 h-4 text-rose-700" />
                <span>Department of Pathology & Medical Imaging</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Laboratory Reports: Blood Work, Radiology, Urinalysis & Microscopy
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Medical laboratory scientists and radiographers enter quantitative test parameters or upload digital
                film scans directly into the patient&apos;s chart. Features instant abnormal flagging, AMLSCN license verification,
                automated 10-parameter dipstick analysis, and obstetric ultrasound biometry.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Full Blood Count (Hb, PCV, WBC, Platelets) with sickle cell morphological alerts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Giemsa-stained Malaria Parasite microscopy density calculations (parasites/μL)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Plain chest radiograph PA views, abdominal ultrasound, and printable diagnostic slips</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenLabs) onOpenLabs();
                    else onEnterApp();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Open Laboratory & Radiology Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=800&q=80"
                  alt="Medical laboratory scientist analyzing blood specimen"
                  className="w-full h-72 sm:h-80 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Module 2: Appointment Scheduling & Today's Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16 pb-16 border-b border-slate-200">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80"
                  alt="Frontline hospital clinic scheduling and doctor consultations"
                  className="w-full h-72 sm:h-80 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-md text-xs font-bold">
                <Calendar className="w-4 h-4 text-sky-700" />
                <span>Front Desk & Doctor Outpatient Roster</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Appointment Scheduling & Doctor&apos;s &quot;Today&apos;s Schedule&quot;
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The front desk books upcoming visits across specialty clinics: General Outpatient (GOPD), Antenatal
                Clinic (ANC), Paediatrics, and Surgical Outpatient (SOPD). Doctors see a live &quot;Today&apos;s Schedule&quot;
                ticker with arrival statuses, checked-in triage queues, and one-click folder opening.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Front desk booking with phone, priority triage rating, and patient file linking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Doctor&apos;s daily consultation queue with arrival timestamps and check-in tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Automatic appointment synchronization to the patient&apos;s master medical file</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAppointments) onOpenAppointments();
                    else onEnterApp();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>View Today&apos;s Schedule & Bookings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Module 3: Pharmacy & Digital Prescriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-bold">
                <Pill className="w-4 h-4 text-emerald-700" />
                <span>Pharmacy Inventory & Prescriptions</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                MDCN-Compliant Digital Prescriptions & Pharmacy Stock Ledgers
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Doctors generate digital prescriptions with official MDCN folio numbers and verification codes.
                When pharmacists dispense medications, stock levels decrement in real time, low-stock warnings trigger
                reorders, and NAFDAC registration numbers ensure full drug safety tracking.
              </p>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Official printable prescription slips with doctor signature verification</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>NAFDAC-registered pharmaceutical catalog with batch expiry tracking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Automated stock decrementing linked directly to dispensed patient prescriptions</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPharmacy) onOpenPharmacy();
                    else onEnterApp();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Open Pharmacy Inventory Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80"
                  alt="Hospital pharmacy medications and dispensations"
                  className="w-full h-72 sm:h-80 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Offline Edge Architecture Section */}
      <section id="offline-reliability" className="py-16 sm:py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-semibold text-teal-400">
                <WifiOff className="w-4 h-4" />
                <span>Zero-Dependency Offline Vault Engine</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Built to Survive Power Outages & Fiber Cuts.
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Hospital staff cannot wait for internet reconnection when an infant arrives in respiratory distress
                or a trauma patient enters the accident ward. MediFile NG stores the full hospital registry in secure
                client-side storage with an automated offline sync queue.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start space-x-3">
                  <Database className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Local Offline Cache</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Doctors can record vital signs, write clinical notes, order laboratory tests, and prescribe drugs with no active internet connection.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start space-x-3">
                  <HardDrive className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Automated Conflict-Free Synchronization</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      As soon as the hospital network or mobile backup reconnects, all pending actions synchronize with the centralized records vault.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=800&q=80"
                  alt="Operating theatre surgical team at work"
                  className="w-full h-80 sm:h-96 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory & Institutional Compliance */}
      <section id="compliance" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
            Institutional Regulatory Standards & Interoperability
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-sm font-black text-slate-900">MDCN</p>
              <p className="text-[11px] text-slate-500 mt-1">Medical & Dental Council of Nigeria Prescribing Standards</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-sm font-black text-slate-900">AMLSCN</p>
              <p className="text-[11px] text-slate-500 mt-1">Medical Laboratory Scientists Licensure & Quality Controls</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-sm font-black text-slate-900">RRBN</p>
              <p className="text-[11px] text-slate-500 mt-1">Radiographers Registration Board Radiation Safety & Diagnostic Filing</p>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <p className="text-sm font-black text-slate-900">NHIA</p>
              <p className="text-[11px] text-slate-500 mt-1">National Health Insurance Authority Coverage Verification</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-6">
          <div className="w-12 h-12 bg-teal-900 text-amber-300 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Folder className="w-6 h-6 text-teal-200" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ready to Modernize Hospital Medical Records?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Access patient folders, record clinical vitals, order lab tests, schedule appointments, and manage pharmacy inventories with complete offline confidence.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onEnterApp}
              className="px-8 py-4 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-sm font-bold shadow-lg transition inline-flex items-center space-x-2 cursor-pointer"
            >
              <span>Launch MediFile NG Hospital Workstation</span>
              <ArrowRight className="w-4 h-4 text-teal-300" />
            </button>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">MediFile NG</span>
              <span className="text-[10px] text-slate-500">Dual Archiving EMR Platform</span>
            </div>
            <p className="text-slate-500 text-[11px] mt-1">
              Federal & State Hospital Medical Records Unit • General Outpatient & Inpatient Clinical Suite
            </p>
          </div>

          <div className="flex items-center space-x-6 text-slate-400 text-[11px]">
            <span>Dual-Archival Security</span>
            <span>Local SQLite & IndexedDB Persistence</span>
            <span>NAFDAC Drug Safety</span>
            <span>NHIA Validated</span>
          </div>

          <div>
            <button
              type="button"
              onClick={onEnterApp}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-700 text-xs font-semibold cursor-pointer"
            >
              Enter EMR
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
