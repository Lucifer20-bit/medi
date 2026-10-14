import React, { useRef } from 'react';
import { Printer, X, ShieldAlert, Building2, QrCode } from 'lucide-react';
import { PatientRecord } from '../types';

interface PrintableFolderCardModalProps {
  patient: PatientRecord;
  onClose: () => void;
  hospitalName?: string;
}

export const PrintableFolderCardModal: React.FC<PrintableFolderCardModalProps> = ({
  patient,
  onClose,
  hospitalName = 'LAGOS ISLAND GENERAL HOSPITAL / FMC REGISTRY'
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isSS = patient.genotype === 'SS';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 print:shadow-none print:border-0 print:m-0 print:max-w-none">
        
        {/* Modal Top Controls (hidden on print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-teal-400" />
            <h3 className="font-bold text-sm">Printable Hospital Card & Physical Jacket Label</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Card / Label
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div ref={cardRef} className="p-6 bg-slate-100 flex flex-col items-center justify-center print:p-0 print:bg-white">
          
          {/* Card Frame (standard CR80 / folder label scale) */}
          <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl shadow-lg p-5 relative overflow-hidden print:shadow-none print:rounded-none print:border-2 print:border-black">
            
            {/* Top Federal / State Hospital Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5 text-teal-100" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm tracking-tight text-slate-900 uppercase">
                    {hospitalName}
                  </h4>
                  <p className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase">
                    Federal Ministry of Health & Social Welfare • Patient Card
                  </p>
                </div>
              </div>
            </div>

            {/* Folder Number Big Box & Barcode */}
            <div className="mt-3.5 bg-slate-900 text-amber-300 p-2.5 rounded-xl flex items-center justify-between print:bg-black print:text-white">
              <div>
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-300 block">
                  Official Folder No.
                </span>
                <span className="text-lg font-black font-mono tracking-wider">
                  {patient.folderNumber}
                </span>
              </div>

              {/* Barcode representation */}
              <div className="text-right">
                <div className="font-mono text-[9px] tracking-widest text-slate-300">BARCODE</div>
                <div className="h-6 w-24 flex items-end justify-between gap-[2px] bg-white p-0.5 rounded">
                  {[2,4,1,3,2,1,4,2,3,1,4,2,1,3,2,4,1,3].map((h, i) => (
                    <div
                      key={i}
                      className="bg-black w-[3px]"
                      style={{ height: `${h * 20}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Name & Bio-data */}
            <div className="mt-3.5 space-y-1.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient Full Name</span>
                <div className="text-base font-black text-slate-900 leading-tight">
                  {patient.surname}, {patient.firstName} {patient.otherNames || ''}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">DOB / Gender:</span>
                  <strong className="text-slate-800">{patient.dateOfBirth} ({patient.gender})</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Phone:</span>
                  <strong className="text-slate-800 font-mono text-[11px]">{patient.phone}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Origin / LGA:</span>
                  <strong className="text-slate-800 text-[11px]">{patient.stateOfOrigin} ({patient.lga})</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">NHIA Insurance:</span>
                  <strong className="text-slate-800 text-[11px]">{patient.nhiaNumber || 'Private'}</strong>
                </div>
              </div>
            </div>

            {/* Medical Vital Badges (Genotype & Blood Group) */}
            <div className="mt-3.5 p-2.5 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Genotype (Hb)</span>
                <span className={`text-sm font-black px-2 py-0.5 rounded-md inline-block uppercase mt-0.5 ${
                  isSS ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                  Hb {patient.genotype}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Blood Group</span>
                <span className="text-sm font-black px-2 py-0.5 rounded-md bg-slate-900 text-white inline-block mt-0.5">
                  {patient.bloodGroup}
                </span>
              </div>

              {/* Physical Archive Tag on Card */}
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Physical Rack</span>
                <span className="text-xs font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                  {patient.physicalArchive.cabinetRack.split(' - ')[0]} • {patient.physicalArchive.boxNumber}
                </span>
              </div>
            </div>

            {/* Sickle Cell Alert strip if SS */}
            {isSS && (
              <div className="mt-2 bg-rose-100 border border-rose-300 text-rose-900 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                <span>SICKLE CELL ALERT: Fast-track in triage during vaso-occlusive crisis.</span>
              </div>
            )}

            {/* Next of Kin Emergency Contact */}
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <span>Emergency NOK: <strong>{patient.nextOfKin.name}</strong></span>
              <span className="font-mono font-bold">{patient.nextOfKin.phone}</span>
            </div>

            {/* Bottom Disclaimer */}
            <div className="mt-2 pt-1 border-t border-slate-200 text-[9px] text-slate-400 flex items-center justify-between">
              <span>NaijaMed RecordVault • Laminated Hospital Card</span>
              <span>Valid nationwide at partner registries</span>
            </div>

          </div>

          <p className="text-xs text-slate-500 mt-4 text-center print:hidden">
            Tip: Print and laminate for the patient, or affix the adhesive copy directly to the physical cardboard folder jacket in the records room.
          </p>
        </div>

      </div>
    </div>
  );
};
