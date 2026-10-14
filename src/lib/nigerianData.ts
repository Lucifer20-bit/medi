export const NIGERIAN_STATES_AND_LGAS: Record<string, string[]> = {
  Lagos: [
    'Ikeja', 'Alimosho', 'Lagos Island', 'Lagos Mainland', 'Surulere',
    'Eti-Osa', 'Kosofe', 'Oshodi-Isolo', 'Mushin', 'Ikorodu',
    'Agege', 'Apapa', 'Amuwo-Odofin', 'Badagry', 'Epe', 'Ibeju-Lekki', 'Ojo', 'Somolu'
  ],
  'Abuja (FCT)': [
    'Abuja Municipal (AMAC)', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Abaji'
  ],
  Oyo: [
    'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West',
    'Akinyele', 'Ogbomosho North', 'Ogbomosho South', 'Oyo East', 'Oyo West', 'Iseyin', 'Egbeda'
  ],
  Kano: [
    'Kano Municipal', 'Fagge', 'Dala', 'Gwale', 'Tarauni', 'Nasarawa', 'Kumbotso', 'Ungogo', 'Bichi', 'Gwarzo'
  ],
  Rivers: [
    'Port Harcourt', 'Obio-Akpor', 'Ikwerre', 'Eleme', 'Oyigbo', 'Degema', 'Bonny', 'Okrika', 'Ahoada East'
  ],
  Enugu: [
    'Enugu North', 'Enugu South', 'Enugu East', 'Nsukka', 'Udi', 'Oji River', 'Ezeagu', 'Agwu'
  ],
  Anambra: [
    'Awka South', 'Awka North', 'Onitsha North', 'Onitsha South', 'Aguata', 'Nnewi North', 'Nnewi South', 'Idemili North'
  ],
  Kaduna: [
    'Kaduna North', 'Kaduna South', 'Chikun', 'Zaria', 'Sabon Gari', 'Igabi', 'Jema\'a'
  ],
  Ogun: [
    'Abeokuta South', 'Abeokuta North', 'Ijebu Ode', 'Sagamu', 'Ado-Odo/Ota', 'Ifo', 'Obafemi Owode'
  ],
  Delta: [
    'Oshimili South (Asaba)', 'Oshimili North', 'Warri South', 'Warri North', 'Ughelli North', 'Sapele', 'Ika South'
  ],
  Edo: [
    'Oredo (Benin City)', 'Ikpoba Okha', 'Egor', 'Ovia North-East', 'Esan West', 'Etsako West'
  ],
};

export const NIGERIAN_STATES = Object.keys(NIGERIAN_STATES_AND_LGAS);

export const HOSPITAL_DEPARTMENTS = [
  'General Outpatient (GOPD)',
  'Emergency / Casualty',
  'Antenatal / Maternity',
  'Pediatrics',
  'Internal Medicine',
  'Surgical Outpatient',
] as const;

export const COMMON_DIAGNOSES = [
  'Plasmodium falciparum Malaria (Uncomplicated)',
  'Severe Malaria with Anaemia',
  'Typhoid Enteric Fever',
  'Essential Hypertension (Stage 1 / 2)',
  'Sickle Cell Anaemia in Vaso-Occlusive Crisis (VOC)',
  'Type 2 Diabetes Mellitus',
  'Peptic Ulcer Disease (PUD) / H. pylori Gastritis',
  'Upper Respiratory Tract Infection (URTI)',
  'Acute Gastroenteritis with Dehydration',
  'Bronchial Asthma (Acute Exacerbation)',
  'Urinary Tract Infection (UTI)',
  'Neonatal Jaundice / Sepsis',
  'Intrauterine Pregnancy (ANC)',
  'Pelvic Inflammatory Disease (PID)',
];

export const COMMON_DRUGS = [
  { drug: 'Tab Artemether/Lumefantrine (Coartem 80/480mg)', dose: '1 tab', route: 'Oral', frequency: 'BD (Twice daily)', duration: '3 days' },
  { drug: 'Tab Paracetamol 500mg', dose: '1g (2 tabs)', route: 'Oral', frequency: 'TDS (3x daily)', duration: '5 days' },
  { drug: 'Cap Omeprazole 20mg', dose: '20mg', route: 'Oral', frequency: 'BD (Twice daily)', duration: '14 days' },
  { drug: 'Tab Amlodipine 10mg', dose: '10mg', route: 'Oral', frequency: 'OD (Once daily)', duration: '30 days' },
  { drug: 'Tab Metformin 500mg', dose: '500mg', route: 'Oral', frequency: 'BD (Twice daily)', duration: '30 days' },
  { drug: 'Tab Ciprofloxacin 500mg', dose: '500mg', route: 'Oral', frequency: 'BD (Twice daily)', duration: '7 days' },
  { drug: 'Tab Amoxicillin/Clavulanate (Augmentin 625mg)', dose: '625mg', route: 'Oral', frequency: 'BD (Twice daily)', duration: '7 days' },
  { drug: 'Tab Folic Acid 5mg', dose: '5mg', route: 'Oral', frequency: 'OD (Once daily)', duration: '30 days' },
  { drug: 'Oral Rehydration Salts (ORS)', dose: '1 sachet in 1L water', route: 'Oral', frequency: 'PRN (As needed)', duration: '5 days' },
  { drug: 'Syrup Paracetamol 120mg/5ml', dose: '5ml', route: 'Oral', frequency: 'TDS (3x daily)', duration: '3 days' },
  { drug: 'Salbutamol Inhaler (100mcg)', dose: '2 puffs', route: 'Inhalation', frequency: 'PRN (As needed)', duration: 'As needed' },
];

export const ARCHIVE_RACKS = [
  { id: 'Rack A', name: 'Rack A - General Outpatient (Old 1990-2010)' },
  { id: 'Rack B', name: 'Rack B - Adult Medicine (Current)' },
  { id: 'Rack C', name: 'Rack C - Surgical Outpatient & Orthopedics' },
  { id: 'Rack H', name: 'Rack H - Haematology & Sickle Cell Clinic' },
  { id: 'Rack M', name: 'Rack M - Antenatal & Maternity / Gynae' },
  { id: 'Rack P', name: 'Rack P - Under-5 & Pediatrics' },
];
