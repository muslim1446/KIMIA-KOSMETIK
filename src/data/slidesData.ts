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
}

export interface CosmeticIngredient {
  id: 'air' | 'pengemulsi' | 'pemekat' | 'pelembap' | 'pewangi' | 'pengawet' | 'pewarna';
  name: string;
  role: string;
  examples: string;
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
  2: { name: 'Pembentang 2', focus: 'Ubat Moden & Kesesuaian Pesakit' },
  3: { name: 'Pembentang 3', focus: 'Antibiotik, Penyalahgunaan & Regulasi' },
  4: { name: 'Pembentang 4', focus: 'Kosmetik & Bahan Kimia Terlarang' },
};

export const SLIDES_META: SlideMeta[] = [
  {
    index: 0,
    title: 'Ubat-ubatan dan Bahan Kosmetik',
    subtitle: 'Bagaimana bahan yang hampir serupa boleh menjadi ubat, kosmetik, atau racun kepada tubuh kita.',
    presenterLabel: 'Pembentang 1',
    presenters: [1],
    durationSeconds: 60,
    textbookRef: 'Kimia Tingkatan 5 · Bab 5.4 (m.s. 181–186)',
    presenterNotes: {
      talkingPoints: [
        'Mulakan dengan bertanyakan kelas perbezaan antara ubat, krim muka biasa, dan krim pemutih yang diharamkan.',
        'Klik tiga tab di sebelah kanan satu per satu sambil menerangkan tujuan setiap kategori.',
        'Perkenalkan pembahagian topik bagi keempat-empat ahli kumpulan sebelum beralih ke slaid seterusnya.',
      ],
      questionForClass: 'Mengapa sesetengah bahan yang sama boleh digunakan doktor di hospital, tetapi diharamkan jika dimasukkan dalam krim kecantikan?',
      reminder: 'Jangan anggap bahan semula jadi sentiasa selamat dan bahan buatan makmal sentiasa bahaya — tunjukkan contohnya sebentar lagi.',
    },
  },
  {
    index: 1,
    title: 'Ubat Tradisional',
    subtitle: 'Diperoleh daripada tumbuh-tumbuhan herba atau haiwan dan tidak diproses secara kimia.',
    presenterLabel: 'Pembentang 1',
    presenters: [1],
    durationSeconds: 120,
    textbookRef: 'Rajah 5.13 & Gambar foto 5.9 (m.s. 181)',
    presenterNotes: {
      talkingPoints: [
        'Klik setiap herba (Halia, Lidah Buaya, Ginseng, Asam Jawa) dan ceritakan bahagian tumbuhan serta kegunaan sehariannya.',
        'Tunjukkan butang cara penyediaan: daripada ditumbuk dengan lesung, direbus untuk pati, hingga dibungkus menjadi pil atau kapsul.',
        'Buka bahagian Daun Ketum untuk berkongsi sebab ia diharamkan di Malaysia walaupun berasal daripada tumbuhan tradisional.',
      ],
      questionForClass: 'Jika halia dikeringkan dan dimasukkan ke dalam kapsul, adakah ia bertukar menjadi ubat moden atau kekal ubat tradisional?',
      reminder: 'Tekankan kepada rakan sekelas bahawa kapsul herba tetap dikira ubat tradisional selagi tidak diproses secara kimia.',
    },
  },
  {
    index: 2,
    title: 'Ubat Moden & Kesesuaian Pesakit',
    subtitle: 'Dihasilkan melalui bioteknologi, nanoteknologi dan kejuruteraan genetik dalam bentuk pil, kapsul, serbuk atau larutan.',
    presenterLabel: 'Pembentang 2',
    presenters: [2],
    durationSeconds: 150,
    textbookRef: 'Rajah 5.14 & Jadual 5.7 (m.s. 182–183)',
    presenterNotes: {
      talkingPoints: [
        'Sebutkan sumbangan Ibnu Sina sebagai Bapa Perubatan Moden.',
        'Klik jenis ubat di sebelah kiri untuk menerangkan lima kategori utama: Analgesik, Antimikrob, Ubat Psikotik, Antialergi dan Kortikosteroid.',
        'Gunakan bahagian padanan pesakit di bawah: pilih "Pesakit Gastrik" dengan Aspirin, dan "Alahan Penisilin" dengan Antibiotik untuk menunjukkan bahayanya.',
      ],
      questionForClass: 'Mengapa alkohol dan formaldehid tidak boleh disapu pada luka terbuka walaupun kedua-duanya membunuh kuman seperti iodin?',
      reminder: 'Pastikan kelas dapat membezakan Antiseptik (luar badan) dengan Disinfektan (objek bukan hidup seperti lantai dan tandas).',
    },
  },
  {
    index: 3,
    title: 'Antibiotik, Sukatan Dos & Plasebo',
    subtitle: 'Mengapa antibiotik mesti dihabiskan, kesan terlebih dos Parasetamol, dan peranan plasebo.',
    presenterLabel: 'Pembentang 2 & 3',
    presenters: [2, 3],
    durationSeconds: 160,
    textbookRef: 'Penggunaan Ubat & Ujian Klinikal (m.s. 182–184)',
    presenterNotes: {
      talkingPoints: [
        'Bandingkan butang "Habiskan 7 Hari" dengan "Berhenti Hari ke-3" pada graf populasi bakteria.',
        'Tarik gelangsar hari ke Hari 3 hingga Hari 7 supaya kelas nampak baki bakteria yang lebih kuat membiak semula apabila pesakit berhenti awal.',
        'Buka tab Dos Parasetamol dan Plasebo sebelum menyerahkan giliran kepada Pembentang 3.',
      ],
      questionForClass: 'Adakah badan kita yang menjadi kebal terhadap antibiotik, atau bakteria di dalam badan yang membina rintangan?',
      reminder: 'Betulkan tanggapan biasa bahawa badan manusia yang menjadi imun — sebenarnya bakteria yang tinggal hidup membina rintangan.',
    },
  },
  {
    index: 4,
    title: 'Penyalahgunaan Ubat & Pengawasan KKM',
    subtitle: 'Risiko penggunaan tanpa preskripsi serta peranan Akta PT&K 2016 dan NPRA di Malaysia.',
    presenterLabel: 'Pembentang 3',
    presenters: [3],
    durationSeconds: 120,
    textbookRef: 'Gambar foto 5.10 & Dasar PT&K (m.s. 183–184)',
    presenterNotes: {
      talkingPoints: [
        'Terangkan tiga kesan penyalahgunaan utama: rintangan antibiotik, kegagalan fungsi hati dan buah pinggang akibat produk herba tidak sah, serta ketagihan kodeina.',
        'Gunakan kotak semakan kod di sebelah kanan untuk menunjukkan perbezaan kod MAL (ubat berdaftar) dan NOT (kosmetik bernotifikasi).',
        'Terangkan secara ringkas peranan Akta Perubatan Tradisional dan Komplementari 2016 serta NPRA.',
      ],
      questionForClass: 'Jika sebotol jamu atau pil herba tiada nombor MAL, apakah risiko terbesar kepada buah pinggang dan hati pengguna?',
      reminder: 'Tunjukkan kepada kelas cara menyemak kod MAL dan NOT pada kotak ubat atau kosmetik sebenar.',
    },
  },
  {
    index: 5,
    title: 'Bahan Kosmetik & Pengelasannya',
    subtitle: 'Bahan atau produk yang digunakan secara luaran untuk membersih, melindungi atau mencantikkan penampilan.',
    presenterLabel: 'Pembentang 3 & 4',
    presenters: [3, 4],
    durationSeconds: 100,
    textbookRef: 'Rajah 5.16 & Peraturan 1984 (m.s. 184–185)',
    presenterNotes: {
      talkingPoints: [
        'Mulakan giliran Pembentang 4 dengan definisi mudah bahan kosmetik — kegunaan luaran sahaja.',
        'Tapis tiga kategori (Kosmetik Rias, Kosmetik Perawatan, Pewangi) sambil meminta kelas menyebut contoh harian.',
        'Tekankan bahawa krim pelembap dan masker muka termasuk dalam Kosmetik Perawatan, manakala deodoran dalam kategori Pewangi.',
      ],
      questionForClass: 'Mengapakah deodoran dikelaskan di bawah Pewangi manakala krim pelembap di bawah Kosmetik Perawatan?',
      reminder: 'Jangan lupa nyatakan Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984 yang mengawal produk kosmetik di negara kita.',
    },
  },
  {
    index: 6,
    title: 'Tujuh Bahan Asas Kosmetik',
    subtitle: 'Peranan Air, Pengemulsi, Pemekat, Pelembap, Pewangi, Pengawet dan Pewarna dalam sesuatu produk.',
    presenterLabel: 'Pembentang 4',
    presenters: [4],
    durationSeconds: 150,
    textbookRef: 'Rajah 5.15 Bahan Asas Kosmetik (m.s. 184)',
    presenterNotes: {
      talkingPoints: [
        'Klik butang "Fasa Terpisah" terlebih dahulu supaya kelas melihat minyak terapung di atas air.',
        'Kemudian klik "2. Pengemulsi" dan tunjukkan bagaimana air dan minyak membentuk campuran homogen.',
        'Terangkan fungsi bahan lain satu demi satu sehingga kesemua tujuh bahan asas kosmetik lengkap.',
      ],
      questionForClass: 'Apakah yang berlaku kepada produk kosmetik berasaskan air jika pengilang tidak meletakkan pengawet?',
      reminder: 'Terangkan bahawa Gliserin boleh digunakan sebagai pelembap dan juga pemekat dalam penghasilan kosmetik.',
    },
  },
  {
    index: 7,
    title: 'Kosmetik Buatan Sendiri & Bahan Terlarang',
    subtitle: 'Kebaikan kosmetik buatan sendiri serta kesan sampingan bahan kimia terlarang dalam produk kosmetik.',
    presenterLabel: 'Pembentang 4',
    presenters: [4],
    durationSeconds: 140,
    textbookRef: 'Rajah 5.17 & Jadual 5.8 (m.s. 185–186)',
    presenterNotes: {
      talkingPoints: [
        'Bandingkan kebaikan kosmetik buatan sendiri (mudah, selamat, kos murah) dengan keburukan kosmetik komersial yang mengandungi bahan terlarang.',
        'Klik keempat-empat bahan kimia terlarang (Merkuri, Hidrokuinon, Betamethasone valerate, Tretinoin) untuk menunjukkan kesan sampingannya.',
        'Tekankan bahawa Merkuri merosakkan buah pinggang dan sistem saraf jika diserap ke dalam salur darah.',
      ],
      questionForClass: 'Mengapakah krim pemutih yang menjanjikan kesan cerah dengan segera berisiko mengandungi merkuri atau hidrokuinon?',
      reminder: 'Ingatkan rakan sekelas supaya sentiasa menyemak kandungan bahan dan memastikan produk berdaftar dengan Bahagian Regulatori Farmasi Negara.',
    },
  },
  {
    index: 8,
    title: 'Uji Diri & Rumusan Kelas',
    subtitle: 'Uji kefahaman melalui empat situasi berdasarkan topik 5.4 Ubat-ubatan dan Bahan Kosmetik.',
    presenterLabel: 'Semua Ahli',
    presenters: [1, 2, 3, 4],
    durationSeconds: 120,
    textbookRef: 'Uji Diri 5.4 & Ujian Pencapaian (m.s. 186, 197)',
    presenterNotes: {
      talkingPoints: [
        'Setiap ahli membacakan satu soalan dan meminta jawapan daripada rakan sekelas sebelum menekan pilihan jawapan.',
        'Gunakan penerangan di bahagian bawah untuk menjelaskan sebab pilihan tersebut betul atau salah.',
        'Tutup pembentangan dengan rumusan penting daripada keempat-empat ahli.',
      ],
      questionForClass: 'Jika ahli keluarga ingin membeli produk kesihatan atau kosmetik di pasaran, apakah perkara utama yang perlu disemak terlebih dahulu?',
      reminder: 'Beri masa kepada kelas berfikir sebelum mengklik jawapan.',
    },
  },
];

export const TRADITIONAL_HERBS: TraditionalHerb[] = [
  {
    id: 'halia',
    name: 'Halia',
    scientificName: 'Zingiber officinale',
    partUsed: 'Rizom (batang bawah tanah)',
    uses: [
      'Menyingkirkan angin dalam badan',
      'Mencegah selesema',
      'Membantu memanaskan badan',
    ],
    explanation:
      'Sebatian semula jadi dalam halia membantu melancarkan peredaran darah dan melegakan ketidakselesaan perut tanpa pemprosesan kimia.',
    prepNotes: {
      lesung: 'Rizom dihancurkan dengan lesung lalu disapu pada bahagian perut atau sendi yang tidak selesa.',
      rebusan: 'Hirisan halia direbus untuk mendapatkan patinya dan diminum bagi memanaskan badan serta mencegah selesema.',
      kapsul: 'Serbuk halia kering dipasarkan dalam bentuk pil atau kapsul supaya mudah diambil.',
    },
    accentColor: '#B45309',
  },
  {
    id: 'lidah_buaya',
    name: 'Lidah buaya',
    scientificName: 'Aloe barbadensis miller',
    partUsed: 'Daun (gel daun)',
    uses: [
      'Merawat penyakit kulit',
      'Melegakan luka pada kulit akibat melecur atau terbakar',
    ],
    explanation:
      'Gel berair daripada daunnya menyejukkan permukaan kulit yang tercedera dan membantu meredakan luka melecur atau terbakar.',
    prepNotes: {
      lesung: 'Isi daun segar dihancurkan menjadi pes sejuk dan disapu terus pada kulit yang melecur.',
      rebusan: 'Ekstrak gel dicairkan dengan air bersih untuk disapu atau dibilas pada permukaan kulit.',
      kapsul: 'Ekstrak daun lidah buaya dipasarkan dalam bentuk kapsul atau salap bagi kegunaan harian.',
    },
    accentColor: '#2D6A4F',
  },
  {
    id: 'ginseng',
    name: 'Ginseng',
    scientificName: 'Panax ginseng',
    partUsed: 'Akar',
    uses: [
      'Membina pertahanan badan terhadap jangkitan',
      'Merendahkan tekanan darah dan paras kolesterol',
    ],
    explanation:
      'Akar ginseng mengandungi sebatian semula jadi yang membina pertahanan badan serta membantu merendahkan tekanan darah dan paras kolesterol.',
    prepNotes: {
      lesung: 'Akar kering dihancurkan dengan lesung menjadi serbuk halus sebelum dibancuh.',
      rebusan: 'Akar direbus untuk mendapatkan patinya dan diminum bagi membina pertahanan badan.',
      kapsul: 'Akar ginseng diproses menjadi serbuk dan dipasarkan dalam bentuk pil atau kapsul.',
    },
    accentColor: '#92400E',
  },
  {
    id: 'asam_jawa',
    name: 'Asam jawa',
    scientificName: 'Tamarindus indica',
    partUsed: 'Isi buah masak',
    uses: [
      'Jus buahnya dapat melegakan batuk',
      'Membantu mencerahkan kulit',
    ],
    explanation:
      'Buahnya menghasilkan jus semula jadi yang dapat melegakan batuk serta membantu mencerahkan kulit apabila disapu secara luaran.',
    prepNotes: {
      lesung: 'Isi buah dilenyek bersama air suam untuk dijadikan sapuan pencerah kulit.',
      rebusan: 'Jus buah diperah dan direbus untuk mendapatkan patinya bagi melegakan batuk.',
      kapsul: 'Ekstrak buah dipasarkan dalam bentuk pil atau serbuk bancuhan.',
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
    usageRule: 'Perlu diambil mengikut preskripsi doktor (selepas makan).',
    sideEffects: 'Aspirin bersifat asid, tidak sesuai bagi pesakit gastrik atau diberi kepada kanak-kanak kerana dapat menyebabkan ulser perut.',
  },
  {
    id: 'parasetamol',
    name: 'Parasetamol',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Parasetamol'],
    functionDesc: 'Melegakan sakit dalam keadaan sedar.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor atau sukatan yang ditetapkan.',
    sideEffects: 'Parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
  },
  {
    id: 'kodeina',
    name: 'Kodeina',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Kodeina'],
    functionDesc: 'Melegakan sakit, rawatan batuk dan cirit-birit.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor.',
    sideEffects: 'Menyebabkan seseorang itu berasa mengantuk dan berisiko ketagihan jika disalah guna.',
  },
  {
    id: 'antibiotik',
    name: 'Antibiotik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Penisilin', 'Streptomisin'],
    functionDesc: 'Membunuh atau merencatkan pertumbuhan bakteria.',
    usageRule: 'Perlu dihabiskan supaya semua bakteria dibunuh; pesakit alahan penisilin diberikan Kad Alahan Ubat.',
    sideEffects: 'Jika tidak dihabiskan, bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula; alahan dapat membawa maut.',
  },
  {
    id: 'antiseptik',
    name: 'Antiseptik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Hidrogen peroksida', 'Iodin', 'Asid borik'],
    functionDesc: 'Digunakan di bahagian luar badan untuk luka luaran.',
    usageRule: 'Hanya disapu pada bahagian luaran sahaja dan tidak dimakan.',
    sideEffects: 'Berbahaya sekiranya dimakan atau tertelan.',
  },
  {
    id: 'disinfektan',
    name: 'Disinfektan',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Alkohol', 'Formaldehid'],
    functionDesc: 'Memusnahkan patogen yang terdapat pada objek bukan hidup seperti lantai dan sistem perparitan.',
    usageRule: 'Digunakan pada objek bukan hidup sahaja.',
    sideEffects: 'Tidak boleh disapu pada luka atau anggota badan manusia.',
  },
  {
    id: 'psikotik',
    name: 'Ubat Psikotik',
    categoryId: 'psikotik',
    categoryName: 'Ubat Psikotik',
    examples: ['Haloperidol', 'Klorpromazin', 'Klozapin'],
    functionDesc: 'Merawat psikosis, iaitu gejala penyakit mental yang menyebabkan pesakit melihat, mendengar atau mempercayai perkara yang tidak nyata.',
    usageRule: 'Diambil atas preskripsi doktor.',
    sideEffects: 'Mengakibatkan pergerakan muka dan badan yang tidak normal, kejang dan menggeletar.',
  },
  {
    id: 'antialergi',
    name: 'Antialergi',
    categoryId: 'antialergi',
    categoryName: 'Antialergi',
    examples: ['Antihistamin'],
    functionDesc: 'Dapat melegakan hidung berair dan kegatalan.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor.',
    sideEffects: 'Mengakibatkan mengantuk; dos tinggi menyebabkan mulut terasa kering (xerostomia), gangguan penglihatan dan sembelit.',
  },
  {
    id: 'kortikosteroid',
    name: 'Kortikosteroid',
    categoryId: 'kortikosteroid',
    categoryName: 'Kortikosteroid',
    examples: ['Betamethasone valerate', 'Prednisolone'],
    functionDesc: 'Memberikan kelegaan bagi kawasan yang radang; mengurangkan bengkak, kemerahan, gatal-gatal, alergi, asma serta artritis.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor.',
    sideEffects: 'Pengambilan jangka panjang menyebabkan muka sembap (moon face), tekanan darah tinggi dan meningkatkan kandungan gula darah.',
  },
];

export const COSMETIC_INGREDIENTS: CosmeticIngredient[] = [
  {
    id: 'air',
    name: 'Air',
    role: 'Bahan pelarut dalam penghasilan kosmetik.',
    examples: 'Air bersih / air suling',
  },
  {
    id: 'pengemulsi',
    name: 'Pengemulsi',
    role: 'Membentuk campuran homogen antara air dan minyak.',
    examples: 'Lesitin dan asid stearik',
  },
  {
    id: 'pemekat',
    name: 'Pemekat',
    role: 'Memekatkan produk kosmetik.',
    examples: 'Gliserin dan xanthan gum',
  },
  {
    id: 'pelembap',
    name: 'Pelembap',
    role: 'Mengekalkan kelembapan bahan kosmetik.',
    examples: 'Gliserin dan natrium laktat',
  },
  {
    id: 'pewangi',
    name: 'Pewangi',
    role: 'Memberikan aroma yang menyenangkan kepada produk kosmetik.',
    examples: 'Minyak pati',
  },
  {
    id: 'pengawet',
    name: 'Pengawet',
    role: 'Mengelakkan kerosakan kosmetik.',
    examples: 'Paraben dan formaldehid',
  },
  {
    id: 'pewarna',
    name: 'Pewarna',
    role: 'Memberikan warna agar kosmetik lebih menarik.',
    examples: 'Ferum(III) oksida',
  },
];

export const BANNED_CHEMICALS: BannedChemical[] = [
  {
    id: 'merkuri',
    name: 'Merkuri',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta kosmetik secara tidak sah',
    immediateEffect: 'Kulit merengsa walaupun kelihatan cerah sementara.',
    severeHarm: 'Kerosakan buah pinggang dan sistem saraf jika diserap ke dalam salur darah.',
    bodyTarget: 'sistem_saraf_ginjal',
    explanation:
      'Merkuri boleh menyebabkan kulit merengsa serta merosakkan buah pinggang dan sistem saraf apabila diserap ke dalam salur darah.',
  },
  {
    id: 'hidrokuinon',
    name: 'Hidrokuinon',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta kosmetik secara tidak sah',
    immediateEffect: 'Kulit menjadi hipersensitif dan pengurangan pigmentasi.',
    severeHarm: 'Pendedahan kulit kepada sinar UV yang berbahaya akibat pengurangan pigmentasi.',
    bodyTarget: 'melanosit_uv',
    explanation:
      'Hidrokuinon menyebabkan kulit menjadi hipersensitif dan mengurangkan pigmentasi sehingga kulit terdedah kepada sinar UV yang berbahaya.',
  },
  {
    id: 'betamethasone',
    name: 'Betamethasone valerate',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta kosmetik secara tidak sah',
    immediateEffect: 'Kulit merengsa dan perubahan pigmentasi kulit.',
    severeHarm: 'Kerosakan dan perubahan pigmentasi kulit tanpa pengawasan doktor.',
    bodyTarget: 'pigmentasi_epidermis',
    explanation:
      'Betamethasone valerate menyebabkan kulit merengsa dan perubahan pigmentasi kulit apabila dicampurkan ke dalam krim secara tidak sah.',
  },
  {
    id: 'tretinoin',
    name: 'Tretinoin',
    productFoundIn: 'Krim jerawat (tanpa pengawasan doktor)',
    immediateEffect: 'Kulit kemerahan dan mengelupas.',
    severeHarm: 'Keradangan dan pengelupasan kulit berlebihan tanpa nasihat perubatan.',
    bodyTarget: 'lapisan_luar',
    explanation:
      'Tretinoin menyebabkan kulit kemerahan dan mengelupas apabila digunakan dalam krim jerawat tanpa kawalan doktor.',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    scenario:
      'Seorang kanak-kanak berumur 9 tahun mengalami demam panas dan juga mempunyai sejarah sakit gastrik yang kerap.',
    question: 'Analgesik manakah yang paling sesuai diberikan dalam dos tepat, dan mengapa Aspirin mesti dielakkan?',
    options: [
      {
        id: 'a',
        label: 'Beri Parasetamol; elakkan Aspirin kerana sifat asidnya boleh menyebabkan ulser perut.',
        explanation:
          'Betul. Parasetamol tidak merengsakan perut dalam dos tepat, manakala Aspirin bersifat asid dan tidak sesuai untuk kanak-kanak serta pesakit gastrik.',
      },
      {
        id: 'b',
        label: 'Beri Aspirin separuh dos kerana ia bertindak lebih cepat menurunkan suhu.',
        explanation:
          'Kurang tepat. Aspirin tetap bersifat asid dan berisiko menyebabkan ulser perut serta komplikasi pada kanak-kanak.',
      },
      {
        id: 'c',
        label: 'Beri Kodeina supaya kanak-kanak boleh tidur sepanjang malam.',
        explanation:
          'Salah. Kodeina ialah ubat kawalan yang menyebabkan mengantuk dan berisiko ketagihan; ia bukan pilihan bagi demam biasa kanak-kanak.',
      },
    ],
    correctOptionId: 'a',
    kssmRef: 'Jadual 5.7 (Analgesik) — Kimia Tingkatan 5',
  },
  {
    id: 'q2',
    scenario:
      'Selepas mengambil antibiotik penisilin selama 3 hari daripada tempoh 7 hari yang ditetapkan, sakit tekak Amir hilang dan dia bercadang berhenti makan ubat tersebut.',
    question: 'Apakah risiko utama jika Amir menghentikan pengambilan antibiotik pada hari ke-3?',
    options: [
      {
        id: 'a',
        label: 'Badan Amir menjadi kebal terhadap semua jenis vitamin.',
        explanation:
          'Tidak tepat. Bukan badan manusia yang menjadi imun, tetapi bakteria yang masih hidup.',
      },
      {
        id: 'b',
        label: 'Bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula.',
        explanation:
          'Betul. Antibiotik perlu dihabiskan supaya semua bakteria dibunuh; jika tidak, bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula.',
      },
      {
        id: 'c',
        label: 'Penisilin akan bertukar menjadi bahan plasebo di dalam hati.',
        explanation:
          'Salah. Penisilin tidak bertukar menjadi plasebo; masalahnya ialah tidak semua bakteria dibunuh.',
      },
    ],
    correctOptionId: 'b',
    kssmRef: 'Jadual 5.7 Penggunaan Antibiotik (m.s. 182–183)',
  },
  {
    id: 'q3',
    scenario:
      'Dalam penyediaan losen tangan, campuran minyak badam dan air didapati terpisah menjadi dua lapisan setelah dibiarkan selama 10 minit.',
    question: 'Bahan asas kosmetik manakah yang perlu ditambah untuk membentuk campuran homogen antara air dan minyak?',
    options: [
      {
        id: 'a',
        label: 'Pewarna seperti ferum(III) oksida',
        explanation:
          'Salah. Ferum(III) oksida hanya memberikan warna agar kosmetik lebih menarik.',
      },
      {
        id: 'b',
        label: 'Pengawet seperti paraben',
        explanation:
          'Salah. Pengawet mengelakkan kerosakan kosmetik, bukan membentuk campuran homogen.',
      },
      {
        id: 'c',
        label: 'Pengemulsi seperti lesitin atau asid stearik',
        explanation:
          'Betul. Pengemulsi membentuk campuran homogen antara air dan minyak.',
      },
    ],
    correctOptionId: 'c',
    kssmRef: 'Rajah 5.15 Bahan-bahan Asas Kosmetik (m.s. 185)',
  },
  {
    id: 'q4',
    scenario:
      'Ujian makmal ke atas satu krim pemutih tanpa pendaftaran mengesan kehadiran merkuri dan hidrokuinon.',
    question: 'Padanan kesan sampingan manakah yang tepat bagi kedua-dua bahan kimia terlarang itu?',
    options: [
      {
        id: 'a',
        label: 'Merkuri merosakkan buah pinggang & sistem saraf; Hidrokuinon menjadikan kulit hipersensitif dan terdedah kepada sinar UV yang berbahaya.',
        explanation:
          'Betul. Merkuri merosakkan buah pinggang dan sistem saraf jika diserap ke dalam salur darah, manakala hidrokuinon menyebabkan kulit menjadi hipersensitif dan pengurangan pigmentasi yang mendedahkan kulit kepada sinar UV.',
      },
      {
        id: 'b',
        label: 'Merkuri hanya menyebabkan kulit mengelupas ringan; Hidrokuinon menguatkan pigmentasi kulit.',
        explanation:
          'Salah. Kulit kemerahan dan mengelupas ialah kesan Tretinoin, manakala Hidrokuinon menyebabkan pengurangan pigmentasi.',
      },
      {
        id: 'c',
        label: 'Kedua-duanya selamat selagi disapu pada waktu malam sahaja.',
        explanation:
          'Salah. Kedua-duanya ialah bahan kimia terlarang yang berbahaya dalam produk kosmetik.',
      },
    ],
    correctOptionId: 'a',
    kssmRef: 'Jadual 5.8 Bahan Kimia Terlarang dalam Kosmetik (m.s. 186)',
  },
];
