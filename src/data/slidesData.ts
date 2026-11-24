export type PresenterId = 1 | 2 | 3 | 4;

export interface SlideMeta {
  index: number;
  title: string;
  subtitle: string;
  presenterLabel: string;
  presenters: PresenterId[];
  durationSeconds: number;
  textbookRef: string;
  presenterNotes: {
    simpleAnalogy: string;
    talkingPoints: string[];
    questionForClass: string;
    reminder: string;
  };
}

export interface TraditionalHerb {
  id: 'halia' | 'lidah_buaya' | 'ginseng' | 'asam_jawa';
  name: string;
  scientificName: string;
  partUsed: string;
  uses: string[];
  explanation: string;
  prepNotes: {
    lesung: string;
    rebusan: string;
    kapsul: string;
  };
  accentColor: string;
}

export interface ModernDrugItem {
  id: string;
  name: string;
  categoryId: 'analgesik' | 'antimikrob' | 'psikotik' | 'antialergi' | 'kortikosteroid';
  categoryName: string;
  examples: string[];
  functionDesc: string;
  usageRule: string;
  sideEffects: string;
  summaryNote: string;
}

export interface CosmeticIngredient {
  id: 'air' | 'pengemulsi' | 'pemekat' | 'pelembap' | 'pewangi' | 'pengawet' | 'pewarna';
  name: string;
  role: string;
  examples: string;
  simpleNote: string;
}

export interface BannedChemical {
  id: 'merkuri' | 'hidrokuinon' | 'betamethasone' | 'tretinoin';
  name: string;
  productFoundIn: string;
  immediateEffect: string;
  severeHarm: string;
  hazardProfile: 'penyerapan_toksik' | 'gangguan_pigmentasi_uv' | 'perubahan_pigmentasi' | 'kerengsaan_permukaan';
  explanation: string;
}

export interface DailyMystery {
  id: string;
  title: string;
  dailySituation: string;
  questionWhy: string;
  hypotheses: { id: string; label: string; discussionNote: string }[];
  causalChain: {
    step1Fact: string;
    step2Reason: string;
    step3Principle: string;
  };
  kssmRef: string;
}

export interface QuizQuestion {
  id: string;
  scenario: string;
  question: string;
  options: { id: string; label: string; explanation: string }[];
  correctOptionId: string;
  kssmRef: string;
}

export const TEAM_PRESENTERS: Record<PresenterId, { name: string; focus: string }> = {
  1: { name: 'Pembentang 1', focus: 'Definisi Ubat & Ubat Tradisional (m.s. 181)' },
  2: { name: 'Pembentang 2', focus: 'Ubat Moden & Jadual 5.7 (m.s. 182–183)' },
  3: { name: 'Pembentang 3', focus: 'Keberkesanan, Penyalahgunaan, Kawalan KKM & Kosmetik (m.s. 183–185)' },
  4: { name: 'Pembentang 4', focus: 'Bahan Asas Kosmetik & Bahan Kimia Terlarang (m.s. 185–186)' },
};

export const SLIDES_META: SlideMeta[] = [
  {
    index: 0,
    title: '5.4 Ubat-ubatan dan Bahan Kosmetik',
    subtitle:
      'Ubat ialah bahan kimia untuk membantu merawat atau mencegah penyakit; kosmetik ialah bahan atau produk kegunaan luaran untuk membersih, melindungi atau mencantikkan.',
    presenterLabel: 'Pembentang 1',
    presenters: [1],
    durationSeconds: 70,
    textbookRef: 'Kimia Tingkatan 5 · Bab 5.4 (m.s. 181–186)',
    presenterNotes: {
      simpleAnalogy:
        'Ubat ialah bahan kimia untuk merawat atau mencegah penyakit dan selamat jika diambil dengan betul.',
      talkingPoints: [
        'Nyatakan definisi ubat (m.s. 181): bahan kimia yang digunakan untuk membantu merawat atau mencegah penyakit.',
        'Kelaskan ubat kepada ubat tradisional (tidak diproses secara kimia) dan ubat moden.',
        'Tegaskan prinsip buku teks: selamat jika diambil dengan betul; menyalahgunakan ubat memudaratkan diri sendiri.',
      ],
      questionForClass: 'Apakah maksud ubat dan bahan kosmetik mengikut buku teks?',
      reminder: 'Rujuk Standard Pembelajaran 5.4.1 hingga 5.4.4.',
    },
  },
  {
    index: 1,
    title: 'Ubat Tradisional',
    subtitle:
      'Diperoleh daripada tumbuh-tumbuhan herba atau haiwan dan tidak diproses secara kimia.',
    presenterLabel: 'Pembentang 1',
    presenters: [1],
    durationSeconds: 120,
    textbookRef: '5.4.1 · Rajah 5.13 & Gambar foto 5.9 (m.s. 181)',
    presenterNotes: {
      simpleAnalogy:
        'Ubat tradisional tidak diproses secara kimia; disediakan dengan lesung, direbus untuk mendapatkan patinya, atau dalam bentuk pil dan kapsul.',
      talkingPoints: [
        'Tunjukkan 4 contoh Rajah 5.13: Halia, Lidah buaya, Ginseng dan Asam jawa.',
        'Nyatakan cara penyediaan: tidak diproses secara kimia, dihancurkan dengan lesung, direbus untuk mendapatkan patinya, dan evolusi pemprosesan kepada pil atau kapsul.',
        'Buka Cabaran Minda (Gambar foto 5.9 Daun ketum): produk yang diproses daripada daun ketum diharamkan di sisi undang-undang.',
      ],
      questionForClass: 'Mengapakah penjualan produk yang diproses daripada daun ketum diharamkan di sisi undang-undang?',
      reminder: 'Kekalkan fakta tepat Rajah 5.13 (m.s. 181).',
    },
  },
  {
    index: 2,
    title: 'Ubat Moden',
    subtitle:
      'Berasal daripada tumbuhan dan mikroorganisma ataupun bahan kimia sintetik melalui bioteknologi, nanoteknologi dan kejuruteraan genetik.',
    presenterLabel: 'Pembentang 2',
    presenters: [2],
    durationSeconds: 150,
    textbookRef: '5.4.1 & 5.4.2 · Rajah 5.14 & Jadual 5.7 (m.s. 182–183)',
    presenterNotes: {
      simpleAnalogy:
        'Setiap ubat moden mempunyai sifat dan peraturan khusus dalam Jadual 5.7 seperti sifat asid aspirin serta had dos parasetamol.',
      talkingPoints: [
        'Nyatakan 5 jenis ubat moden (Rajah 5.14): Analgesik, Antimikrob, Ubat psikotik, Antialergi dan Kortikosteroid.',
        'Bandingkan Jadual 5.7: Aspirin bersifat asid, Parasetamol melebihi dos merosakkan hati, Antiseptik (luar badan) dan Disinfektan (objek bukan hidup).',
        'Uji kesesuaian berdasarkan Jadual 5.7.',
      ],
      questionForClass: 'Mengapakah aspirin tidak sesuai bagi pesakit gastrik atau kanak-kanak?',
      reminder: 'Sebutkan Ibnu Sina (Bapa Perubatan Moden) serta bentuk pil, kapsul, serbuk dan larutan.',
    },
  },
  {
    index: 3,
    title: 'Mewajarkan Penggunaan Ubat',
    subtitle:
      'Antibiotik perlu dihabiskan, parasetamol melebihi dos merosakkan hati, dan plasebo tiada nilai terapeutik.',
    presenterLabel: 'Pembentang 2 & 3',
    presenters: [2, 3],
    durationSeconds: 150,
    textbookRef: '5.4.2 · Jadual 5.7 & Tahukah Anda (m.s. 182–184)',
    presenterNotes: {
      simpleAnalogy:
        'Penggunaan ubat memerlukan dos yang tepat dan ujian klinikal; plasebo pula tidak mempunyai nilai terapeutik.',
      talkingPoints: [
        'Tab 1: Antibiotik perlu dihabiskan supaya semua bakteria dibunuh dan tidak menjadi imun kepada antibiotik.',
        'Tab 2: Parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
        'Tab 3: Ubat moden menjalani ujian klinikal; plasebo tidak mempunyai sebarang nilai terapeutik walaupun menyerupai ubat sebenar.',
      ],
      questionForClass: 'Apakah maksud plasebo mengikut kotak Tahukah Anda?',
      reminder: 'Gunakan fakta tepat Jadual 5.7 dan m.s. 183–184.',
    },
  },
  {
    index: 4,
    title: 'Keberkesanan, Penyalahgunaan Ubat & Kawalan KKM',
    subtitle:
      'Ketiadaan data kajian menyukarkan pemantauan dos yang betul dan boleh menjurus kepada penyalahgunaan ubat-ubatan.',
    presenterLabel: 'Pembentang 3',
    presenters: [3],
    durationSeconds: 120,
    textbookRef: '5.4.2 · Gambar foto 5.10 & Kawalan KKM (m.s. 183–184)',
    presenterNotes: {
      simpleAnalogy:
        'Penyalahgunaan melibatkan kedua-dua ubat moden dan ubat tradisional; Bahagian Regulatori Farmasi Negara menyelia kualiti dan keselamatan ubat dan kosmetik.',
      talkingPoints: [
        'Tunjukkan 3 contoh Gambar foto 5.10: Antibiotik (rintangan antibiotik), Ubat tradisional berasaskan herba (kegagalan fungsi hati dan buah pinggang) dan Kodeina (ketagihan).',
        'Terangkan Akta Perubatan Tradisional dan Komplementari 2016, Dasar PT&K Kebangsaan dan peranan Bahagian Regulatori Farmasi Negara.',
        'Tunjukkan Portal Kimia (m.s. 184): Cara Semak Ubat dan Kosmetik Mendaftar dengan Kementerian Kesihatan.',
      ],
      questionForClass: 'Mengapakah sesetengah ubat tradisional boleh membawa risiko kesan sampingan jika tidak mempunyai data kajian?',
      reminder: 'Pastikan istilah tepat mengikut m.s. 183–184.',
    },
  },
  {
    index: 5,
    title: 'Bahan Kosmetik & Jenis-jenis Kosmetik',
    subtitle:
      'Kosmetik ialah bahan atau produk yang digunakan secara luaran untuk membersih, melindungi atau mencantikkan penampilan seseorang.',
    presenterLabel: 'Pembentang 3 & 4',
    presenters: [3, 4],
    durationSeconds: 100,
    textbookRef: '5.4.3 · Rajah 5.16 & Peraturan 1984 (m.s. 184–185)',
    presenterNotes: {
      simpleAnalogy:
        'Kosmetik terbahagi kepada kosmetik rias, kosmetik perawatan dan pewangi serta dikawal oleh Peraturan 1984.',
      talkingPoints: [
        'Nyatakan definisi kosmetik (m.s. 184).',
        'Kelaskan tiga kumpulan utama Rajah 5.16: Kosmetik rias, Kosmetik perawatan dan Pewangi.',
        'Nyatakan Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984 (m.s. 185).',
      ],
      questionForClass: 'Berikan tiga jenis kosmetik berserta contohnya mengikut Rajah 5.16.',
      reminder: 'Rujuk semua contoh produk dalam Rajah 5.16.',
    },
  },
  {
    index: 6,
    title: 'Bahan-bahan Asas Kosmetik',
    subtitle:
      'Gabungan air, pengemulsi, pemekat, pelembap, pewangi, pengawet dan pewarna.',
    presenterLabel: 'Pembentang 4',
    presenters: [4],
    durationSeconds: 140,
    textbookRef: '5.4.3 · Rajah 5.15 (m.s. 184–185)',
    presenterNotes: {
      simpleAnalogy:
        'Air bertindak sebagai pelarut manakala pengemulsi seperti lesitin dan asid stearik membentuk campuran homogen antara air dan minyak.',
      talkingPoints: [
        'Tunjukkan 7 bahan asas dalam Rajah 5.15: Air, Pengemulsi, Pemekat, Pelembap, Pewangi, Pengawet dan Pewarna.',
        'Sebutkan contoh tepat: lesitin, asid stearik, gliserin, xanthan gum, natrium laktat, minyak pati, paraben, formaldehid dan ferum(III) oksida.',
      ],
      questionForClass: 'Apakah fungsi pengemulsi dan pengawet dalam penghasilan kosmetik?',
      reminder: 'Gunakan fungsi dan contoh tepat daripada Rajah 5.15.',
    },
  },
  {
    index: 7,
    title: 'Mewajarkan Penggunaan Kosmetik & Bahan Terlarang',
    subtitle:
      'Kebaikan kosmetik buatan sendiri berbanding keburukan kosmetik komersial serta kesan sampingan bahan kimia terlarang Jadual 5.8.',
    presenterLabel: 'Pembentang 4',
    presenters: [4],
    durationSeconds: 140,
    textbookRef: '5.4.4 · Rajah 5.17 & Jadual 5.8 (m.s. 185–186)',
    presenterNotes: {
      simpleAnalogy:
        'Pengguna perlu memastikan kosmetik bebas bahan kimia terlarang dalam Jadual 5.8 dan berdaftar dengan Bahagian Regulatori Farmasi Negara.',
      talkingPoints: [
        'Bandingkan Rajah 5.17: Kebaikan Kosmetik Buatan Sendiri vs Keburukan Kosmetik Komersial.',
        'Terangkan 4 bahan kimia terlarang Jadual 5.8: Merkuri, Hidrokuinon, Betamethasone valerate dan Tretinoin.',
        'Tegaskan nasihat pengguna m.s. 186: pastikan kosmetik berdaftar dengan Bahagian Regulatori Farmasi Negara.',
      ],
      questionForClass: 'Apakah kesan sampingan merkuri dan hidrokuinon apabila dimasukkan ke dalam kosmetik secara tidak sah?',
      reminder: 'Gunakan catatan tepat mengikut Jadual 5.8.',
    },
  },
  {
    index: 8,
    title: 'Uji Diri 5.4, Latihan Modul & Rumusan Bab',
    subtitle:
      'Menjawab empat soalan Uji Diri 5.4 (S1–S4) daripada buku teks dan latihan Modul PdPC (S5–S9).',
    presenterLabel: 'Semua Ahli',
    presenters: [1, 2, 3, 4],
    durationSeconds: 120,
    textbookRef: '5.4.1–5.4.4 · Uji Diri 5.4 (m.s. 186) & Modul PdPC',
    presenterNotes: {
      simpleAnalogy:
        'Soalan S1–S4 mengikut Uji Diri 5.4 buku teks manakala S5–S9 melatih jawapan bagi soalan Modul PdPC.',
      talkingPoints: [
        'Bincangkan setiap soalan Uji Diri 5.4 (S1–S4) dan Latihan Modul (S5–S9) bersama rakan sekelas.',
        'Dedahkan jawapan selepas perbincangan kelas.',
      ],
      questionForClass: 'Aida berasa sakit kepala. Apakah jenis ubat yang sesuai untuk meredakan kesakitannya?',
      reminder: 'Kekalkan jawapan tepat mengikut buku teks bagi S1–S4 dan rujuk Modul PdPC bagi S5–S9.',
    },
  },
];

export const TRADITIONAL_HERBS: TraditionalHerb[] = [
  {
    id: 'halia',
    name: 'Halia',
    scientificName: 'Zingiber officinale',
    partUsed: 'Rizom (Modul PdPC m.s. 225)',
    uses: [
      'Diperoleh daripada tumbuh-tumbuhan herba atau haiwan dan tidak diproses secara kimia.',
      'Disediakan dengan menghancurkan bahagian tertentu tumbuhan menggunakan lesung atau direbus untuk mendapatkan patinya dan diminum.',
      'Mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    ],
    explanation:
      'Kegunaan (Rajah 5.13): Menyingkirkan angin dalam badan, mencegah selesema dan membantu memanaskan badan.',
    prepNotes: {
      lesung: 'Disediakan dengan menghancurkan bahagian tertentu tumbuhan menggunakan lesung dan disapukan pada anggota badan yang sakit.',
      rebusan: 'Bahagian tertentu tumbuhan direbus untuk mendapatkan patinya dan diminum.',
      kapsul: 'Telah mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    },
    accentColor: '#B45309',
  },
  {
    id: 'lidah_buaya',
    name: 'Lidah buaya',
    scientificName: 'Aloe barbadensis miller',
    partUsed: 'Daun (Modul PdPC m.s. 225)',
    uses: [
      'Diperoleh daripada tumbuh-tumbuhan herba atau haiwan dan tidak diproses secara kimia.',
      'Disediakan dengan menghancurkan bahagian tertentu tumbuhan menggunakan lesung dan disapukan pada anggota badan yang sakit.',
      'Mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    ],
    explanation:
      'Kegunaan (Rajah 5.13): Merawat penyakit kulit dan melegakan luka pada kulit akibat melecur atau terbakar.',
    prepNotes: {
      lesung: 'Disediakan dengan menghancurkan bahagian tertentu tumbuhan menggunakan lesung dan disapukan pada anggota badan yang sakit.',
      rebusan: 'Bahagian tertentu tumbuhan direbus untuk mendapatkan patinya dan diminum.',
      kapsul: 'Telah mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    },
    accentColor: '#15803D',
  },
  {
    id: 'ginseng',
    name: 'Ginseng',
    scientificName: 'Panax ginseng',
    partUsed: 'Akar (Modul PdPC m.s. 225)',
    uses: [
      'Diperoleh daripada tumbuh-tumbuhan herba atau haiwan dan tidak diproses secara kimia.',
      'Bahagian tertentu tumbuhan atau haiwan direbus untuk mendapatkan patinya dan diminum.',
      'Mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    ],
    explanation:
      'Kegunaan (Rajah 5.13): Membina pertahanan badan terhadap jangkitan serta merendahkan tekanan darah dan paras kolesterol.',
    prepNotes: {
      lesung: 'Bahagian tertentu tumbuhan dihancurkan dengan menggunakan lesung.',
      rebusan: 'Bahagian tertentu tumbuhan direbus untuk mendapatkan patinya dan diminum.',
      kapsul: 'Telah mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    },
    accentColor: '#92400E',
  },
  {
    id: 'asam_jawa',
    name: 'Asam jawa',
    scientificName: 'Tamarindus indica',
    partUsed: 'Buah (Rajah 5.13 & Modul PdPC m.s. 225)',
    uses: [
      'Diperoleh daripada tumbuh-tumbuhan herba atau haiwan dan tidak diproses secara kimia.',
      'Disediakan dengan menghancurkan bahagian tertentu tumbuhan menggunakan lesung atau direbus untuk mendapatkan patinya dan diminum.',
      'Mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    ],
    explanation:
      'Kegunaan (Rajah 5.13): Jus buahnya dapat melegakan batuk dan mencerahkan kulit.',
    prepNotes: {
      lesung: 'Disediakan dengan menghancurkan bahagian tertentu tumbuhan menggunakan lesung dan disapukan pada anggota badan yang sakit.',
      rebusan: 'Bahagian tertentu tumbuhan direbus untuk mendapatkan patinya dan diminum (jus buahnya dapat melegakan batuk).',
      kapsul: 'Telah mengalami evolusi pemprosesan dan dipasarkan dalam bentuk pil atau kapsul.',
    },
    accentColor: '#7C2D12',
  },
];

export const MODERN_DRUGS: ModernDrugItem[] = [
  {
    id: 'aspirin',
    name: 'Aspirin',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Aspirin'],
    functionDesc: 'Aspirin dan parasetamol melegakan sakit dalam keadaan sedar.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor.',
    sideEffects:
      'Aspirin bersifat asid, tidak sesuai bagi pesakit gastrik atau diberi kepada kanak-kanak kerana dapat menyebabkan ulser perut.',
    summaryNote: 'Jadual 5.7 (m.s. 182): Bersifat asid (tidak sesuai bagi pesakit gastrik atau kanak-kanak).',
  },
  {
    id: 'parasetamol',
    name: 'Parasetamol',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Parasetamol'],
    functionDesc: 'Aspirin dan parasetamol melegakan sakit dalam keadaan sedar.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor.',
    sideEffects: 'Parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
    summaryNote: 'Jadual 5.7 (m.s. 182): Parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
  },
  {
    id: 'kodeina',
    name: 'Kodeina',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Kodeina'],
    functionDesc: 'Kodeina melegakan sakit, rawatan batuk dan cirit birit.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor.',
    sideEffects: 'Kodeina menyebabkan seseorang itu berasa mengantuk; penyalahgunaan menyebabkan ketagihan.',
    summaryNote: 'Jadual 5.7 & Gambar foto 5.10 (m.s. 182–183).',
  },
  {
    id: 'antibiotik',
    name: 'Antibiotik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Penisilin', 'Streptomisin'],
    functionDesc: 'Antibiotik membunuh atau merencatkan pertumbuhan bakteria.',
    usageRule:
      'Antibiotik perlu dihabiskan supaya semua bakteria dibunuh. Pesakit dengan alahan penisilin akan diberikan Kad Alahan Ubat sebagai pemberitahuan tentang keadaannya.',
    sideEffects:
      'Jika tidak dihabiskan, bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula; alahan dapat membawa maut.',
    summaryNote: 'Jadual 5.7 & Gambar foto 5.10 (m.s. 182–183): Penyalahgunaan menyebabkan rintangan antibiotik.',
  },
  {
    id: 'antiseptik',
    name: 'Antiseptik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Hidrogen peroksida', 'Iodin', 'Asid borik'],
    functionDesc: 'Antiseptik digunakan di bahagian luar badan.',
    usageRule: 'Antiseptik hanya disapu pada bahagian luaran sahaja dan tidak dimakan.',
    sideEffects: 'Hanya disapu pada bahagian luaran sahaja dan tidak dimakan.',
    summaryNote: 'Jadual 5.7 (m.s. 182): Digunakan di bahagian luar badan sahaja.',
  },
  {
    id: 'disinfektan',
    name: 'Disinfektan',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Alkohol', 'Formaldehid'],
    functionDesc:
      'Disinfektan memusnahkan patogen yang terdapat pada objek bukan hidup seperti lantai dan sistem perparitan.',
    usageRule: 'Digunakan pada objek bukan hidup seperti lantai dan sistem perparitan.',
    sideEffects: 'Untuk memusnahkan patogen pada objek bukan hidup seperti lantai dan sistem perparitan.',
    summaryNote: 'Jadual 5.7 (m.s. 182): Objek bukan hidup sahaja.',
  },
  {
    id: 'psikotik',
    name: 'Ubat psikotik',
    categoryId: 'psikotik',
    categoryName: 'Ubat psikotik',
    examples: ['Haloperidol', 'Klorpromazin', 'Klozapin'],
    functionDesc:
      'Merawat psikosis, iaitu gejala penyakit mental yang menyebabkan pesakit melihat, mendengar atau mempercayai perkara yang tidak nyata.',
    usageRule: 'Diambil atas preskripsi doktor.',
    sideEffects: 'Mengakibatkan pergerakan muka dan badan yang tidak normal, serta mengakibatkan kejang dan menggeletar.',
    summaryNote: 'Jadual 5.7 (m.s. 183) · Contoh: Haloperidol, Klorpromazin, Klozapin.',
  },
  {
    id: 'antialergi',
    name: 'Antialergi',
    categoryId: 'antialergi',
    categoryName: 'Antialergi',
    examples: ['Antihistamin'],
    functionDesc: 'Dapat melegakan hidung berair dan kegatalan.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor.',
    sideEffects:
      'Mengakibatkan mengantuk; juga dapat menyebabkan mulut terasa kering (xerostomia), gangguan penglihatan dan sembelit jika diambil pada dos yang tinggi.',
    summaryNote: 'Jadual 5.7 (m.s. 183): Kesan tambahan berlaku jika diambil pada dos yang tinggi.',
  },
  {
    id: 'kortikosteroid',
    name: 'Kortikosteroid',
    categoryId: 'kortikosteroid',
    categoryName: 'Kortikosteroid',
    examples: ['Betamethasone valerate', 'Prednisolone'],
    functionDesc:
      'Memberikan kelegaan bagi kawasan yang radang serta mengurangkan bengkak, kemerahan, gatal-gatal dan tindak balas alergi, asma serta artritis.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor.',
    sideEffects:
      'Pengambilan jangka panjang menyebabkan muka sembap (moon face), tekanan darah tinggi dan meningkatkan kandungan gula darah.',
    summaryNote: 'Jadual 5.7 (m.s. 183): Kesan sampingan akibat pengambilan jangka panjang.',
  },
];

export const COSMETIC_INGREDIENTS: CosmeticIngredient[] = [
  {
    id: 'air',
    name: 'Air',
    role: 'Bahan pelarut dalam penghasilan kosmetik.',
    examples: 'Air',
    simpleNote: 'Bahan pelarut dalam penghasilan kosmetik (Rajah 5.15).',
  },
  {
    id: 'pengemulsi',
    name: 'Pengemulsi',
    role: 'Membentuk campuran homogen antara air dan minyak.',
    examples: 'Lesitin dan asid stearik',
    simpleNote: 'Membentuk campuran homogen antara air dan minyak (Rajah 5.15).',
  },
  {
    id: 'pemekat',
    name: 'Pemekat',
    role: 'Memekatkan produk kosmetik.',
    examples: 'Gliserin dan xanthan gum',
    simpleNote: 'Memekatkan produk kosmetik (Rajah 5.15).',
  },
  {
    id: 'pelembap',
    name: 'Pelembap',
    role: 'Mengekalkan kelembapan bahan kosmetik.',
    examples: 'Gliserin dan natrium laktat',
    simpleNote: 'Mengekalkan kelembapan bahan kosmetik (Rajah 5.15).',
  },
  {
    id: 'pewangi',
    name: 'Pewangi',
    role: 'Memberikan aroma yang menyenangkan kepada produk kosmetik.',
    examples: 'Minyak pati',
    simpleNote: 'Memberikan aroma yang menyenangkan kepada produk kosmetik (Rajah 5.15).',
  },
  {
    id: 'pengawet',
    name: 'Pengawet',
    role: 'Mengelakkan kerosakan kosmetik.',
    examples: 'Paraben dan formaldehid',
    simpleNote: 'Mengelakkan kerosakan kosmetik (Rajah 5.15).',
  },
  {
    id: 'pewarna',
    name: 'Pewarna',
    role: 'Memberikan warna agar kosmetik lebih menarik.',
    examples: 'Ferum(III) oksida',
    simpleNote: 'Memberikan warna agar kosmetik lebih menarik (Rajah 5.15).',
  },
];

export const BANNED_CHEMICALS: BannedChemical[] = [
  {
    id: 'merkuri',
    name: 'Merkuri',
    productFoundIn: 'Biasanya dimasukkan ke dalam krim pemutih serta produk kosmetik lain secara tidak sah.',
    immediateEffect: 'Kulit merengsa.',
    severeHarm: 'Kerosakan buah pinggang dan sistem saraf jika diserap ke dalam salur darah.',
    hazardProfile: 'penyerapan_toksik',
    explanation:
      'Kulit merengsa serta kerosakan buah pinggang dan sistem saraf jika diserap ke dalam salur darah.',
  },
  {
    id: 'hidrokuinon',
    name: 'Hidrokuinon',
    productFoundIn: 'Biasanya dimasukkan ke dalam krim pemutih serta produk kosmetik lain secara tidak sah.',
    immediateEffect: 'Kulit menjadi hipersensitif dan pengurangan pigmentasi.',
    severeHarm: 'Pendedahan kulit kepada sinar UV yang merbahaya.',
    hazardProfile: 'gangguan_pigmentasi_uv',
    explanation:
      'Kulit menjadi hipersensitif dan pengurangan pigmentasi yang mengakibatkan pendedahan kulit kepada sinar UV yang merbahaya.',
  },
  {
    id: 'betamethasone',
    name: 'Betamethasone valerate',
    productFoundIn: 'Biasanya dimasukkan ke dalam krim pemutih serta produk kosmetik lain secara tidak sah.',
    immediateEffect: 'Kulit merengsa.',
    severeHarm: 'Perubahan pigmentasi kulit.',
    hazardProfile: 'perubahan_pigmentasi',
    explanation:
      'Kulit merengsa dan perubahan pigmentasi kulit.',
  },
  {
    id: 'tretinoin',
    name: 'Tretinoin',
    productFoundIn: 'Krim jerawat.',
    immediateEffect: 'Kulit kemerahan.',
    severeHarm: 'Kulit kemerahan dan mengelupas.',
    hazardProfile: 'kerengsaan_permukaan',
    explanation:
      'Kulit kemerahan dan mengelupas.',
  },
];

export const DAILY_MYSTERIES: DailyMystery[] = [
  {
    id: 'u1',
    title: 'Uji Diri 5.4 (Soalan 1): Contoh Ubat Tradisional & Kegunaannya',
    dailySituation:
      'Berikan tiga contoh ubat tradisional dan kegunaannya.',
    questionWhy: 'Manakah contoh ubat tradisional dan kegunaannya mengikut Rajah 5.13?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Halia merawat psikosis; Ginseng memusnahkan patogen pada lantai.',
        discussionNote: 'Tidak tepat — merawat psikosis ialah ubat psikotik manakala memusnahkan patogen pada lantai ialah disinfektan (ubat moden).',
      },
      {
        id: 'h2',
        label: 'Halia menyingkirkan angin dalam badan; Lidah buaya melegakan luka melecur; Ginseng membina pertahanan badan.',
        discussionNote: 'Tepat! Ketiga-tiga ubat tradisional ini diperoleh daripada tumbuhan herba dan tidak diproses secara kimia (Rajah 5.13, m.s. 181).',
      },
      {
        id: 'h3',
        label: 'Asam jawa ialah ubat sintetik untuk melegakan sakit dalam keadaan sedar.',
        discussionNote: 'Tidak tepat — asam jawa ialah ubat tradisional tanpa pemprosesan kimia; ubat moden untuk sakit ialah analgesik.',
      },
    ],
    causalChain: {
      step1Fact: 'Halia (menyingkirkan angin dalam badan, mencegah selesema, membantu memanaskan badan), Lidah buaya (merawat penyakit kulit, melegakan luka melecur) dan Ginseng (membina pertahanan badan, merendahkan tekanan darah dan paras kolesterol).',
      step2Reason: 'Disediakan dengan lesung, direbus untuk mendapatkan patinya, atau dipasarkan dalam bentuk pil dan kapsul.',
      step3Principle: 'Ubat tradisional diperoleh daripada tumbuh-tumbuhan herba atau haiwan dan tidak diproses secara kimia (m.s. 181).',
    },
    kssmRef: 'Uji Diri 5.4 No. 1 · Rajah 5.13 (m.s. 181, 186)',
  },
  {
    id: 'u2',
    title: 'Uji Diri 5.4 (Soalan 2): Lima Jenis Ubat Moden',
    dailySituation: 'Nyatakan lima jenis ubat moden.',
    questionWhy: 'Apakah lima jenis ubat moden yang disenaraikan dalam Rajah 5.14?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Aspirin, Parasetamol, Kodeina, Penisilin dan Streptomisin.',
        discussionNote: 'Tidak tepat — itu ialah nama contoh ubat bagi analgesik dan antibiotik.',
      },
      {
        id: 'h2',
        label: 'Analgesik, Antimikrob, Ubat psikotik, Antialergi dan Kortikosteroid.',
        discussionNote: 'Tepat! Itulah lima jenis ubat moden dalam Rajah 5.14 (m.s. 182).',
      },
      {
        id: 'h3',
        label: 'Kosmetik rias, Kosmetik perawatan, Pewangi, Pengemulsi dan Pengawet.',
        discussionNote: 'Tidak tepat — itu ialah jenis kosmetik dan bahan asas kosmetik.',
      },
    ],
    causalChain: {
      step1Fact: 'Analgesik (aspirin, parasetamol, kodeina) dan Antimikrob (antibiotik, antiseptik, disinfektan).',
      step2Reason: 'Ubat psikotik (haloperidol, klorpromazin, klozapin), Antialergi (antihistamin) dan Kortikosteroid (betamethasone valerate, prednisolone).',
      step3Principle: 'Ubat moden berasal daripada tumbuhan dan mikroorganisma ataupun bahan kimia sintetik (m.s. 182).',
    },
    kssmRef: 'Uji Diri 5.4 No. 2 · Rajah 5.14 (m.s. 182, 186)',
  },
  {
    id: 'u3',
    title: 'Uji Diri 5.4 (Soalan 3): Ubat Sesuai untuk Aida',
    dailySituation: 'Aida berasa sakit kepala.',
    questionWhy: 'Apakah jenis ubat yang sesuai untuk meredakan kesakitannya?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Antibiotik seperti penisilin dan streptomisin.',
        discussionNote: 'Tidak tepat — antibiotik membunuh atau merencatkan pertumbuhan bakteria.',
      },
      {
        id: 'h2',
        label: 'Analgesik seperti parasetamol atau aspirin.',
        discussionNote: 'Tepat! Analgesik melegakan sakit dalam keadaan sedar; aspirin bersifat asid (tidak sesuai bagi pesakit gastrik atau kanak-kanak), manakala parasetamol tidak boleh melebihi dos.',
      },
      {
        id: 'h3',
        label: 'Antiseptik seperti hidrogen peroksida, iodin dan asid borik.',
        discussionNote: 'Tidak tepat — antiseptik hanya disapu pada bahagian luaran sahaja dan tidak dimakan.',
      },
    ],
    causalChain: {
      step1Fact: 'Analgesik seperti parasetamol atau aspirin melegakan sakit dalam keadaan sedar.',
      step2Reason: 'Aspirin bersifat asid (dapat menyebabkan ulser perut bagi pesakit gastrik atau kanak-kanak) manakala parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
      step3Principle: 'Perlu diambil mengikut preskripsi doktor (Jadual 5.7, m.s. 182).',
    },
    kssmRef: 'Uji Diri 5.4 No. 3 · Jadual 5.7 (m.s. 182, 186)',
  },
  {
    id: 'u4',
    title: 'Uji Diri 5.4 (Soalan 4): Tiga Jenis Kosmetik',
    dailySituation: 'Berikan tiga jenis kosmetik.',
    questionWhy: 'Apakah tiga jenis kosmetik mengikut Rajah 5.16?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Air, Pengemulsi dan Pengawet.',
        discussionNote: 'Tidak tepat — air, pengemulsi dan pengawet ialah bahan-bahan asas kosmetik (Rajah 5.15).',
      },
      {
        id: 'h2',
        label: 'Kosmetik rias, Kosmetik perawatan dan Pewangi.',
        discussionNote: 'Tepat! Pastikan juga produk bebas bahan kimia terlarang Jadual 5.8 dan berdaftar dengan Bahagian Regulatori Farmasi Negara.',
      },
      {
        id: 'h3',
        label: 'Merkuri, Hidrokuinon dan Tretinoin.',
        discussionNote: 'Tidak tepat — ketiga-tiganya ialah bahan kimia terlarang dalam kosmetik (Jadual 5.8).',
      },
    ],
    causalChain: {
      step1Fact: 'Kosmetik rias (bedak, gincu, pensel alis, pemerah pipi, pembayang mata, celak, maskara), Kosmetik perawatan (krim, pelembap kulit, masker muka) dan Pewangi (deodoran, minyak wangi).',
      step2Reason: 'Tertakluk kepada Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984 serta bebas merkuri, hidrokuinon, betamethasone valerate dan tretinoin.',
      step3Principle: 'Peka dengan kandungan bahan dan pastikan kosmetik berdaftar dengan Bahagian Regulatori Farmasi Negara (m.s. 185–186).',
    },
    kssmRef: 'Uji Diri 5.4 No. 4 · Rajah 5.16 & Jadual 5.8 (m.s. 185–186)',
  },
  {
    id: 'f1',
    title: 'Latihan Modul (m.s. 226): Pokok Halia Sebagai Ubat Tradisional',
    dailySituation: 'Rajah menunjukkan satu pokok halia. Bahagian manakah (daun, batang, tunas atau rizom) digunakan sebagai sumber utama ubat, apakah penyakit yang diubati, dan bagaimanakah cara penyediaannya?',
    questionWhy: 'Pilih jawapan lengkap yang sepadan dengan Latihan 22:',
    hypotheses: [
      {
        id: 'h1',
        label: 'Bahagian daun; merawat kencing manis; disapu terus tanpa diproses.',
        discussionNote: 'Tidak tepat — daun merujuk kepada lidah buaya/serai, bukan halia.',
      },
      {
        id: 'h2',
        label: 'Bahagian rizom; menyingkirkan angin dalam badan & mencegah selesema; direbus untuk mendapatkan patinya dan diminum atau dihancurkan dengan lesung.',
        discussionNote: 'Tepat! Halia menggunakan bahagian rizom untuk menyingkirkan angin dalam badan dan mencegah selesema.',
      },
      {
        id: 'h3',
        label: 'Bahagian buah; melegakan batuk; dicampur dengan bahan kimia sintetik.',
        discussionNote: 'Tidak tepat — buah ialah bahagian asam jawa, dan ubat tradisional tidak diproses secara kimia.',
      },
    ],
    causalChain: {
      step1Fact: 'Sumber utama halia: bahagian rizom (m.s. 226 / Rajah 5.13).',
      step2Reason: 'Menyingkirkan angin dalam badan, mencegah selesema dan membantu memanaskan badan.',
      step3Principle: 'Disediakan dengan menghancurkan menggunakan lesung atau direbus untuk mendapatkan patinya lalu diminum.',
    },
    kssmRef: 'Latihan 22 (m.s. 226) · Rajah 5.13 (m.s. 181)',
  },
  {
    id: 'f2',
    title: 'Latihan Modul (m.s. 231): Mengapa Aspirin Mengakibatkan Sakit Perut?',
    dailySituation: 'Aspirin ialah ubat untuk sakit kepala, tetapi ia juga boleh mengakibatkan sakit perut dan tidak boleh diambil oleh kanak-kanak.',
    questionWhy: 'Mengapakah aspirin menyebabkan sakit perut dan pendarahan dalaman?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Aspirin mengandungi asid (bersifat asid).',
        discussionNote: 'Tepat! Aspirin bersifat asid yang menghakis dinding perut sehingga menyebabkan ulser perut dan pendarahan dalaman.',
      },
      {
        id: 'h2',
        label: 'Aspirin merangsang pertumbuhan bakteria di dalam perut.',
        discussionNote: 'Tidak tepat — aspirin ialah analgesik yang bersifat asid, bukan mikrob.',
      },
      {
        id: 'h3',
        label: 'Aspirin hanya boleh disapu pada bahagian luar badan.',
        discussionNote: 'Tidak tepat — ubat untuk bahagian luar badan ialah antiseptik, bukan aspirin.',
      },
    ],
    causalChain: {
      step1Fact: 'Aspirin mengandungi asid (asid asetilsalisilik / bersifat asid).',
      step2Reason: 'Boleh menyebabkan pendarahan dalaman dan ulser perut bagi pesakit gastrik dan kanak-kanak.',
      step3Principle: 'Gunakan parasetamol sebagai alternatif analgesik bagi kanak-kanak dan ambil mengikut preskripsi doktor selepas makan.',
    },
    kssmRef: 'Soalan 24 & Latihan 26(b) (m.s. 231–232) · Jadual 5.7',
  },
  {
    id: 'f3',
    title: 'Latihan Modul (m.s. 231): Kes Alex & Pelajar Sakit Sendi Bengkak',
    dailySituation: '1) Alex ialah pesakit psikiatrik yang sukar tidur dan murung. 2) Sendi kaki seorang pelajar bengkak dan dalam keadaan sakit.',
    questionWhy: 'Apakah pasangan ubat yang betul bagi (1) Alex dan (2) pelajar tersebut?',
    hypotheses: [
      {
        id: 'h1',
        label: '(1) Kodeina dan (2) Penisilin.',
        discussionNote: 'Tidak tepat — kodeina ialah analgesik untuk batuk/sakit manakala penisilin ialah antibiotik untuk bakteria.',
      },
      {
        id: 'h2',
        label: '(1) Trankuiliser (Ubat psikotik) dan (2) Parasetamol (Analgesik).',
        discussionNote: 'Tepat! Trankuiliser mengurangkan bimbang dan gelisah bagi pesakit psikiatrik; Parasetamol meredakan kesakitan.',
      },
      {
        id: 'h3',
        label: '(1) Parasetamol dan (2) Insulin.',
        discussionNote: 'Tidak tepat — parasetamol melegakan kesakitan/demam, bukan merawat kemurungan psikiatrik.',
      },
    ],
    causalChain: {
      step1Fact: 'Alex (pesakit psikiatrik): Trankuiliser / Ubat psikotik mengurangkan perasaan bimbang, gelisah dan ketegangan.',
      step2Reason: 'Pelajar sakit dan bengkak sendi: Parasetamol (Analgesik) melegakan kesakitan.',
      step3Principle: 'Kenal pasti fungsi setiap jenis ubat moden sebelum memilih rawatan mengikut preskripsi doktor.',
    },
    kssmRef: 'Soalan 25 & Latihan 26(d) (m.s. 231–232)',
  },
  {
    id: 'f4',
    title: 'Latihan Modul (m.s. 232): Antibiotik Perlu Dihabiskan & Ciri Sebenar',
    dailySituation: 'Seorang pesakit yang dirawat dengan antibiotik berhenti makan ubat sebaik sahaja rasa sembuh, dan rakannya menyangka antibiotik juga melegakan kesakitan.',
    questionWhy: 'Apakah kesan jika antibiotik tidak dihabiskan dan kenyataan manakah TIDAK benar tentang antibiotik?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Bakteria menjadi lebih imun terhadap antibiotik; TIDAK benar bahawa antibiotik berkesan mengurangkan kesakitan.',
        discussionNote: 'Tepat! Jika tidak dihabiskan, bakteria menjadi imun dan perlukan dos lebih tinggi. Analgesik yang mengurangkan sakit, bukan antibiotik.',
      },
      {
        id: 'h2',
        label: 'Semua virus akan mati dengan cepat; antibiotik meredakan sakit kepala.',
        discussionNote: 'Tidak tepat — antibiotik hanya membunuh/merencatkan bakteria (bukan virus dan bukan untuk kesakitan).',
      },
      {
        id: 'h3',
        label: 'Penyakit tidak akan berulang walaupun antibiotik dihentikan awal.',
        discussionNote: 'Tidak tepat — baki bakteria yang imun menyebabkan penyakit berulang semula.',
      },
    ],
    causalChain: {
      step1Fact: 'Jika tidak semua bakteria dibunuh, bakteria menjadi lebih imun terhadap antibiotik.',
      step2Reason: 'Pesakit memerlukan dos yang lebih tinggi untuk rawatan selanjutnya (m.s. 232).',
      step3Principle: 'Antibiotik membunuh atau merencatkan bakteria sahaja — tidak mengurangkan kesakitan dan tidak merawat jangkitan virus.',
    },
    kssmRef: 'Soalan 4 & Latihan 26(c) (m.s. 232) · Jadual 5.7',
  },
  {
    id: 'f5',
    title: 'Latihan Modul (m.s. 232): Jadual Fungsi Tiga Ubat Moden (X, Y, Z)',
    dailySituation:
      'Jadual 26 menunjukkan fungsi tiga jenis ubat moden: X (Menghalang rasa sakit), Y (Membunuh atau menghalang pembiakan bakteria), dan Z (Mengubah perasaan dan kelakuan pesakit).',
    questionWhy: 'Apakah jenis ubat moden bagi X, Y dan Z?',
    hypotheses: [
      {
        id: 'h1',
        label: 'X: Antibiotik, Y: Analgesik, Z: Kortikosteroid.',
        discussionNote: 'Tidak tepat — analgesik yang melegakan atau menghalang rasa sakit, manakala antibiotik membunuh bakteria.',
      },
      {
        id: 'h2',
        label: 'X: Analgesik, Y: Antibiotik (Antimikrob), Z: Ubat psikotik.',
        discussionNote: 'Tepat! Itulah padanan tepat X, Y dan Z bagi Latihan 26(a) (m.s. 232) mengikut Rajah 5.14 & Jadual 5.7.',
      },
      {
        id: 'h3',
        label: 'X: Antiseptik, Y: Antialergi, Z: Parasetamol.',
        discussionNote: 'Tidak tepat — antiseptik ialah kegunaan luar badan, antialergi melegakan alergi dan parasetamol ialah contoh analgesik.',
      },
    ],
    causalChain: {
      step1Fact: 'X = Analgesik (melegakan sakit dalam keadaan sedar) · Y = Antibiotik / Antimikrob (membunuh atau merencatkan pertumbuhan bakteria).',
      step2Reason: 'Z = Ubat psikotik (Buku teks Jadual 5.7: merawat psikosis; Modul PdPC: mengubah perasaan dan kelakuan pesakit; contoh: haloperidol, klorpromazin, klozapin).',
      step3Principle: 'Padankan setiap fungsi dalam Rajah 5.14 & Jadual 5.7 dengan tepat untuk menjawab kesemua bahagian Latihan 26 (Modul PdPC m.s. 232).',
    },
    kssmRef: 'Latihan 26(a) Modul PdPC (m.s. 232) · Rajah 5.14 & Jadual 5.7',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    scenario: DAILY_MYSTERIES[2].dailySituation,
    question: DAILY_MYSTERIES[2].questionWhy,
    options: DAILY_MYSTERIES[2].hypotheses.map((h) => ({
      id: h.id,
      label: h.label,
      explanation: h.discussionNote,
    })),
    correctOptionId: 'h2',
    kssmRef: DAILY_MYSTERIES[2].kssmRef,
  },
];
