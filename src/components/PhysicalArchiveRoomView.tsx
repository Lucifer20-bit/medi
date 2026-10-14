import React, { useState } from 'react';
import { Layers, X, MapPin, Search, Folder, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PatientRecord } from '../types';
import { ARCHIVE_RACKS } from '../lib/nigerianData';

interface PhysicalArchiveRoomViewProps {
  patients: PatientRecord[];
  onClose: () => void;
  onSelectPatient: (patient: PatientRecord) => void;
  highlightFolderNumber?: string;
}

export const PhysicalArchiveRoomView: React.FC<PhysicalArchiveRoomViewProps> = ({
  patients,
  onClose,
  onSelectPatient,
  highlightFolderNumber
}) => {
  const [selectedRackId, setSelectedRackId] = useState<string>(
    highlightFolderNumber
      ? patients.find((p) => p.folderNumber === highlightFolderNumber)?.physicalArchive.cabinetRack || ARCHIVE_RACKS[0].name
      : ARCHIVE_RACKS[0].name
  );
  const [searchTerm, setSearchTerm] = useState(highlightFolderNumber || '');

  // Group patients by their cabinet rack
  const rackCounts: Record<string, number> = {};
  ARCHIVE_RACKS.forEach((r) => {
    rackCounts[r.name] = patients.filter((p) => p.physicalArchive.cabinetRack.includes(r.id)).length;
  });

  // Filter patients on selected rack
  const patientsInRack = patients.filter((p) => {
    const rackMatch = p.physicalArchive.cabinetRack === selectedRackId || p.physicalArchive.cabinetRack.includes(selectedRackId.split(' - ')[0]);
    if (!searchTerm) return rackMatch;
    const q = searchTerm.toLowerCase();
    return (
      p.folderNumber.toLowerCase().includes(q) ||
      p.surname.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.physicalArchive.boxNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Physical Paper Records Room 2D Floor Plan</h3>
              <p className="text-xs text-slate-400">
                Central Medical Records Archive • Lagos Island / FMC Registry
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Info Banner */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-xs text-teal-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                Select any filing rack to view which physical paper folders are shelved there, or search by folder number to trace shelf walkway.
              </span>
            </div>
            <div className="shrink-0 font-bold text-teal-950">
              Total Archived Folders: {patients.length}
            </div>
          </div>

          {/* 2D Interactive Floor Layout */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Filing Room Racks Floor Plan
              </span>
              <span className="text-[11px] text-slate-400">Walkway / Aisle between Racks</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {ARCHIVE_RACKS.map((rack) => {
                const isSelected = selectedRackId === rack.name || selectedRackId.includes(rack.id);
                const count = rackCounts[rack.name] || 0;

                return (
                  <button
                    key={rack.id}
                    onClick={() => setSelectedRackId(rack.name)}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-400'
                        : 'bg-white text-slate-800 border-slate-300 hover:border-teal-500 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black font-mono ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                        {rack.id}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count} files
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] font-medium leading-snug line-clamp-2">
                      {rack.name.split(' - ')[1] || rack.name}
                    </div>

                    {/* Shelf tier graphic */}
                    <div className="mt-3 flex flex-col gap-0.5 opacity-60">
                      <div className={`h-1 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-200'}`} />
                      <div className={`h-1 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-200'}`} />
                      <div className={`h-1 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-200'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shelf Details & Folders List */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-teal-700" />
                  <span>{selectedRackId}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {patientsInRack.length} physical paper folders filed here
                </p>
              </div>

              {/* Quick Filter Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by Folder # or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* List of files on this rack */}
            <div className="mt-4 divide-y divide-slate-200/80 max-h-72 overflow-y-auto">
              {patientsInRack.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No folders match the search or are filed under this rack yet.
                </div>
              ) : (
                patientsInRack.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p);
                      onClose();
                    }}
                    className="py-3 px-2 flex items-center justify-between hover:bg-white rounded-lg transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                        {p.folderNumber}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-slate-900 group-hover:text-teal-700">
                          {p.surname}, {p.firstName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{p.physicalArchive.shelfLevel}</span>
                          <span>•</span>
                          <strong className="text-slate-700">{p.physicalArchive.boxNumber}</strong>
                          <span>•</span>
                          <span className="text-[10px] font-bold px-1 rounded bg-slate-100">
                            Hb {p.genotype}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {p.physicalArchive.folderCondition !== 'Good' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚠️ {p.physicalArchive.folderCondition}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-teal-700 group-hover:underline flex items-center gap-0.5">
                        Open File <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
