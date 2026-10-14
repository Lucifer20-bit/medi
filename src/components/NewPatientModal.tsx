import React, { useState } from 'react';
import { UserPlus, X, MapPin, CheckCircle2 } from 'lucide-react';
import { PatientRecord, BloodGroup, Genotype } from '../types';
import { NIGERIAN_STATES, NIGERIAN_STATES_AND_LGAS, ARCHIVE_RACKS } from '../lib/nigerianData';

interface NewPatientModalProps {
  onClose: () => void;
  onSubmit: (patient: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'synced' | 'syncVersion'>) => Promise<PatientRecord>;
  onSelectCreatedPatient?: (patient: PatientRecord) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  onClose,
  onSubmit,
  onSelectCreatedPatient
}) => {
  const currentYear = new Date().getFullYear();
  const [folderNumber, setFolderNumber] = useState(`GH-REC/${currentYear}/0${Math.floor(100 + Math.random() * 900)}`);
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('1995-06-15');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [genotype, setGenotype] = useState<Genotype>('AA');
  const [phone, setPhone] = useState('+234 ');
  const [nin, setNin] = useState('');
  const [nhiaNumber, setNhiaNumber] = useState('');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [stateOfOrigin, setStateOfOrigin] = useState('Lagos');
  const [lga, setLga] = useState('Ikeja');
  
  // Next of Kin
  const [nokName, setNokName] = useState('');
  const [nokRel, setNokRel] = useState('Spouse');
  const [nokPhone, setNokPhone] = useState('');

  // Physical shelf allocation
  const [cabinetRack, setCabinetRack] = useState(ARCHIVE_RACKS[1].name);
  const [shelfLevel, setShelfLevel] = useState('Shelf 2 (Waist-level)');
  const [boxNumber, setBoxNumber] = useState('Box #12');
  const [folderCondition, setFolderCondition] = useState<PatientRecord['physicalArchive']['folderCondition']>('Good');

  // Clinical alerts
  const [allergiesText, setAllergiesText] = useState('');
  const [chronicText, setChronicText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surname.trim() || !firstName.trim()) {
      alert('Please enter patient surname and first name');
      return;
    }

    setIsSubmitting(true);
    try {
      const allergies = allergiesText
        ? allergiesText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const chronicConditions = chronicText
        ? chronicText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const newRecord: Omit<PatientRecord, 'id' | 'createdAt' | 'updatedAt' | 'synced' | 'syncVersion'> = {
        folderNumber: folderNumber.trim(),
        surname: surname.toUpperCase().trim(),
        firstName: firstName.trim(),
        otherNames: otherNames.trim() || undefined,
        gender,
        dateOfBirth,
        bloodGroup,
        genotype,
        phone: phone.trim(),
        nin: nin.trim() || undefined,
        nhiaNumber: nhiaNumber.trim() || undefined,
        occupation: occupation.trim() || undefined,
        residentialAddress: address.trim() || 'Nigeria',
        stateOfOrigin,
        lga,
        nextOfKin: {
          name: nokName.trim() || 'Not specified',
          relationship: nokRel,
          phone: nokPhone.trim() || phone.trim(),
          address: address.trim(),
        },
        allergies,
        chronicConditions,
        physicalArchive: {
          recordRoom: 'Central Card Room Archive',
          cabinetRack,
          shelfLevel,
          boxNumber,
          folderCondition,
          originalPaperCreatedAt: new Date().toISOString().split('T')[0],
        },
        paperScanImages: [],
        vitalsHistory: [],
        encounters: [],
      };

      const saved = await onSubmit(newRecord);
      if (onSelectCreatedPatient) {
        onSelectCreatedPatient(saved);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving new patient record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">New Patient Registration File</h3>
              <p className="text-xs text-teal-200">
                Allocate official hospital folder number and physical archive shelf.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-teal-200 hover:text-white hover:bg-teal-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Folder Number, Genotype & Blood Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Folder Number *
              </label>
              <input
                type="text"
                required
                value={folderNumber}
                onChange={(e) => setFolderNumber(e.target.value)}
                className="w-full px-3 py-2 font-mono font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Genotype *
              </label>
              <select
                value={genotype}
                onChange={(e) => setGenotype(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs font-bold border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                  genotype === 'SS' ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-300'
                }`}
              >
                {['AA', 'AS', 'SS', 'AC', 'SC', 'Unknown'].map((gt) => (
                  <option key={gt} value={gt}>Hb {gt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Blood Group *
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Surname (Uppercase) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. OKONKWO"
                value={surname}
                onChange={(e) => setSurname(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 font-bold text-xs border border-slate-300 rounded-lg uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Amaka"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Other Names
              </label>
              <input
                type="text"
                placeholder="e.g. Grace"
                value={otherNames}
                onChange={(e) => setOtherNames(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Gender, DOB & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+234 803 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* NIN & NHIA / HMO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                National ID Number (NIN)
              </label>
              <input
                type="text"
                placeholder="11 digits (e.g. 58392019482)"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NHIA / HMO Insurance Number
              </label>
              <input
                type="text"
                placeholder="e.g. NHIA/LAG/09124 (Optional)"
                value={nhiaNumber}
                onChange={(e) => setNhiaNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* State of Origin & LGA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                State of Origin
              </label>
              <select
                value={stateOfOrigin}
                onChange={(e) => {
                  const st = e.target.value;
                  setStateOfOrigin(st);
                  const lgas = NIGERIAN_STATES_AND_LGAS[st] || [];
                  setLga(lgas[0] || '');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                LGA
              </label>
              <select
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                {(NIGERIAN_STATES_AND_LGAS[stateOfOrigin] || []).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              placeholder="e.g. Flat 3, Block B, Marine Road, Apapa, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Next of Kin */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="block text-xs font-bold text-slate-800 mb-2">Emergency Next of Kin</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={nokName}
                  onChange={(e) => setNokName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <select
                  value={nokRel}
                  onChange={(e) => setNokRel(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Relative">Relative</option>
                </select>
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={nokPhone}
                  onChange={(e) => setNokPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Physical Filing Shelf Allocation */}
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
            <label className="block text-xs font-bold text-teal-900 mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-700" />
              Allocate Physical Shelf in Hospital Records Room
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Archive Rack</label>
                <select
                  value={cabinetRack}
                  onChange={(e) => setCabinetRack(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs"
                >
                  {ARCHIVE_RACKS.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Shelf Box</label>
                <input
                  type="text"
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Paper Condition</label>
                <select
                  value={folderCondition}
                  onChange={(e) => setFolderCondition(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs"
                >
                  <option value="Good">Good (New Card)</option>
                  <option value="Fragile / Torn">Fragile</option>
                </select>
              </div>
            </div>
          </div>

          {/* Allergies & Chronic Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Known Drug Allergies
              </label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Septrin"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chronic Medical Conditions
              </label>
              <input
                type="text"
                placeholder="e.g. Hypertension, Diabetes, PUD"
                value={chronicText}
                onChange={(e) => setChronicText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Registering File...' : 'Create Hospital File & Assign Shelf'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
