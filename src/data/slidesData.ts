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
  bodyTarget: 'sistem_saraf_ginjal' | 'melanosit_uv' | 'pigmentasi_epidermis' | 'lapisan_luar';
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
  1: { name: 'Pembentang 1', focus: 'Pengenalan & Ubat Tradisional' },
  2: { name: 'Pembentang 2', focus: 'Ubat Moden & Penggunaan Ubat' },
  3: { name: 'Pembentang 3', focus: 'Penyalahgunaan Ubat, NPRA & Jenis Kosmetik' },
  4: { name: 'Pembentang 4', focus: 'Bahan Asas Kosmetik & Bahan Kimia Terlarang' },
};

export const SLIDES_META: SlideMeta[] = [
  {
    index: 0,
    title: '5.4 Ubat-ubatan dan Bahan Kosmetik',
    subtitle:
      'Ubat merawat atau mencegah penyakit; kosmetik digunakan secara luaran untuk membersih, melindungi atau mencantikkan.',
    presenterLabel: 'Pembentang 1',
    presenters: [1],
    durationSeconds: 70,
    textbookRef: 'Kimia Tingkatan 5 · Bab 5.4 (m.s. 181–186)',
    presenterNotes: {
      simpleAnalogy:
        'Ubat bertindak di dalam badan untuk merawat penyakit, manakala kosmetik kekal di permukaan luar badan.',
      talkingPoints: [
        'Nyatakan definisi ubat (m.s. 181): bahan kimia untuk merawat atau mencegah penyakit.',
        'Nyatakan dua kelas ubat: ubat tradisional dan ubat moden.',
        'Ubat selamat jika diambil dengan betul; jika disalahgunakan boleh memudaratkan diri sendiri.',
      ],
      questionForClass: 'Apakah perbezaan tujuan antara ubat dengan bahan kosmetik?',
      reminder: 'Pastikan kelas memahami empat Standard Pembelajaran (5.4.1 hingga 5.4.4).',
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
        'Herba ditumbuk dengan lesung atau direbus untuk patinya sebelum dijadikan pil atau kapsul moden.',
      talkingPoints: [
        'Klik 4 tumbuhan dalam Rajah 5.13: Halia, Lidah buaya, Ginseng dan Asam jawa.',
        'Tunjukkan 3 cara penyediaan: lesung, direbus dan dipasarkan sebagai pil atau kapsul.',
        'Buka Cabaran Minda (Gambar foto 5.9 Daun ketum) dan bincangkan sebab penjualannya diharamkan.',
      ],
      questionForClass: 'Mengapakah penjualan produk daripada daun ketum diharamkan di sisi undang-undang?',
      reminder: 'Ikut contoh dan kegunaan tepat dalam Rajah 5.13.',
    },
  },
  {
    index: 2,
    title: 'Ubat Moden',
    subtitle:
      'Dihasilkan melalui bioteknologi, nanoteknologi dan kejuruteraan genetik dalam bentuk pil, kapsul, serbuk dan larutan.',
    presenterLabel: 'Pembentang 2',
    presenters: [2],
    durationSeconds: 150,
    textbookRef: '5.4.1 & 5.4.2 · Rajah 5.14 & Jadual 5.7 (m.s. 182–183)',
    presenterNotes: {
      simpleAnalogy:
        'Setiap jenis ubat moden ada fungsi khusus dan peraturan penggunaannya supaya selamat dan berkesan.',
      talkingPoints: [
        'Sebutkan 5 jenis ubat moden (Rajah 5.14): Analgesik, Antimikrob, Ubat psikotik, Antialergi, Kortikosteroid.',
        'Terangkan contoh, fungsi, cara penggunaan dan kesan sampingan daripada Jadual 5.7.',
        'Uji kesesuaian ubat bagi pesakit gastrik, kanak-kanak, alahan penisilin dan luka luar.',
      ],
      questionForClass: 'Mengapakah aspirin tidak sesuai untuk pesakit gastrik dan kanak-kanak?',
      reminder: 'Tekankan peranan Ibnu Sina sebagai Bapa Perubatan Moden.',
    },
  },
  {
    index: 3,
    title: 'Mewajarkan Penggunaan Ubat',
    subtitle:
      'Antibiotik perlu dihabiskan, parasetamol diambil mengikut dos, dan plasebo tiada nilai terapeutik.',
    presenterLabel: 'Pembentang 2 & 3',
    presenters: [2, 3],
    durationSeconds: 150,
    textbookRef: '5.4.2 · Jadual 5.7 & Tahukah Anda (m.s. 182–184)',
    presenterNotes: {
      simpleAnalogy:
        'Berhenti makan antibiotik separuh jalan membiarkan bakteria yang belum mati membina ketahanan.',
      talkingPoints: [
        'Tab 1: Tunjukkan sebab antibiotik perlu dihabiskan — jika tidak, bakteria menjadi imun dan penyakit berulang.',
        'Tab 2: Terangkan parasetamol melebihi dos boleh menyebabkan kerosakan hati.',
        'Tab 3: Terangkan maksud plasebo (m.s. 184) — menyerupai ubat sebenar tetapi tiada nilai terapeutik.',
      ],
      questionForClass: 'Apakah yang berlaku jika pesakit berhenti mengambil antibiotik selepas rasa sihat?',
      reminder: 'Kekalkan istilah ringkas mengikut Jadual 5.7 dan kotak Tahukah Anda.',
    },
  },
  {
    index: 4,
    title: 'Keberkesanan, Penyalahgunaan Ubat & NPRA',
    subtitle:
      'Dos tidak tepat menjurus kepada penyalahgunaan ubat; NPRA menyelia kualiti dan keselamatan ubat serta kosmetik.',
    presenterLabel: 'Pembentang 3',
    presenters: [3],
    durationSeconds: 120,
    textbookRef: '5.4.2 · Gambar foto 5.10 & Kawalan KKM (m.s. 183–184)',
    presenterNotes: {
      simpleAnalogy:
        'Ubat moden melalui ujian klinikal; sesetengah ubat tradisional tiada data kajian untuk mengesahkan dos yang betul.',
      talkingPoints: [
        'Tunjukkan 3 contoh penyalahgunaan dalam Gambar foto 5.10: Antibiotik, Ubat tradisional berasaskan herba, Kodeina.',
        'Terangkan Akta PT&K 2016, Dasar PT&K Kebangsaan dan peranan NPRA (m.s. 184).',
        'Tunjukkan cara menyemak nombor pendaftaran ubat (MAL) dan notifikasi kosmetik (NOT).',
      ],
      questionForClass: 'Apakah kesan penyalahgunaan ubat tradisional berasaskan herba tanpa kawalan dos?',
      reminder: 'Ingatkan kelas untuk menyemak pendaftaran KKM sebelum membeli produk.',
    },
  },
  {
    index: 5,
    title: 'Bahan Kosmetik & Jenis-jenis Kosmetik',
    subtitle:
      'Kosmetik digunakan secara luaran dan dikelaskan kepada kosmetik rias, kosmetik perawatan dan pewangi.',
    presenterLabel: 'Pembentang 3 & 4',
    presenters: [3, 4],
    durationSeconds: 100,
    textbookRef: '5.4.3 · Rajah 5.16 & Peraturan 1984 (m.s. 184–185)',
    presenterNotes: {
      simpleAnalogy:
        'Kosmetik rias mencantikkan wajah, kosmetik perawatan merawat tubuh, dan pewangi memberikan haruman.',
      talkingPoints: [
        'Bacakan definisi kosmetik (m.s. 184): digunakan secara luaran untuk membersih, melindungi atau mencantikkan.',
        'Tunjukkan 3 kumpulan utama dalam Rajah 5.16 bersama contohnya.',
        'Nyatakan Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984 (m.s. 185).',
      ],
      questionForClass: 'Berikan contoh produk bagi setiap tiga jenis kosmetik utama.',
      reminder: 'Rujuk semua contoh produk tepat dalam Rajah 5.16.',
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
        'Air dan minyak tidak bercampur secara semula jadi; pengemulsi menyatukannya menjadi campuran homogen.',
      talkingPoints: [
        'Tunjukkan 7 bahan asas kosmetik dalam Rajah 5.15 bersama fungsi dan contoh setiap satunya.',
        'Klik butang "Fasa Terpisah" lalu tambahkan Pengemulsi untuk menunjukkan campuran homogen.',
        'Tunjukkan kepentingan Pengawet untuk mengelakkan kerosakan kosmetik.',
      ],
      questionForClass: 'Apakah fungsi pengemulsi dan pengawet dalam pembuatan kosmetik?',
      reminder: 'Gunakan contoh tepat daripada Rajah 5.15 seperti lesitin, gliserin dan ferum(III) oksida.',
    },
  },
  {
    index: 7,
    title: 'Mewajarkan Penggunaan Kosmetik & Bahan Terlarang',
    subtitle:
      'Kebaikan kosmetik buatan sendiri berbanding keburukan kosmetik komersial serta kesan bahan kimia terlarang.',
    presenterLabel: 'Pembentang 4',
    presenters: [4],
    durationSeconds: 140,
    textbookRef: '5.4.4 · Rajah 5.17 & Jadual 5.8 (m.s. 185–186)',
    presenterNotes: {
      simpleAnalogy:
        'Kosmetik buatan sendiri murah dan selamat; kosmetik haram pula mencampurkan bahan beracun untuk kesan pantas.',
      talkingPoints: [
        'Bandingkan Kebaikan Kosmetik Buatan Sendiri dengan Keburukan Kosmetik Komersial (Rajah 5.17).',
        'Terangkan 4 bahan kimia terlarang dalam Jadual 5.8: Merkuri, Hidrokuinon, Betamethasone valerate dan Tretinoin.',
        'Tegaskan supaya memilih kosmetik yang berdaftar dengan Bahagian Regulatori Farmasi Negara (NPRA).',
      ],
      questionForClass: 'Apakah kesan sampingan merkuri dan hidrokuinon dalam krim pemutih tidak sah?',
      reminder: 'Pastikan semua catatan dan kesan sampingan mengikut Jadual 5.8.',
    },
  },
  {
    index: 8,
    title: 'Uji Diri 5.4 & Rumusan Bab',
    subtitle:
      'Menjawab empat soalan Uji Diri 5.4 bagi merumuskan keseluruhan topik Ubat-ubatan dan Bahan Kosmetik.',
    presenterLabel: 'Semua Ahli',
    presenters: [1, 2, 3, 4],
    durationSeconds: 120,
    textbookRef: '5.4.1–5.4.4 · Uji Diri 5.4 (m.s. 186)',
    presenterNotes: {
      simpleAnalogy:
        'Empat soalan Uji Diri 5.4 menguji empat Standard Pembelajaran utama topik ini.',
      talkingPoints: [
        'Bincangkan setiap soalan Uji Diri 5.4 bersama rakan sekelas.',
        'Minta kelas memilih jawapan dahulu sebelum mendedahkan penerangan buku teks.',
        'Rumuskan keseluruhan topik 5.4 dengan kemas.',
      ],
      questionForClass: 'Aida berasa sakit kepala. Apakah jenis ubat yang sesuai untuk meredakan kesakitannya?',
      reminder: 'Pastikan jawapan ringkas dan tepat mengikut buku teks.',
    },
  },
];

export const TRADITIONAL_HERBS: TraditionalHerb[] = [
  {
    id: 'halia',
    name: 'Halia',
    scientificName: 'Zingiber officinale',
    partUsed: 'Rizom',
    uses: [
      'Menyingkirkan angin dalam badan.',
      'Mencegah selesema.',
      'Membantu memanaskan badan.',
    ],
    explanation:
      'Diperoleh daripada tumbuhan herba tanpa pemprosesan kimia untuk kegunaan kesihatan tradisional.',
    prepNotes: {
      lesung: 'Dihancurkan menggunakan lesung dan disapu pada anggota badan yang sakit.',
      rebusan: 'Direbus untuk mendapatkan patinya dan diminum.',
      kapsul: 'Dipasarkan dalam bentuk pil atau kapsul melalui evolusi pemprosesan masa ini.',
    },
    accentColor: '#B45309',
  },
  {
    id: 'lidah_buaya',
    name: 'Lidah buaya',
    scientificName: 'Aloe barbadensis miller',
    partUsed: 'Daun',
    uses: [
      'Merawat penyakit kulit.',
      'Melegakan luka pada kulit akibat melecur atau terbakar.',
    ],
    explanation:
      'Lendir daun digunakan secara tradisional untuk merawat masalah dan kecederaan kulit.',
    prepNotes: {
      lesung: 'Bahagian daun dihancurkan menggunakan lesung lalu disapu pada kulit yang sakit atau melecur.',
      rebusan: 'Ekstrak tumbuhan direbus untuk kegunaan tradisional.',
      kapsul: 'Dipasarkan dalam bentuk pil atau kapsul serta produk sapuan moden.',
    },
    accentColor: '#15803D',
  },
  {
    id: 'ginseng',
    name: 'Ginseng',
    scientificName: 'Panax ginseng',
    partUsed: 'Akar',
    uses: [
      'Membina pertahanan badan terhadap jangkitan.',
      'Merendahkan tekanan darah dan paras kolesterol.',
    ],
    explanation:
      'Akar ginseng digunakan sebagai ubat tradisional untuk menyokong daya tahan badan.',
    prepNotes: {
      lesung: 'Akar dihancurkan menggunakan lesung sebelum disediakan.',
      rebusan: 'Akar direbus untuk mendapatkan patinya dan diminum.',
      kapsul: 'Dipasarkan dalam bentuk pil atau kapsul supaya mudah diambil.',
    },
    accentColor: '#92400E',
  },
  {
    id: 'asam_jawa',
    name: 'Asam jawa',
    scientificName: 'Tamarindus indica',
    partUsed: 'Buah',
    uses: [
      'Jus buahnya dapat melegakan batuk.',
      'Mencerahkan kulit.',
    ],
    explanation:
      'Buah asam jawa dimanfaatkan secara tradisional secara dalaman untuk batuk dan luaran pada kulit.',
    prepNotes: {
      lesung: 'Isi buah dilumatkan menggunakan lesung untuk disapu secara luaran pada kulit.',
      rebusan: 'Jus buah dibancuh atau direbus untuk mendapatkan pati minuman bagi melegakan batuk.',
      kapsul: 'Diproses menjadi serbuk, pil atau kapsul untuk kegunaan mudah.',
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
    functionDesc: 'Melegakan sakit dalam keadaan sedar.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor.',
    sideEffects:
      'Bersifat asid; tidak sesuai bagi pesakit gastrik atau kanak-kanak kerana dapat menyebabkan ulser perut.',
    summaryNote: 'Sifat asidnya dapat melukakan dinding perut bagi pesakit gastrik atau kanak-kanak.',
  },
  {
    id: 'parasetamol',
    name: 'Parasetamol',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Parasetamol'],
    functionDesc: 'Melegakan sakit dalam keadaan sedar.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor atau sukatan dos yang betul.',
    sideEffects: 'Melebihi dos dapat menyebabkan kerosakan hati.',
    summaryNote: 'Selamat pada dos biasa; dos berlebihan memudaratkan hati.',
  },
  {
    id: 'kodeina',
    name: 'Kodeina',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Kodeina'],
    functionDesc: 'Melegakan sakit, rawatan batuk dan cirit birit.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor.',
    sideEffects: 'Menyebabkan berasa mengantuk dan risiko ketagihan jika disalah guna.',
    summaryNote: 'Penyalahgunaan kodeina boleh menyebabkan ketagihan (Gambar foto 5.10).',
  },
  {
    id: 'antibiotik',
    name: 'Antibiotik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Penisilin', 'Streptomisin'],
    functionDesc: 'Membunuh atau merencatkan pertumbuhan bakteria.',
    usageRule:
      'Perlu dihabiskan supaya semua bakteria dibunuh; pesakit alahan penisilin diberi Kad Alahan Ubat.',
    sideEffects:
      'Jika tidak dihabiskan, bakteria menjadi imun dan penyakit berulang. Alahan serius boleh membawa maut.',
    summaryNote: 'Dos penuh memastikan semua bakteria dibunuh tanpa membina rintangan antibiotik.',
  },
  {
    id: 'antiseptik',
    name: 'Antiseptik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Hidrogen peroksida', 'Iodin', 'Asid borik'],
    functionDesc: 'Digunakan di bahagian luar badan.',
    usageRule: 'Hanya disapu pada bahagian luaran sahaja dan tidak dimakan.',
    sideEffects: 'Berbahaya sekiranya dimakan atau ditelan.',
    summaryNote: 'Kegunaan luaran pada luka badan sahaja.',
  },
  {
    id: 'disinfektan',
    name: 'Disinfektan',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Alkohol', 'Formaldehid'],
    functionDesc:
      'Memusnahkan patogen pada objek bukan hidup seperti lantai dan sistem perparitan.',
    usageRule: 'Untuk objek bukan hidup sahaja; tidak boleh digunakan pada manusia.',
    sideEffects: 'Merbahaya jika disapu pada kulit, luka atau ditelan.',
    summaryNote: 'Khusus untuk permukaan dan objek bukan hidup.',
  },
  {
    id: 'psikotik',
    name: 'Ubat psikotik',
    categoryId: 'psikotik',
    categoryName: 'Ubat psikotik',
    examples: ['Haloperidol', 'Klorpromazin', 'Klozapin'],
    functionDesc:
      'Merawat psikosis (gejala penyakit mental seperti melihat, mendengar atau mempercayai perkara tidak nyata).',
    usageRule: 'Diambil atas preskripsi doktor.',
    sideEffects: 'Mengakibatkan pergerakan muka dan badan yang tidak normal, kejang dan menggeletar.',
    summaryNote: 'Rawatan terkawal di bawah pengawasan doktor.',
  },
  {
    id: 'antialergi',
    name: 'Antialergi',
    categoryId: 'antialergi',
    categoryName: 'Antialergi',
    examples: ['Antihistamin'],
    functionDesc: 'Melegakan hidung berair dan kegatalan.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor.',
    sideEffects:
      'Mengantuk; dos tinggi menyebabkan mulut terasa kering (xerostomia), gangguan penglihatan dan sembelit.',
    summaryNote: 'Mengawal tindak balas alergi mengikut preskripsi doktor.',
  },
  {
    id: 'kortikosteroid',
    name: 'Kortikosteroid',
    categoryId: 'kortikosteroid',
    categoryName: 'Kortikosteroid',
    examples: ['Betamethasone valerate', 'Prednisolone'],
    functionDesc:
      'Melegakan kawasan radang; mengurangkan bengkak, kemerahan, gatal, alergi, asma dan artritis.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor.',
    sideEffects:
      'Pengambilan jangka panjang menyebabkan muka sembap (moon face), tekanan darah tinggi dan kenaikan gula darah.',
    summaryNote: 'Hanya diambil atas preskripsi doktor dan elakkan penggunaan jangka panjang tanpa kawalan.',
  },
];

export const COSMETIC_INGREDIENTS: CosmeticIngredient[] = [
  {
    id: 'air',
    name: 'Air',
    role: 'Bahan pelarut dalam penghasilan kosmetik.',
    examples: 'Air',
    simpleNote: 'Melarutkan bahan asas lain dalam penghasilan produk kosmetik.',
  },
  {
    id: 'pengemulsi',
    name: 'Pengemulsi',
    role: 'Membentuk campuran homogen antara air dan minyak.',
    examples: 'Lesitin dan asid stearik',
    simpleNote: 'Menyatukan fasa air dan fasa minyak supaya campuran menjadi sekata.',
  },
  {
    id: 'pemekat',
    name: 'Pemekat',
    role: 'Memekatkan produk kosmetik.',
    examples: 'Gliserin dan xanthan gum',
    simpleNote: 'Memberikan kelikatan yang sesuai agar kosmetik mudah disapu.',
  },
  {
    id: 'pelembap',
    name: 'Pelembap',
    role: 'Mengekalkan kelembapan bahan kosmetik.',
    examples: 'Gliserin dan natrium laktat',
    simpleNote: 'Menghalang produk kosmetik dan kulit daripada cepat kering.',
  },
  {
    id: 'pewangi',
    name: 'Pewangi',
    role: 'Memberikan aroma yang menyenangkan kepada produk kosmetik.',
    examples: 'Minyak pati',
    simpleNote: 'Menghasilkan bau yang wangi pada produk kosmetik.',
  },
  {
    id: 'pengawet',
    name: 'Pengawet',
    role: 'Mengelakkan kerosakan kosmetik.',
    examples: 'Paraben dan formaldehid',
    simpleNote: 'Menghalang kerosakan produk kosmetik supaya tahan lebih lama.',
  },
  {
    id: 'pewarna',
    name: 'Pewarna',
    role: 'Memberikan warna agar kosmetik lebih menarik.',
    examples: 'Ferum(III) oksida',
    simpleNote: 'Menambahkan warna yang menarik pada kosmetik rias dan produk lain.',
  },
];

export const BANNED_CHEMICALS: BannedChemical[] = [
  {
    id: 'merkuri',
    name: 'Merkuri',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta produk kosmetik lain secara tidak sah',
    immediateEffect: 'Kulit merengsa.',
    severeHarm: 'Kerosakan buah pinggang dan sistem saraf jika diserap ke dalam salur darah.',
    bodyTarget: 'sistem_saraf_ginjal',
    explanation:
      'Kulit merengsa serta kerosakan buah pinggang dan sistem saraf jika diserap ke dalam salur darah.',
  },
  {
    id: 'hidrokuinon',
    name: 'Hidrokuinon',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta produk kosmetik lain secara tidak sah',
    immediateEffect: 'Kulit menjadi hipersensitif dan pengurangan pigmentasi.',
    severeHarm: 'Pendedahan kulit kepada sinar UV yang merbahaya.',
    bodyTarget: 'melanosit_uv',
    explanation:
      'Kulit menjadi hipersensitif dan pengurangan pigmentasi yang mengakibatkan pendedahan kulit kepada sinar UV yang merbahaya.',
  },
  {
    id: 'betamethasone',
    name: 'Betamethasone valerate',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta produk kosmetik lain secara tidak sah',
    immediateEffect: 'Kulit merengsa.',
    severeHarm: 'Perubahan pigmentasi kulit.',
    bodyTarget: 'pigmentasi_epidermis',
    explanation:
      'Kulit merengsa dan perubahan pigmentasi kulit apabila dimasukkan ke dalam kosmetik secara tidak sah.',
  },
  {
    id: 'tretinoin',
    name: 'Tretinoin',
    productFoundIn: 'Krim jerawat',
    immediateEffect: 'Kulit kemerahan.',
    severeHarm: 'Kulit kemerahan dan mengelupas.',
    bodyTarget: 'lapisan_luar',
    explanation: 'Menyebabkan kulit kemerahan dan mengelupas jika digunakan tanpa pengawasan.',
  },
];

export const DAILY_MYSTERIES: DailyMystery[] = [
  {
    id: 'u1',
    title: 'Uji Diri 5.4 (Soalan 1): Contoh Ubat Tradisional & Kegunaannya',
    dailySituation:
      'Berikan tiga contoh ubat tradisional dan kegunaannya dalam kehidupan harian di Malaysia.',
    questionWhy: 'Manakah padanan tumbuhan herba dan kegunaan yang tepat mengikut Rajah 5.13?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Halia merawat penyakit mental; Ginseng memusnahkan patogen di lantai.',
        discussionNote: 'Kurang tepat — ubat psikotik dan disinfektan ialah kategori ubat moden, bukan herba tradisional.',
      },
      {
        id: 'h2',
        label: 'Halia menyingkirkan angin; Lidah buaya melegakan luka melecur; Ginseng membina pertahanan badan.',
        discussionNote: 'Tepat sekali! Ketiga-tiga contoh dan kegunaan ini menepati Rajah 5.13 (m.s. 181).',
      },
      {
        id: 'h3',
        label: 'Asam jawa hanya untuk melegakan sakit kepala dalam keadaan sedar.',
        discussionNote: 'Tidak tepat — jus buah asam jawa melegakan batuk dan mencerahkan kulit.',
      },
    ],
    causalChain: {
      step1Fact: 'Halia: menyingkirkan angin dalam badan, mencegah selesema dan memanaskan badan.',
      step2Reason: 'Lidah buaya: merawat penyakit kulit dan melegakan luka melecur. Ginseng: membina pertahanan badan dan menurunkan tekanan darah/kolesterol.',
      step3Principle: 'Ubat tradisional diperoleh daripada tumbuhan herba atau haiwan tanpa pemprosesan kimia.',
    },
    kssmRef: 'Uji Diri 5.4 No. 1 · Rajah 5.13 (m.s. 181, 186)',
  },
  {
    id: 'u2',
    title: 'Uji Diri 5.4 (Soalan 2): Lima Jenis Ubat Moden',
    dailySituation: 'Nyatakan lima jenis ubat moden seperti yang dikelaskan dalam Rajah 5.14.',
    questionWhy: 'Apakah lima kumpulan utama ubat moden dalam sukatan Kimia Tingkatan 5?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Aspirin, Parasetamol, Kodeina, Penisilin dan Streptomisin.',
        discussionNote: 'Itu ialah nama contoh ubat bagi Analgesik dan Antibiotik, bukan lima jenis utama ubat moden.',
      },
      {
        id: 'h2',
        label: 'Analgesik, Antimikrob, Ubat psikotik, Antialergi dan Kortikosteroid.',
        discussionNote: 'Tepat sekali! Inilah lima jenis ubat moden dalam Rajah 5.14 (m.s. 182).',
      },
      {
        id: 'h3',
        label: 'Kosmetik rias, Kosmetik perawatan, Pewangi, Pengemulsi dan Pengawet.',
        discussionNote: 'Tidak tepat — itu ialah pengelasan dan bahan asas kosmetik.',
      },
    ],
    causalChain: {
      step1Fact: 'Analgesik (contoh: aspirin, parasetamol, kodeina) dan Antimikrob (antibiotik, antiseptik, disinfektan).',
      step2Reason: 'Ubat psikotik (contoh: haloperidol), Antialergi (antihistamin) dan Kortikosteroid (contoh: prednisolone).',
      step3Principle: 'Ubat moden dihasilkan melalui teknologi baharu dan digunakan mengikut preskripsi.',
    },
    kssmRef: 'Uji Diri 5.4 No. 2 · Rajah 5.14 (m.s. 182, 186)',
  },
  {
    id: 'u3',
    title: 'Uji Diri 5.4 (Soalan 3): Ubat Sesuai untuk Sakit Kepala Aida',
    dailySituation: 'Aida berasa sakit kepala.',
    questionWhy: 'Apakah jenis ubat yang sesuai untuk meredakan kesakitannya?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Antibiotik seperti penisilin untuk membunuh bakteria di kepala.',
        discussionNote: 'Tidak sesuai — antibiotik membunuh atau merencatkan bakteria, bukan meredakan sakit kepala.',
      },
      {
        id: 'h2',
        label: 'Analgesik seperti parasetamol atau aspirin untuk melegakan sakit dalam keadaan sedar.',
        discussionNote: 'Tepat! Analgesik melegakan sakit dalam keadaan sedar; jika Aida ada gastrik, elakkan aspirin.',
      },
      {
        id: 'h3',
        label: 'Antiseptik seperti iodin disapu pada dahi.',
        discussionNote: 'Tidak sesuai — antiseptik hanya untuk membunuh kuman pada luka luaran badan.',
      },
    ],
    causalChain: {
      step1Fact: 'Analgesik berfungsi melegakan sakit dalam keadaan sedar (contoh: parasetamol atau aspirin).',
      step2Reason: 'Parasetamol perlu diambil mengikut sukatan dos yang betul; aspirin dielakkan bagi pesakit gastrik atau kanak-kanak.',
      step3Principle: 'Pemilihan ubat mesti menepati fungsi, dos dan keadaan pesakit (5.4.2).',
    },
    kssmRef: 'Uji Diri 5.4 No. 3 · Jadual 5.7 (m.s. 182, 186)',
  },
  {
    id: 'u4',
    title: 'Uji Diri 5.4 (Soalan 4): Tiga Jenis Kosmetik',
    dailySituation: 'Berikan tiga jenis kosmetik beserta contoh dan cara memilih produk yang selamat.',
    questionWhy: 'Apakah tiga pengelasan utama bahan kosmetik mengikut Rajah 5.16?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Air, Pengemulsi dan Pengawet.',
        discussionNote: 'Kurang tepat — air, pengemulsi dan pengawet ialah bahan asas kosmetik (Rajah 5.15), bukan jenis kosmetik.',
      },
      {
        id: 'h2',
        label: 'Kosmetik rias, Kosmetik perawatan dan Pewangi.',
        discussionNote: 'Tepat sekali! Pastikan juga produk berdaftar dengan NPRA dan bebas merkuri serta hidrokuinon.',
      },
      {
        id: 'h3',
        label: 'Merkuri, Hidrokuinon dan Tretinoin.',
        discussionNote: 'Tidak tepat — ketiga-tiganya ialah bahan kimia terlarang dalam kosmetik (Jadual 5.8).',
      },
    ],
    causalChain: {
      step1Fact: 'Kosmetik rias (bedak, gincu, celak, maskara), Kosmetik perawatan (krim, pelembap kulit, masker muka) dan Pewangi (deodoran, minyak wangi).',
      step2Reason: 'Kosmetik digunakan secara luaran sahaja; elakkan bahan terlarang seperti merkuri, hidrokuinon, betamethasone valerate dan tretinoin.',
      step3Principle: 'Pastikan kosmetik berdaftar dengan Bahagian Regulatori Farmasi Negara (NPRA).',
    },
    kssmRef: 'Uji Diri 5.4 No. 4 · Rajah 5.16 & Jadual 5.8 (m.s. 185–186)',
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
