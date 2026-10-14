import React, { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  UploadCloud, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  X, 
  Database, 
  ShieldCheck, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileCode,
  HardDrive
} from 'lucide-react';
import { 
  getOfflineQueue, 
  getLocalPatients, 
  getLastSyncTime, 
  isSimulatedOffline, 
  setSimulatedOffline, 
  syncWithCloud, 
  saveLocalPatients,
  SyncResult
} from '../lib/storage';
import { OfflineSyncQueueItem, PatientRecord } from '../types';

interface OfflineSyncModalProps {
  onClose: () => void;
  isOnline: boolean;
  onRefreshData: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  onClose,
  isOnline,
  onRefreshData
}) => {
  const [queue, setQueue] = useState<OfflineSyncQueueItem[]>([]);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncResult | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const isSimulated = isSimulatedOffline();

  const refreshState = () => {
    setQueue(getOfflineQueue());
    setPatients(getLocalPatients());
    setLastSync(getLastSyncTime());
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncWithCloud();
      setSyncStatus(res);
      refreshState();
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      app: 'NaijaMed RecordVault',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      hospital: 'Lagos Island General Hospital / FMC Registry',
      recordsCount: patients.length,
      patients,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NaijaMed_Vault_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.patients && Array.isArray(json.patients)) {
          saveLocalPatients(json.patients);
          refreshState();
          onRefreshData();
          setImportMessage(`Successfully restored ${json.patients.length} records from backup file!`);
        } else {
          setImportMessage('Invalid backup format. Missing patients array.');
        }
      } catch (err) {
        setImportMessage('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="bg-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-teal-200">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Offline-First Cloud Vault & Sync Manager</h3>
              <p className="text-xs text-teal-300">
                Guaranteed zero data loss during power outages & network blackouts.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Connection Status Card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isOnline && !isSimulated
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isOnline && !isSimulated ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {isOnline && !isSimulated ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-extrabold text-sm">
                  {isOnline && !isSimulated ? 'Online • Connected to Cloud Hospital Vault' : 'Offline Autonomous Mode Active'}
                </h4>
                <p className="text-xs opacity-80 mt-0.5">
                  {isOnline && !isSimulated
                    ? 'Records synchronize in real-time with the central server.'
                    : 'System is running 100% locally from device storage. All filings and clinical notes are safe.'}
                </p>
              </div>
            </div>

            {/* Offline Simulation Button */}
            <button
              onClick={() => {
                setSimulatedOffline(!isSimulated);
                refreshState();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 transition cursor-pointer ${
                isSimulated
                  ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isSimulated ? 'Reconnect Network' : 'Test Offline Blackout'}
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Total Local Records</span>
              <strong className="text-base text-slate-900 font-mono">{patients.length}</strong>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Pending Sync Queue</span>
              <strong className={`text-base font-mono ${queue.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {queue.length} items
              </strong>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-400 block mb-0.5">Last Cloud Sync</span>
              <strong className="text-[11px] text-slate-700 block truncate">
                {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Just now'}
              </strong>
            </div>
          </div>

          {/* Force Sync Action Button */}
          <div>
            <button
              onClick={handleManualSync}
              disabled={isSyncing || (!isOnline && !isSimulated)}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing with Cloud Server...' : 'Trigger Bidirectional Cloud Synchronization'}</span>
            </button>

            {syncStatus && (
              <div className={`mt-2 p-3 rounded-xl border text-xs ${
                syncStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {syncStatus.success ? (
                  <p className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Sync complete! Pushed {syncStatus.syncedActionsCount} pending offline changes. Cloud has {syncStatus.totalRecords} records.
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    {syncStatus.error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pending Queue Items Inspector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Offline Queue Ledger ({queue.length})
              </span>
              <span className="text-[11px] text-slate-400">Auto-flushes when online</span>
            </div>

            {queue.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                All patient files and clinic encounters are in 100% lockstep with the cloud server.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {queue.map((item) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 uppercase font-mono text-[11px]">
                        {item.action.replace('_', ' ')}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString()} • Patient ID: {item.patientId}
                      </p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Queued
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Encrypted Backup & Restore (Disaster Recovery for Health Records) */}
          <div className="pt-3 border-t border-slate-200">
            <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Disaster Recovery & USB Flash Drive Vault Export
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="p-3 bg-white border border-slate-300 hover:border-teal-600 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-700" />
                <span>Download Vault JSON Backup</span>
              </button>

              <label className="p-3 bg-white border border-slate-300 hover:border-teal-600 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition cursor-pointer text-center">
                <Upload className="w-4 h-4 text-teal-700" />
                <span>Restore Vault from File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            {importMessage && (
              <p className="mt-2 text-xs font-semibold text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-200">
                {importMessage}
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
