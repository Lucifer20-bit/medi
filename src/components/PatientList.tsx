import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  Folder, 
  AlertTriangle, 
  HeartPulse, 
  FileText, 
  Printer, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { PatientRecord, StaffRole, Genotype, BloodGroup } from '../types';

interface PatientListProps {
  patients: PatientRecord[];
  selectedPatientId: string | null;
  onSelectPatient: (patient: PatientRecord) => void;
  onOpenNewPatient: () => void;
  onOpenDigitizer: () => void;
  onPrintCard: (patient: PatientRecord) => void;
  onLocateFolder: (patient: PatientRecord) => void;
  currentRole: StaffRole;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  onOpenNewPatient,
  onOpenDigitizer,
  onPrintCard,
  onLocateFolder,
  currentRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genotypeFilter, setGenotypeFilter] = useState<string>('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('ALL');
  const [archiveFilter, setArchiveFilter] = useState<string>('ALL');

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Search term matching
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.folderNumber.toLowerCase().includes(q) ||
        p.surname.toLowerCase().includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        (p.otherNames && p.otherNames.toLowerCase().includes(q)) ||
        p.phone.includes(q) ||
        (p.nin && p.nin.includes(q)) ||
        (p.nhiaNumber && p.nhiaNumber.toLowerCase().includes(q)) ||
        p.physicalArchive.cabinetRack.toLowerCase().includes(q) ||
        p.physicalArchive.boxNumber.toLowerCase().includes(q) ||
        p.stateOfOrigin.toLowerCase().includes(q);

      // Genotype filter
      const matchesGenotype = genotypeFilter === 'ALL' || p.genotype === genotypeFilter;

      // Blood group filter
      const matchesBloodGroup = bloodGroupFilter === 'ALL' || p.bloodGroup === bloodGroupFilter;

      // Archive filter
      const matchesArchive =
        archiveFilter === 'ALL' ||
        (archiveFilter === 'fragile' && p.physicalArchive.folderCondition !== 'Good') ||
        (archiveFilter === 'scanned' && p.paperScanImages && p.paperScanImages.length > 0);

      return matchesSearch && matchesGenotype && matchesBloodGroup && matchesArchive;
    });
  }, [patients, searchTerm, genotypeFilter, bloodGroupFilter, archiveFilter]);

  // Statistics
  const ssCount = patients.filter((p) => p.genotype === 'SS').length;
  const fragileCount = patients.filter((p) => p.physicalArchive.folderCondition !== 'Good').length;
  const scannedPaperCount = patients.filter((p) => p.paperScanImages.length > 0).length;

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      
      {/* Search Header Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Folder # (e.g. GH-0142), Patient Name, Phone, NIN, or Rack..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filter Row */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Genotype:
          </span>
          {['ALL', 'AA', 'AS', 'SS'].map((gt) => (
            <button
              key={gt}
              onClick={() => setGenotypeFilter(gt)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                genotypeFilter === gt
                  ? gt === 'SS'
                    ? 'bg-rose-600 text-white'
                    : 'bg-teal-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {gt === 'ALL' ? 'All' : `Hb ${gt}`}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Archive:
          </span>
          <button
            onClick={() => setArchiveFilter(archiveFilter === 'scanned' ? 'ALL' : 'scanned')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer flex items-center gap-1 ${
              archiveFilter === 'scanned'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Paper Digitized
          </button>

          <button
            onClick={() => setArchiveFilter(archiveFilter === 'fragile' ? 'ALL' : 'fragile')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
              archiveFilter === 'fragile'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Fragile / Torn Paper
          </button>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
          <span>
            Found <strong className="text-slate-800">{filteredPatients.length}</strong> folders
          </span>
          <div className="flex items-center gap-3">
            {ssCount > 0 && (
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-600" /> {ssCount} Sickle Cell (SS)
              </span>
            )}
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {scannedPaperCount} Scanned
            </span>
          </div>
        </div>
      </div>

      {/* Patient List Items Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Folder className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">No Patient Folders Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No hospital record matched &quot;{searchTerm}&quot;. You can register a new patient or scan their old physical card.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={onOpenDigitizer}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Scan Paper Folder
              </button>
              <button
                onClick={onOpenNewPatient}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                + Register New Patient
              </button>
            </div>
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const isSelected = patient.id === selectedPatientId;
            const isSS = patient.genotype === 'SS';
            const latestVitals = patient.vitalsHistory?.[0];
            const hasPaperScan = patient.paperScanImages?.length > 0;

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-3.5 sm:p-4 transition cursor-pointer relative ${
                  isSelected
                    ? 'bg-teal-50/70 border-l-4 border-teal-700'
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                {/* Header: Folder Number & Genotype / Blood Group Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs sm:text-sm px-2 py-0.5 rounded-md bg-slate-900 text-amber-300 tracking-wide">
                      {patient.folderNumber}
                    </span>

                    {/* Genotype Badge (Critical Nigerian Marker) */}
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isSS
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                          : patient.genotype === 'AS'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                      title={`Genotype: ${patient.genotype}`}
                    >
                      Hb {patient.genotype}
                    </span>

                    {/* Blood Group */}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {patient.bloodGroup}
                    </span>

                    {/* Paper Scan Indicator */}
                    {hasPaperScan && (
                      <span 
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                        title="Original paper card digitized and archived"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                        Scanned
                      </span>
                    )}
                  </div>

                  {/* Sync status */}
                  <div className="shrink-0 flex items-center gap-1 text-[11px] text-slate-400">
                    {patient.synced ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Synced with Cloud" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Pending Cloud Sync" />
                    )}
                  </div>
                </div>

                {/* Patient Name & Demographics */}
                <div className="mt-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                    {patient.surname}, {patient.firstName} {patient.otherNames || ''}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span>{patient.gender}</span>
                    <span>•</span>
                    <span>DOB: {patient.dateOfBirth}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {patient.phone}
                    </span>
                    <span>•</span>
                    <span>{patient.stateOfOrigin} State ({patient.lga})</span>
                  </div>
                </div>

                {/* Physical Archive Tag & Latest Clinical Alert */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      onLocateFolder(patient);
                    }}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-teal-700 font-medium truncate group cursor-pointer"
                    title="Click to view shelf map for this folder"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 group-hover:scale-110 transition" />
                    <span className="truncate text-[11px] sm:text-xs">
                      {patient.physicalArchive.cabinetRack} • {patient.physicalArchive.boxNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {latestVitals && (
                      <span 
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          latestVitals.triageCategory === 'Emergency (Red)'
                            ? 'bg-rose-100 text-rose-800'
                            : latestVitals.triageCategory === 'Priority (Yellow)'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        title="Latest recorded triage status"
                      >
                        <HeartPulse className="w-3 h-3" />
                        BP: {latestVitals.bpSystolic}/{latestVitals.bpDiastolic}
                      </span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintCard(patient);
                      }}
                      className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded transition cursor-pointer"
                      title="Print laminated Folder Barcode / ID Card"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>

                {/* Fragile Paper Warning if physical condition is poor */}
                {patient.physicalArchive.folderCondition !== 'Good' && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Physical Paper Alert: {patient.physicalArchive.folderCondition}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Showing <strong>{filteredPatients.length}</strong> of {patients.length} records
        </span>
        <button
          onClick={onOpenDigitizer}
          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> Digitize Paper Folder
        </button>
      </div>

    </div>
  );
};
