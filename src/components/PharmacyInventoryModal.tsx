import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  X, 
  Pill, 
  Building2, 
  RefreshCw, 
  FileCheck2, 
  FileText, 
  SlidersHorizontal,
  Layers,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PharmacyInventoryItem, PharmacyStockMovement, DigitalPrescription, PatientRecord } from '../types';
import { 
  fetchPharmacyInventory, 
  addPharmacyInventoryItem, 
  getLocalPharmacyInventory, 
  saveLocalPharmacyInventory, 
  dispensePrescriptionWithInventory,
  getLocalPatients 
} from '../lib/storage';

interface PharmacyInventoryModalProps {
  onClose: () => void;
  onOpenPatient?: (patientId: string) => void;
}

export const PharmacyInventoryModal: React.FC<PharmacyInventoryModalProps> = ({
  onClose,
  onOpenPatient,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions' | 'stockin' | 'movements'>('inventory');
  const [items, setItems] = useState<PharmacyInventoryItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<PharmacyInventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [movements, setMovements] = useState<PharmacyStockMovement[]>([]);

  // Patients & Pending Prescriptions
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState<string | null>(null);
  const [dispenseWarnings, setDispenseWarnings] = useState<string[]>([]);

  // Reorder Point Quick Edit modal/inline state
  const [editingReorderItemId, setEditingReorderItemId] = useState<string | null>(null);
  const [newReorderValue, setNewReorderValue] = useState<number>(20);

  // Incoming Medication Form State
  const [newDrugName, setNewDrugName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newCategory, setNewCategory] = useState('Antimalarial');
  const [newForm, setNewForm] = useState('Tablets');
  const [newStrength, setNewStrength] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(100);
  const [newReorderLevel, setNewReorderLevel] = useState<number>(25);
  const [newUnit, setNewUnit] = useState('packs');
  const [newUnitCostNgn, setNewUnitCostNgn] = useState<number>(1200);
  const [newExpiryDate, setNewExpiryDate] = useState('2027-12-31');
  const [newSupplier, setNewSupplier] = useState('Chi Pharmaceuticals / NHIA Depot');
  const [newShelfLocation, setNewShelfLocation] = useState('Aisle 2 - Shelf B');
  const [isSubmittingStockIn, setIsSubmittingStockIn] = useState(false);

  // Load Inventory & Patients
  const loadData = async () => {
    setIsLoading(true);
    try {
      const invData = await fetchPharmacyInventory();
      setItems(invData.items);
      setLowStockAlerts(invData.lowStockAlerts || []);

      const pList = getLocalPatients();
      setPatients(pList);

      // Load movements if available
      try {
        const res = await fetch('/api/pharmacy/movements');
        if (res.ok) {
          const mData = await res.json();
          if (mData.success && Array.isArray(mData.movements)) {
            setMovements(mData.movements);
          }
        }
      } catch (e) {
        // local movements fallback
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Collect all digital prescriptions across all patients
  const allPrescriptions: Array<{
    patient: PatientRecord;
    prescription: DigitalPrescription;
  }> = [];

  patients.forEach((p) => {
    if (p.digitalPrescriptions && p.digitalPrescriptions.length > 0) {
      p.digitalPrescriptions.forEach((rx) => {
        allPrescriptions.push({ patient: p, prescription: rx });
      });
    }
    // Also include encounters that have prescriptions
    if (p.encounters) {
      p.encounters.forEach((enc) => {
        if (enc.prescriptions && enc.prescriptions.length > 0) {
          // If not already in digitalPrescriptions, wrap for pharmacy view
          const exists = p.digitalPrescriptions?.some((dp) => dp.id === enc.id);
          if (!exists) {
            allPrescriptions.push({
              patient: p,
              prescription: {
                id: enc.id,
                prescriptionNumber: `RX-ENC-${enc.id.substring(4, 9)}`,
                patientId: p.id,
                patientName: `${p.surname}, ${p.firstName}`,
                patientFolderNumber: p.folderNumber,
                createdAt: enc.date,
                diagnosis: enc.clinicalImpression || 'General Consultation',
                treatmentPlan: enc.treatmentPlan || 'Outpatient Therapy',
                medications: enc.prescriptions.map((ep) => ({
                  id: ep.id,
                  name: ep.medication,
                  dosage: ep.dosage,
                  frequency: ep.frequency,
                  duration: ep.duration,
                  quantity: 1,
                  route: 'Oral',
                  instructions: ep.instructions || '',
                  dispensed: ep.dispensed,
                })),
                doctorName: enc.doctorName,
                doctorMdcnNumber: enc.doctorMdcn || 'MDCN-LGH-REG',
                hospitalName: 'Lagos Island General Hospital / FMC Registry',
                status: enc.prescriptions.every((x) => x.dispensed) ? 'Dispensed' : 'Pending',
              },
            });
          }
        }
      });
    }
  });

  // Sort prescriptions by date descending
  allPrescriptions.sort(
    (a, b) => new Date(b.prescription.createdAt).getTime() - new Date(a.prescription.createdAt).getTime()
  );

  // Dispense a prescription and deduct inventory
  const handleDispense = async (patientId: string, rx: DigitalPrescription) => {
    const dispenseItems = rx.medications.map((m) => ({
      inventoryItemId: m.inventoryItemId,
      drugName: m.name,
      quantity: m.quantity || 1,
    }));

    try {
      const result = await dispensePrescriptionWithInventory(
        patientId,
        rx.id,
        dispenseItems,
        'Pharm. Ngozi Adeleke, B.Pharm'
      );

      setDispenseSuccessMessage(result.message);
      if (result.lowStockWarnings && result.lowStockWarnings.length > 0) {
        setDispenseWarnings(result.lowStockWarnings);
      } else {
        setDispenseWarnings([]);
      }

      await loadData();
    } catch (err: any) {
      alert('Dispense error: ' + err.message);
    }
  };

  // Submit Incoming Medication (Stock-In)
  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugName.trim() || !newBatchNumber.trim()) {
      alert('Drug name and batch number are required.');
      return;
    }

    setIsSubmittingStockIn(true);
    try {
      await addPharmacyInventoryItem({
        drugName: newDrugName.trim(),
        brandName: newBrandName.trim(),
        category: newCategory,
        form: newForm,
        strength: newStrength.trim(),
        batchNumber: newBatchNumber.trim().toUpperCase(),
        quantityInStock: Number(newQuantity) || 1,
        reorderLevel: Number(newReorderLevel) || 20,
        unit: newUnit,
        unitPriceNgn: Number(newUnitCostNgn) || 0,
        expiryDate: newExpiryDate,
        supplier: newSupplier.trim(),
        shelfLocation: newShelfLocation.trim(),
      });

      alert(`Successfully recorded stock-in for ${newDrugName} (${newQuantity} ${newUnit})!`);
      // Reset form
      setNewDrugName('');
      setNewBrandName('');
      setNewBatchNumber('');
      setNewStrength('');
      setActiveTab('inventory');
      await loadData();
    } catch (err: any) {
      alert('Stock-in failed: ' + err.message);
    } finally {
      setIsSubmittingStockIn(false);
    }
  };

  // Quick Save Reorder Point
  const handleSaveReorderPoint = (itemId: string) => {
    const local = getLocalPharmacyInventory();
    const item = local.find((i) => i.id === itemId);
    if (item) {
      item.reorderLevel = Number(newReorderValue);
      saveLocalPharmacyInventory(local);
      setEditingReorderItemId(null);
      loadData();
    }
  };

  // Quick Restock +50
  const handleQuickRestock = async (item: PharmacyInventoryItem) => {
    const addQty = 50;
    const local = getLocalPharmacyInventory();
    const target = local.find((i) => i.id === item.id);
    if (target) {
      target.quantityInStock += addQty;
      target.lastRestockedAt = new Date().toISOString();
      saveLocalPharmacyInventory(local);
      loadData();
      alert(`Restocked +${addQty} ${target.unit} of ${target.drugName}!`);
    }
  };

  // Filter items
  const categories = ['All', 'Antimalarial', 'Antibiotic', 'Antihypertensive', 'Analgesic', 'Antidiabetic', 'Infusion IV', 'Respiratory', 'Ophthalmic', 'Vitamins & Supplements'];
  const filteredItems = items.filter((item) => {
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchQuery =
      !q ||
      item.drugName.toLowerCase().includes(q) ||
      (item.brandName && item.brandName.toLowerCase().includes(q)) ||
      item.batchNumber.toLowerCase().includes(q) ||
      item.shelfLocation.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-3 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Pharmacy Inventory & Dispensary Management</h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-800">
                  Live Stock Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Lagos Island General Hospital • Electronic Pharmacy Formulary & Auto-Dispense
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Refresh inventory"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Low Stock Alerts Banner (always visible if there are low stock items) */}
        {lowStockAlerts.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-300/40 px-5 py-2.5 flex items-center justify-between shrink-0 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">
                  {lowStockAlerts.length} Medication{lowStockAlerts.length > 1 ? 's' : ''} Below Reorder Threshold:
                </span>{' '}
                <span className="text-amber-800">
                  {lowStockAlerts.map((l) => `${l.drugName} (${l.quantityInStock} ${l.unit})`).slice(0, 3).join(', ')}
                  {lowStockAlerts.length > 3 ? ` and ${lowStockAlerts.length - 3} more...` : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setActiveTab('inventory');
              }}
              className="text-[11px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-md transition cursor-pointer shrink-0"
            >
              View Low Stock
            </button>
          </div>
        )}

        {/* Notification Toast for Dispense */}
        {dispenseSuccessMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 flex items-center justify-between text-emerald-800 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">{dispenseSuccessMessage}</span>
            </div>
            <button
              onClick={() => setDispenseSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {dispenseWarnings.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex flex-col gap-1 text-red-800 text-xs shrink-0">
            {dispenseWarnings.map((w, idx) => (
              <div key={idx} className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Formulary & Stock Levels</span>
            <span className="ml-1 bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Pending Prescriptions & Dispense</span>
            {allPrescriptions.filter((p) => p.prescription.status !== 'Dispensed').length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {allPrescriptions.filter((p) => p.prescription.status !== 'Dispensed').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('stockin')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'stockin'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Record Incoming Stock (Stock-In)</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'movements'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Stock Movements & Audit Log</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-5 overflow-y-auto flex-1">
          
          {/* TAB 1: FORMULARY & STOCK LEVELS */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              
              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search drug, brand, batch..."
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex gap-1">
                    {categories.slice(0, 5).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-emerald-700 text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table of Inventory */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Medication & Strength</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5">Batch / Expiry</th>
                        <th className="px-3 py-2.5 text-center">Stock Level</th>
                        <th className="px-3 py-2.5 text-center">Reorder Point</th>
                        <th className="px-3 py-2.5">Location</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredItems.map((item) => {
                        const isCritical = item.quantityInStock <= Math.ceil(item.reorderLevel * 0.4);
                        const isLow = item.quantityInStock <= item.reorderLevel;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            {/* Medication */}
                            <td className="px-3 py-3">
                              <div className="font-bold text-slate-900">{item.drugName}</div>
                              <div className="text-[11px] text-slate-500">
                                {item.strength} • {item.form} {item.brandName ? `(${item.brandName})` : ''}
                              </div>
                            </td>

                            {/* Category */}
                            <td className="px-3 py-3">
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                {item.category}
                              </span>
                            </td>

                            {/* Batch & Expiry */}
                            <td className="px-3 py-3">
                              <div className="font-mono font-bold text-slate-700">{item.batchNumber}</div>
                              <div className="text-[10px] text-slate-500">Exp: {item.expiryDate}</div>
                            </td>

                            {/* Stock Level with Color-coded Badge */}
                            <td className="px-3 py-3 text-center">
                              <div className="inline-flex items-center gap-1.5">
                                <span
                                  className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${
                                    isCritical
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : isLow
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {item.quantityInStock} {item.unit}
                                </span>
                              </div>
                              {isCritical && (
                                <div className="text-[9px] font-bold text-red-600 mt-0.5">CRITICAL LOW</div>
                              )}
                              {!isCritical && isLow && (
                                <div className="text-[9px] font-bold text-amber-700 mt-0.5">REORDER SOON</div>
                              )}
                            </td>

                            {/* Reorder Point (Editable inline) */}
                            <td className="px-3 py-3 text-center">
                              {editingReorderItemId === item.id ? (
                                <div className="inline-flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    value={newReorderValue}
                                    onChange={(e) => setNewReorderValue(Number(e.target.value))}
                                    className="w-14 text-center font-bold text-xs py-0.5 border border-slate-300 rounded"
                                  />
                                  <button
                                    onClick={() => handleSaveReorderPoint(item.id)}
                                    className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingReorderItemId(item.id);
                                    setNewReorderValue(item.reorderLevel);
                                  }}
                                  className="text-xs font-mono font-bold text-slate-600 hover:text-emerald-700 hover:underline cursor-pointer"
                                  title="Click to change reorder point"
                                >
                                  ≤ {item.reorderLevel} {item.unit}
                                </button>
                              )}
                            </td>

                            {/* Shelf Location */}
                            <td className="px-3 py-3 text-[11px] text-slate-600 font-medium">
                              {item.shelfLocation}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3 text-right">
                              <button
                                onClick={() => handleQuickRestock(item)}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                + Restock 50
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PENDING PRESCRIPTIONS & DISPENSARY QUEUE */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">
                    Hospital Dispensary Queue (Linked to Patient Clinical Records)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    When medications are dispensed, stock levels are automatically deducted from the warehouse inventory and low-stock alerts are recalculated in real time.
                  </p>
                </div>
                <div className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-lg">
                  {allPrescriptions.length} Total Orders
                </div>
              </div>

              {allPrescriptions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No active prescriptions queued yet. Generate a digital prescription from a patient folder to see it here.
                </div>
              ) : (
                <div className="space-y-3">
                  {allPrescriptions.map(({ patient, prescription }) => {
                    const isDispensed = prescription.status === 'Dispensed';

                    return (
                      <div
                        key={prescription.id}
                        className={`p-4 rounded-xl border transition ${
                          isDispensed
                            ? 'bg-slate-50 border-slate-200 opacity-80'
                            : 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-500/10'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-slate-900">
                                {prescription.prescriptionNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDispensed
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {prescription.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              Patient: <span className="font-bold text-slate-900">{patient.surname}, {patient.firstName}</span> • Folder: <span className="font-mono font-bold text-emerald-800">{patient.folderNumber}</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-2">
                            <div className="text-[11px] text-slate-500">
                              Dr. {prescription.doctorName || 'Medical Officer'}
                            </div>
                            {onOpenPatient && (
                              <button
                                onClick={() => onOpenPatient(patient.id)}
                                className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                              >
                                Open Folder →
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Clinical Context */}
                        <div className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg">
                          <span className="font-bold text-slate-800">Diagnosis:</span> {prescription.diagnosis || 'General Outpatient'}{' '}
                          {prescription.treatmentPlan && (
                            <span>• <span className="font-bold text-slate-800">Plan:</span> {prescription.treatmentPlan}</span>
                          )}
                        </div>

                        {/* Medication Items List */}
                        <div className="space-y-1.5 mb-3">
                          {prescription.medications.map((med, mIdx) => {
                            // Match against current inventory
                            const invMatch = items.find(
                              (i) =>
                                i.id === med.inventoryItemId ||
                                i.drugName.toLowerCase().includes(med.name.toLowerCase()) ||
                                med.name.toLowerCase().includes(i.drugName.toLowerCase())
                            );

                            const hasSufficientStock = invMatch ? invMatch.quantityInStock >= (med.quantity || 1) : false;

                            return (
                              <div
                                key={med.id || mIdx}
                                className="flex items-center justify-between p-2 bg-slate-50/70 rounded-lg text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <Pill className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                  <div>
                                    <span className="font-bold text-slate-900">{med.name}</span>{' '}
                                    <span className="text-slate-500 font-medium">
                                      ({med.dosage || 'Standard'} • {med.frequency || 'TDS'} • {med.duration || '5 days'})
                                    </span>
                                    {med.instructions && (
                                      <div className="text-[10px] text-slate-500 italic">
                                        Sig: {med.instructions}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-slate-900">
                                      Qty: {med.quantity || 1}
                                    </span>
                                    {invMatch && (
                                      <div className={`text-[10px] font-bold ${hasSufficientStock ? 'text-emerald-700' : 'text-red-600'}`}>
                                        Stock: {invMatch.quantityInStock} {invMatch.unit}
                                      </div>
                                    )}
                                  </div>

                                  {med.dispensed && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                                      Dispensed
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Dispense Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="text-[11px] text-slate-400">
                            Ordered: {new Date(prescription.createdAt).toLocaleString('en-GB')}
                          </div>

                          {!isDispensed ? (
                            <button
                              onClick={() => handleDispense(patient.id, prescription)}
                              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Dispense & Deduct Stock</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Fulfilled by Pharmacy</span>
                              {prescription.dispensedBy && (
                                <span className="text-[10px] text-slate-500">({prescription.dispensedBy})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: RECORD INCOMING STOCK (STOCK-IN) */}
          {activeTab === 'stockin' && (
            <div className="max-w-2xl mx-auto">
              <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Record Incoming Hospital Medications (Stock-In)</h4>
                    <p className="text-[11px] text-slate-500">
                      Add new pharmaceutical shipments, assign batch numbers, set low-stock reorder thresholds.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleStockInSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Drug Generic Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newDrugName}
                        onChange={(e) => setNewDrugName(e.target.value)}
                        placeholder="e.g. Ciprofloxacin"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Brand / Trade Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="e.g. CiproTab, Ciprobay"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="Antimalarial">Antimalarial</option>
                        <option value="Antibiotic">Antibiotic</option>
                        <option value="Antihypertensive">Antihypertensive</option>
                        <option value="Analgesic">Analgesic / Anti-inflammatory</option>
                        <option value="Antidiabetic">Antidiabetic</option>
                        <option value="Infusion IV">Infusion IV / Fluid</option>
                        <option value="Respiratory">Respiratory / Inhaler</option>
                        <option value="Ophthalmic">Ophthalmic / Drops</option>
                        <option value="Vitamins & Supplements">Vitamins & Supplements</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Form
                      </label>
                      <select
                        value={newForm}
                        onChange={(e) => setNewForm(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="Tablets">Tablets</option>
                        <option value="Capsules">Capsules</option>
                        <option value="Suspension">Oral Suspension / Syrup</option>
                        <option value="Infusion IV">Infusion IV</option>
                        <option value="Injection / Ampoule">Injection / Ampoule</option>
                        <option value="Eye Drops">Eye Drops</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Strength
                      </label>
                      <input
                        type="text"
                        value={newStrength}
                        onChange={(e) => setNewStrength(e.target.value)}
                        placeholder="e.g. 500mg, 100ml"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Batch Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newBatchNumber}
                        onChange={(e) => setNewBatchNumber(e.target.value)}
                        placeholder="e.g. BATCH-2026-X"
                        className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Incoming Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(Number(e.target.value))}
                        className="w-full text-xs font-bold px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Unit Type
                      </label>
                      <input
                        type="text"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        placeholder="e.g. packs, bottles, vials"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                        Low Stock Reorder Point <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newReorderLevel}
                        onChange={(e) => setNewReorderLevel(Number(e.target.value))}
                        className="w-full text-xs font-bold px-3 py-1.5 border border-amber-300 rounded-lg bg-white"
                      />
                      <span className="text-[10px] text-amber-700 mt-1 block">
                        Alert triggers when stock drops below this number.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Unit Cost (NGN ₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newUnitCostNgn}
                        onChange={(e) => setNewUnitCostNgn(Number(e.target.value))}
                        className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newExpiryDate}
                        onChange={(e) => setNewExpiryDate(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Pharmaceutical Supplier / Source
                      </label>
                      <input
                        type="text"
                        value={newSupplier}
                        onChange={(e) => setNewSupplier(e.target.value)}
                        placeholder="e.g. Emzor, Chi Pharma, Federal Medical Stores"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Warehouse / Dispensary Shelf Location
                      </label>
                      <input
                        type="text"
                        value={newShelfLocation}
                        onChange={(e) => setNewShelfLocation(e.target.value)}
                        placeholder="e.g. Aisle 3 - Shelf A"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingStockIn}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSubmittingStockIn ? 'Recording...' : 'Record Stock-In to Inventory'}</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* TAB 4: STOCK MOVEMENTS & AUDIT LOG */}
          {activeTab === 'movements' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">Pharmaceutical Stock Movement Audit Log</span>
                  <p className="text-[11px] text-slate-500">
                    Comprehensive chronological ledger of all incoming shipments and outpatient prescription deductions.
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-slate-600">
                  {movements.length} Logged Transactions
                </span>
              </div>

              {movements.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No stock movements recorded yet. Dispensing a prescription or recording incoming stock will record movements here.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">Timestamp</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Medication</th>
                        <th className="px-3 py-2">Quantity</th>
                        <th className="px-3 py-2">Balance</th>
                        <th className="px-3 py-2">Reference / Patient</th>
                        <th className="px-3 py-2">Officer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {movements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(m.timestamp).toLocaleDateString('en-GB')} {new Date(m.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                                m.type === 'INCOMING_BATCH'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : m.type === 'DISPENSED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {m.type === 'INCOMING_BATCH' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {m.type}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-900">{m.drugName}</td>
                          <td className="px-3 py-2 font-mono font-bold">
                            {m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-700">{m.remainingBalance}</td>
                          <td className="px-3 py-2 text-[11px] text-slate-600">
                            {m.patientFolderNumber ? (
                              <span className="font-mono font-bold text-emerald-800">{m.patientFolderNumber}</span>
                            ) : (
                              m.reference || 'Warehouse Restock'
                            )}
                          </td>
                          <td className="px-3 py-2 text-[11px] text-slate-500">{m.performedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
