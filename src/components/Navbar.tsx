import React, { useState } from 'react';
import { 
  Building2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  FilePlus, 
  ScanLine, 
  Layers, 
  ShieldCheck, 
  UserCheck, 
  DownloadCloud,
  ChevronDown,
  Mic,
  Package,
  Globe,
  Calendar,
  FlaskConical,
  Compass
} from 'lucide-react';
import { StaffRole } from '../types';
import { isSimulatedOffline, setSimulatedOffline, syncWithCloud } from '../lib/storage';

interface NavbarProps {
  currentRole: StaffRole;
  onRoleChange: (role: StaffRole) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  lowStockCount?: number;
  onOpenDigitizer: () => void;
  onOpenNewPatient: () => void;
  onOpenArchiveMap: () => void;
  onOpenSyncPanel: () => void;
  onOpenPharmacy?: () => void;
  onOpenMedicalSearch?: () => void;
  onOpenAudioTranscriber?: () => void;
  onOpenLandingPage?: () => void;
  onOpenAppointments?: () => void;
  onOpenLabs?: () => void;
  hospitalName?: string;
}

const ROLES: { id: StaffRole; label: string; badge: string; desc: string }[] = [
  { id: 'records_clerk', label: 'Records Officer', badge: 'Records & Archive', desc: 'Folder intake, paper scanning, shelf filing' },
  { id: 'triage_nurse', label: 'Triage Nurse', badge: 'Vitals & Triage', desc: 'Blood pressure, emergency triage, queue' },
  { id: 'medical_officer', label: 'Medical Doctor', badge: 'Consultation & SOAP', desc: 'Case notes, diagnoses, prescriptions' },
  { id: 'pharmacist', label: 'Pharmacist', badge: 'Dispensary', desc: 'Medication fulfillment & drug stocks' },
  { id: 'records_admin', label: 'Records Admin', badge: 'Full Hospital Vault', desc: 'Audit trail, cloud backups, system sync' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  isOnline,
  pendingSyncCount,
  lowStockCount,
  onOpenDigitizer,
  onOpenNewPatient,
  onOpenArchiveMap,
  onOpenSyncPanel,
  onOpenPharmacy,
  onOpenMedicalSearch,
  onOpenAudioTranscriber,
  onOpenLandingPage,
  onOpenAppointments,
  onOpenLabs,
  hospitalName = 'Lagos Island General Hospital / FMC Registry'
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const isSimulated = isSimulatedOffline();

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithCloud();
    setTimeout(() => setIsSyncing(false), 500);
  };

  const handleToggleOfflineSimulation = () => {
    setSimulatedOffline(!isSimulated);
  };

  const activeRoleObj = ROLES.find((r) => r.id === currentRole) || ROLES[0];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top emergency / offline alert banner if offline */}
      {(!isOnline || isSimulated) && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span>
              OFFLINE AUTONOMOUS MODE ACTIVE: Full record lookup & new patient filing working locally.
              {pendingSyncCount > 0 ? ` (${pendingSyncCount} changes queued for cloud mirror)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isSimulated && (
              <span className="bg-amber-700/60 text-amber-100 px-2 py-0.5 rounded-sm text-[11px]">
                Simulated Outage Mode
              </span>
            )}
            <button
              onClick={handleToggleOfflineSimulation}
              className="underline text-amber-100 hover:text-white cursor-pointer"
            >
              {isSimulated ? 'Reconnect Network' : 'Test Online Mode'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Hospital branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-xs relative overflow-hidden">
              <Building2 className="w-5 h-5 text-teal-100" />
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/80"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  NaijaMed RecordVault
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Paper-to-Cloud Bridge
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {hospitalName}
              </p>
            </div>
          </div>

          {/* Center Navigation Actions */}
          <div className="hidden lg:flex items-center gap-1.5">
            {onOpenAppointments && (
              <button
                onClick={onOpenAppointments}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Book patient appointments and view today's clinic schedule"
              >
                <Calendar className="w-3.5 h-3.5 text-teal-700" />
                <span>Appointments</span>
              </button>
            )}

            {onOpenLabs && (
              <button
                onClick={onOpenLabs}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="View and enter laboratory test results, urinalysis and radiology scans"
              >
                <FlaskConical className="w-3.5 h-3.5 text-rose-700" />
                <span>Lab & Radiology</span>
              </button>
            )}

            {onOpenPharmacy && (
              <button
                onClick={onOpenPharmacy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition relative cursor-pointer"
                title="Hospital Pharmacy Inventory, Stock Levels & Auto-Dispense"
              >
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pharmacy</span>
                {lowStockCount !== undefined && lowStockCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onOpenArchiveMap}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="View physical paper record room and shelf locator"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Shelf Map</span>
            </button>

            <button
              onClick={onOpenSyncPanel}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Cloud Synchronization & Encrypted Backups"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>Sync Vault</span>
              {pendingSyncCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {onOpenLandingPage && (
              <button
                onClick={onOpenLandingPage}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
                title="View MediFile NG Overview & Architecture Landing Page"
              >
                <Compass className="w-3.5 h-3.5 text-teal-700" />
                <span>Overview</span>
              </button>
            )}
          </div>

          {/* Right Controls: Role Switcher & Primary Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Offline Simulator Switcher (for demonstration & testing) */}
            <button
              onClick={handleToggleOfflineSimulation}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                isOnline && !isSimulated
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
                  : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
              title={isOnline ? 'Simulate NEPA / Internet blackout' : 'Restore online connection'}
            >
              {isOnline && !isSimulated ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline text-xs font-semibold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline text-xs font-semibold">Offline</span>
                </>
              )}
            </button>

            {/* Sync Icon Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing || (!isOnline && !isSimulated)}
              className="p-2 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition relative disabled:opacity-40"
              title="Sync local records with hospital cloud server"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
              {pendingSyncCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">
                  {pendingSyncCount}
                </span>
              )}
            </button>

            {/* Role Switcher dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                <span className="hidden sm:inline font-semibold">{activeRoleObj.label}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hospital Duty Role</p>
                    <p className="text-xs text-slate-500">Tailors workflow view to your post</p>
                  </div>
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        onRoleChange(r.id);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-50 transition ${
                        currentRole === r.id ? 'bg-teal-50/60 font-semibold text-teal-900 border-l-2 border-teal-600' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{r.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">{r.badge}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audio Dictation & Transcription with gemini-3.5-transcribe */}
            {onOpenAudioTranscriber && (
              <button
                onClick={onOpenAudioTranscriber}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Voice Dictation & Audio Transcription (gemini-3.5-transcribe)"
              >
                <Mic className="w-4 h-4 text-sky-200" />
                <span className="hidden md:inline">Audio Transcribe</span>
              </button>
            )}

            {/* Smart Paper Folder Scanner / AI Digitizer button */}
            <button
              onClick={onOpenDigitizer}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Scan old paper folder, doctor note or face-sheet"
            >
              <ScanLine className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Digitize Paper Folder</span>
              <span className="sm:hidden">Scan</span>
            </button>

            {/* New Patient Registration Button */}
            <button
              onClick={onOpenNewPatient}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <FilePlus className="w-4 h-4 text-teal-100" />
              <span className="hidden sm:inline">New File</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
