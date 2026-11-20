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
    feynmanAnalogy: string;
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
  activeMolecule: string;
  molecularMechanism: string;
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
  molecularKey: string;
  targetLock: string;
  whySideEffectHappens: string;
}

export interface CosmeticIngredient {
  id: 'air' | 'pengemulsi' | 'pemekat' | 'pelembap' | 'pewangi' | 'pengawet' | 'pewarna';
  name: string;
  role: string;
  examples: string;
  polarityType: 'berkutub' | 'dwikutub' | 'sokongan';
  molecularRole: string;
}

export interface BannedChemical {
  id: 'merkuri' | 'hidrokuinon' | 'betamethasone' | 'tretinoin';
  name: string;
  productFoundIn: string;
  immediateEffect: string;
  severeHarm: string;
  bodyTarget: 'sistem_saraf_ginjal' | 'melanosit_uv' | 'pigmentasi_epidermis' | 'lapisan_luar';
  explanation: string;
  molecularMechanism: string;
}

export interface PoeMystery {
  id: string;
  title: string;
  dailySituation: string;
  questionWhy: string;
  hypotheses: { id: string; label: string; discussionNote: string }[];
  causalChain: {
    step1Molecule: string;
    step2Body: string;
    step3Principle: string;
  };
  deepChemNote: string;
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
  1: { name: 'Pembentang 1', focus: '3 Rahsia Kimia & Ubat Tradisional' },
  2: { name: 'Pembentang 2', focus: 'Mekanisme Ubat Moden & Dos' },
  3: { name: 'Pembentang 3', focus: 'Rintangan Bakteria, Plasebo & NPRA' },
  4: { name: 'Pembentang 4', focus: 'Polariti Kosmetik & Bahan Terlarang' },
};

export const SLIDES_META: SlideMeta[] = [
  {
    index: 0,
    title: 'Molekul yang Sama, Tujuan Berbeza',
    subtitle: 'Bagaimana bahan kimia menjadi ubat, kosmetik, atau racun bergantung pada struktur, dos, dan tempat tindakan.',
    presenterLabel: 'Pembentang 1',
    presenters: [1],
    durationSeconds: 70,
    textbookRef: 'Kimia Tingkatan 5 · Bab 5.4 (m.s. 181–186)',
    presenterNotes: {
      feynmanAnalogy:
        'Bayangkan pisau dapur dan pisau bedah: bahan logamnya sama, tetapi tangan, tempat dan sukatan menentukan sama ada ia menyembuhkan atau mencederakan.',
      talkingPoints: [
        'Mulakan dengan memecahkan salah tanggapan biasa: bukan semua bahan kimia berbahaya, dan bukan semua bahan semula jadi sentiasa selamat.',
        'Tunjukkan 3 rahsia kimia pada sebelah kiri: Struktur Molekul, Dos/Ketulenan, dan Lapisan Sasaran.',
        'Klik tiga tab di sebelah kanan supaya kelas melihat di lapisan mana ubat, kosmetik, dan krim haram berhenti atau menembusi salur darah.',
      ],
      questionForClass: 'Mengapa Betamethasone valerate dibenarkan oleh doktor di hospital, tetapi diharamkan dalam krim pemutih di pasaran?',
      reminder: 'Beri tumpuan kepada pemahaman konsep sebab-akibat, bukan hafalan nama semata-mata.',
    },
  },
  {
    index: 1,
    title: 'Ubat Tradisional ialah Ekstrak Molekul Alam',
    subtitle: 'Tumbuhan menghasilkan bahan aktif semula jadi, tetapi tanpa pemprosesan kimia kepekatannya sukar disukat tepat.',
    presenterLabel: 'Pembentang 1',
    presenters: [1],
    durationSeconds: 120,
    textbookRef: 'Rajah 5.13 & Gambar foto 5.9 (m.s. 181)',
    presenterNotes: {
      feynmanAnalogy:
        'Meminum air rebusan halia umpama membancuh teh tanpa penimbang — bahan penyembuhnya memang ada di dalam daun/akar, tetapi jumlah molekul aktifnya berbeza-beza.',
      talkingPoints: [
        'Klik setiap tumbuhan dan tunjukkan bahagian tumbuhan serta molekul aktif yang membantu tubuh.',
        'Klik 3 cara penyediaan (Lesung Batu, Direbus, Pil/Kapsul) untuk menerangkan bagaimana menghancurkan atau memanaskan membebaskan bahan aktif.',
        'Buka Cabaran Minda Daun Ketum untuk menunjukkan bahawa tumbuhan semula jadi juga boleh mengandungi molekul psikoaktif yang menyebabkan ketagihan.',
      ],
      questionForClass: 'Jika serbuk halia dimasukkan ke dalam kapsul moden, adakah ia bertukar menjadi ubat moden? Mengapa?',
      reminder: 'Tekankan perbezaan antara bentuk pembungkusan (kapsul) dengan proses kimia penulenan dan sukatan dos.',
    },
  },
  {
    index: 2,
    title: 'Ubat Moden: Kunci Molekul & Sasaran Pesakit',
    subtitle: 'Setiap kelas ubat direka mengunci sasaran tertentu dalam badan; salah pesakit atau dos mengubahnya menjadi bahaya.',
    presenterLabel: 'Pembentang 2',
    presenters: [2],
    durationSeconds: 150,
    textbookRef: 'Rajah 5.14 & Jadual 5.7 (m.s. 182–183)',
    presenterNotes: {
      feynmanAnalogy:
        'Fikirkan ubat seperti kunci dan tapak tindakan badan seperti mangga: jika kuncinya berasid (Aspirin), ia membuka mangga sakit tetapi turut mengikis dinding perut.',
      talkingPoints: [
        'Mulakan dengan 5 kategori utama di sebelah kiri serta sumbangan Ibnu Sina sebagai Bapa Perubatan Moden.',
        'Pilih Aspirin vs Parasetamol, dan Antiseptik vs Disinfektan untuk menerangkan sebab molekulnya bertindak berbeza.',
        'Gunakan Padanan Pesakit di bawah (Pesakit Gastrik + Aspirin, Alahan Penisilin + Antibiotik) serta butang Zum Biokimia bagi murid yang ingin tahu mekanisme molekulnya.',
      ],
      questionForClass: 'Mengapa alkohol dan formaldehid membunuh kuman di lantai tetapi merosakkan tisu jika disapu pada luka terbuka?',
      reminder: 'Fokuskan kepada KENAPA kesan sampingan terjadi (sifat asid, kepekatan, sasaran sel), bukan sekadar membaca senarai.',
    },
  },
  {
    index: 3,
    title: 'Kinetik Rawatan: Evolusi Bakteria, Hati & Plasebo',
    subtitle: 'Mengapa antibiotik mesti dihabiskan, bagaimana perisai hati kehabisan pada dos tinggi, dan peranan ujian plasebo.',
    presenterLabel: 'Pembentang 2 & 3',
    presenters: [2, 3],
    durationSeconds: 160,
    textbookRef: 'Penggunaan Ubat & Ujian Klinikal (m.s. 182–184)',
    presenterNotes: {
      feynmanAnalogy:
        'Berhenti makan antibiotik pada Hari ke-3 umpama membunuh lalang yang lemah di kebun lalu meninggalkan lalang paling liat membiak memenuhi seluruh tanah.',
      talkingPoints: [
        'Tunjukkan pada Hari ke-3 pesakit terasa sihat kerana bakteria biru yang lemah sudah mati — tetapi bakteria merah yang kebal sedang menunggu peluang membiak.',
        'Pada tab Parasetamol, gerakkan gelangsar melebihi 4000 mg dan tunjukkan Perisai Hati (glutation) yang habis digunakan sehingga sel hati diserang.',
        'Pada tab Plasebo, terangkan bagaimana saintis memisahkan kesan harapan otak daripada kesan kimia sebenar molekul ubat.',
      ],
      questionForClass: 'Jika antibiotik tidak dihabiskan, siapakah sebenarnya yang menjadi imun: badan kita atau bakteria?',
      reminder: 'Gunakan butang Zum Biokimia jika pelajar bertanya nama perisai hati (glutation) dan dinding sel bakteria (peptidoglikan).',
    },
  },
  {
    index: 4,
    title: 'Penyalahgunaan Ubat & Pengawasan NPRA',
    subtitle: 'Kesan rantaian biologi penyalahgunaan ubat dan bagaimana kod MAL dan NOT mengesahkan keselamatan bahan.',
    presenterLabel: 'Pembentang 3',
    presenters: [3],
    durationSeconds: 120,
    textbookRef: 'Gambar foto 5.10 & Dasar PT&K (m.s. 183–184)',
    presenterNotes: {
      feynmanAnalogy:
        'Buah pinggang dan hati ialah pusat penapisan sisa kimia tubuh; produk tanpa ujian dos umpama menuang bahan kimia tidak diketahui ke dalam penapis hingga tersumbat dan rosak.',
      talkingPoints: [
        'Klik tiga kes penyalahgunaan untuk menerangkan rantaian punca, proses dalam badan, dan akibatnya.',
        'Terangkan peranan Akta PT&K 2016, Dasar PT&K Kebangsaan, dan Bahagian Regulatori Farmasi Negara (NPRA).',
        'Tunjukkan perbezaan struktur kod MAL (Ubat Berdaftar) dan NOT (Kosmetik Bernotifikasi) menggunakan kotak penyemak.',
      ],
      questionForClass: 'Apakah beza pemeriksaan di sebalik kod MAL berbanding kod NOT?',
      reminder: 'Tegaskan bahawa bentuk pil atau bungkusan cantik tidak menggantikan semakan pendaftaran NPRA.',
    },
  },
  {
    index: 5,
    title: 'Kimia Fizikal Tiga Kategori Kosmetik',
    subtitle: 'Kosmetik hanya bertindak secara luaran; perbezaannya ditentukan oleh pigmen padat, emulsi lembap, atau minyak mudah meruap.',
    presenterLabel: 'Pembentang 3 & 4',
    presenters: [3, 4],
    durationSeconds: 100,
    textbookRef: 'Rajah 5.16 & Peraturan 1984 (m.s. 184–185)',
    presenterNotes: {
      feynmanAnalogy:
        'Kosmetik rias bertindak seperti cat mineral di permukaan kulit; kosmetik perawatan seperti span mengunci air pada kulit; pewangi pula molekul kecil ringan yang terbang ke udara.',
      talkingPoints: [
        'Tekankan definisi teras: kosmetik digunakan secara LUARAN untuk membersih, melindungi atau mencantikkan.',
        'Tunjukkan mengapa Deodoran diletakkan di bawah Pewangi (molekul meruap mengawal bau) manakala Masker dan Krim di bawah Kosmetik Perawatan.',
        'Sebutkan Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984 yang mengawal keselamatan pengguna.',
      ],
      questionForClass: 'Mengapakah molekul minyak wangi boleh sampai ke hidung rakan dari jauh, tetapi pigmen gincu kekal melekat pada bibir?',
      reminder: 'Kaitkan sifat saiz molekul dan kemeruapan dengan 3 kategori kosmetik.',
    },
  },
  {
    index: 6,
    title: 'Minyak, Air & Jambatan Pengemulsi',
    subtitle: 'Minyak tidak larut dalam air kerana perbezaan kekutuban; pengemulsi berdwisifat menyatukan kedua-duanya menjadi krim stabil.',
    presenterLabel: 'Pembentang 4',
    presenters: [4],
    durationSeconds: 150,
    textbookRef: 'Rajah 5.15 Bahan Asas Kosmetik (m.s. 184)',
    presenterNotes: {
      feynmanAnalogy:
        'Air dan minyak umpama dua kumpulan yang enggan berpegang tangan. Pengemulsi ialah pendamai bertangan dua: tangan kepala memegang air, tangan ekor memegang minyak!',
      talkingPoints: [
        'Mulakan dengan klik "Fasa Terpisah" supaya kelas melihat lapisan minyak terapung di atas air.',
        'Tunjukkan gambar rajah molekul di bahagian bawah kanan: air berkutub vs minyak tidak berkutub.',
        'Klik "2. Pengemulsi" dan tunjukkan bagaimana kepala hidrofilik + ekor hidrofobik membalut titisan minyak membentuk campuran homogen, lalu lengkapkan bahan lain (terutama Pengawet untuk cegah kulat).',
      ],
      questionForClass: 'Jika produk penjagaan kulit mengandungi air tanpa pengawet, apa yang akan tumbuh dalam beberapa hari?',
      reminder: 'Ini antara konsep kimia tulen paling penting dalam Bab 5.4 — luangkan masa pada gambar rajah molekul jambatan.',
    },
  },
  {
    index: 7,
    title: 'Forensik Bahan Kimia Terlarang',
    subtitle: 'Kesan cerah segera berpunca daripada sekatan enzim melanin atau kecutan salur darah yang merosakkan sel dan organ.',
    presenterLabel: 'Pembentang 4',
    presenters: [4],
    durationSeconds: 140,
    textbookRef: 'Rajah 5.17 & Jadual 5.8 (m.s. 185–186)',
    presenterNotes: {
      feynmanAnalogy:
        'Memakai krim hidrokuinon umpama membuang payung melanin kulit di tengah hari terik; nampak cerah sementara tetapi sinar UV menembak terus sel kulit!',
      talkingPoints: [
        'Bandingkan kebaikan kosmetik buatan sendiri dengan risiko kosmetik komersial haram (Rajah 5.17).',
        'Klik kesemua 4 bahan terlarang (Merkuri, Hidrokuinon, Betamethasone valerate, Tretinoin) untuk menunjukkan lapisan badan yang diserang.',
        'Terangkan mengapa Merkuri amat berbahaya: ion logam berat menembusi kulit masuk ke salur darah lalu mengikat protein buah pinggang dan saraf.',
      ],
      questionForClass: 'Mengapa pengguna yang memakai krim pemutih merkuri berasa kulit cerah pada minggu pertama, tetapi rosak buah pinggang bertahun kemudian?',
      reminder: 'Gunakan Zum Biokimia untuk menerangkan peranan enzim tirosinase dan ikatan merkuri pada organ dalaman.',
    },
  },
  {
    index: 8,
    title: 'Makmal Penaakulan Feynman: Ramal → Perhati → Terangkan',
    subtitle: 'Menguji kefahaman kimia sebenar melalui penaakulan molekul terhadap empat misteri harian.',
    presenterLabel: 'Semua Ahli',
    presenters: [1, 2, 3, 4],
    durationSeconds: 130,
    textbookRef: 'Sintesis Bab 5.4 · Pedagogi Ramal-Perhati-Terangkan (m.s. 181–186)',
    presenterNotes: {
      feynmanAnalogy:
        'Matlamat belajar kimia bukan menghafal jawapan A, B, C untuk peperiksaan — tetapi boleh menjelaskan KENAPA sesuatu fenomena berlaku di tahap molekul.',
      talkingPoints: [
        'Bacakan satu misteri harian, minta 2-3 orang rakan sekelas meramalkan punca (klik hipotesis mereka untuk membincangkan logiknya).',
        'Jangan salahkan jawapan pelajar — tekan butang "Dedah Mekanisme Molekul" untuk menunjukkan rantaian sebab-akibat kimia sebenar.',
        'Akhiri pembentangan dengan merumuskan 3 prinsip kimia di sebelah kiri: Struktur & Kekutuban, Dos & Kepekatan, Sasaran & Pengawasan.',
      ],
      questionForClass: 'Jika seorang rakan ingin memulakan jenama losen herba buatan sendiri, apakah 3 prinsip kimia yang mesti dipatuhinya?',
      reminder: 'Pastikan suasana terbuka seperti perbincangan makmal, bukan kuiz peperiksaan.',
    },
  },
];

export const TRADITIONAL_HERBS: TraditionalHerb[] = [
  {
    id: 'halia',
    name: 'Halia',
    scientificName: 'Zingiber officinale',
    partUsed: 'Rizom (batang bawah tanah)',
    activeMolecule: 'Sebatian Fenolik Semula Jadi (Gingerol)',
    molecularMechanism: 'Merangsang reseptor haba dan melegakan pengecutan otot usus untuk menolak angin serta memanaskan badan.',
    uses: [
      'Menyingkirkan angin dalam badan',
      'Mencegah selesema',
      'Membantu memanaskan badan',
    ],
    explanation:
      'Rizom halia menghasilkan sebatian aktif semula jadi tanpa pemprosesan kimia yang membantu melancarkan peredaran dan melegakan ketidakselesaan perut.',
    prepNotes: {
      lesung: 'Dihancurkan dengan lesung: memecahkan dinding sel tumbuhan supaya pati molekul aktif terus menyentuh bahagian badan yang sakit.',
      rebusan: 'Direbus untuk mendapatkan pati: haba dan air melarutkan molekul aktif menjadi minuman suam yang mudah diserap.',
      kapsul: 'Dipasarkan dalam bentuk pil atau kapsul: hanya memudahkan pengambilan serbuk tumbuhan, namun kepekatan bahan aktifnya tidak setulen ubat moden.',
    },
    accentColor: '#B45309',
  },
  {
    id: 'lidah_buaya',
    name: 'Lidah buaya',
    scientificName: 'Aloe barbadensis miller',
    partUsed: 'Daun (gel daun)',
    activeMolecule: 'Gel Polisakarida Berair & Sebatian Penenang',
    molecularMechanism: 'Rangkaian gula panjang memerangkap molekul air membentuk lapisan penyejuk pada kulit melecur supaya sel kulit dapat pulih.',
    uses: [
      'Merawat penyakit kulit',
      'Melegakan luka pada kulit akibat melecur atau terbakar',
    ],
    explanation:
      'Gel lutsinar daripada daun lidah buaya kaya dengan air terikat yang menurunkan haba permukaan kulit yang tercedera.',
    prepNotes: {
      lesung: 'Isi daun dihancurkan segar: membebaskan gel berair pekat untuk disapu terus pada kulit yang melecur atau terbakar.',
      rebusan: 'Ekstrak gel dicairkan: dicampurkan dengan air bersih untuk membasuh atau menyejukkan permukaan kulit.',
      kapsul: 'Diproses dalam bentuk kapsul atau salap: memudahkan penyimpanan gel dan ekstrak untuk kegunaan harian.',
    },
    accentColor: '#15803D',
  },
  {
    id: 'ginseng',
    name: 'Ginseng',
    scientificName: 'Panax ginseng',
    partUsed: 'Akar',
    activeMolecule: 'Glikosida Tumbuhan (Ginsenosida)',
    molecularMechanism: 'Membantu sel pertahanan tubuh bertindak balas terhadap jangkitan serta menyokong kelenturan salur darah.',
    uses: [
      'Membina pertahanan badan terhadap jangkitan',
      'Merendahkan tekanan darah dan paras kolesterol',
    ],
    explanation:
      'Akar ginseng menyimpan molekul aktif tumbuhan secara perlahan sepanjang pertumbuhannya bagi membantu daya tahan badan.',
    prepNotes: {
      lesung: 'Akar kering ditumbuk: memecahkan gentian akar yang keras menjadi serbuk supaya sebatian aktifnya mudah keluar.',
      rebusan: 'Akar direbus: haba air panas mengekstrak ginsenosida larut air ke dalam air rebusan untuk diminum.',
      kapsul: 'Pil atau kapsul akar: memudahkan pengguna mengambil serbuk akar ginseng tanpa rasa pahit air rebusan.',
    },
    accentColor: '#92400E',
  },
  {
    id: 'asam_jawa',
    name: 'Asam jawa',
    scientificName: 'Tamarindus indica',
    partUsed: 'Isi buah masak',
    activeMolecule: 'Asid Organik Semula Jadi (Asid Tartarik)',
    molecularMechanism: 'Keasidan lembut membantu mencairkan mukus tekak dan menanggalkan lapisan sel kulit mati di permukaan.',
    uses: [
      'Jus buahnya dapat melegakan batuk',
      'Mencerahkan kulit',
    ],
    explanation:
      'Isi buah asam jawa mengandungi asid organik lemah semula jadi yang bertindak lembut pada tekak apabila diminum dan pada permukaan kulit apabila disapu.',
    prepNotes: {
      lesung: 'Isi buah dilenyek: membebaskan asid buah dan pulpa lembut untuk disapu secara luaran bagi mencerahkan kulit.',
      rebusan: 'Jus buah direbus atau dibancuh suam: pati masam yang terlarut diminum bagi melegakan kerengsaan batuk.',
      kapsul: 'Serbuk atau pil ekstrak buah: memudahkan bancuhan minuman dan kegunaan luar tanpa perlu memerah buah mentah.',
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
    sideEffects: 'Bersifat asid; tidak sesuai bagi pesakit gastrik atau kanak-kanak kerana dapat menyebabkan ulser perut.',
    molecularKey: 'Molekul berasid (-COOH) penyekat isyarat sakit',
    targetLock: 'Menyekat isyarat sakit, tetapi turut menghakis mukus pelindung perut',
    whySideEffectHappens: 'Sifat asid Aspirin dan gangguan kepada lapisan mukus menyebabkan asid perut melukakan dinding perut (ulser).',
  },
  {
    id: 'parasetamol',
    name: 'Parasetamol',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Parasetamol'],
    functionDesc: 'Melegakan sakit dalam keadaan sedar.',
    usageRule: 'Diambil mengikut preskripsi doktor atau sukatan had dos harian.',
    sideEffects: 'Pengambilan melebihi dos boleh menyebabkan kerosakan hati.',
    molecularKey: 'Molekul neutral (tidak menghakis asid perut)',
    targetLock: 'Menenangkan pusat sakit di sistem saraf, diuraikan oleh hati',
    whySideEffectHappens: 'Dos normal dineutralkan oleh perisai hati (glutation); dos berlebihan menghabiskan perisai itu lalu sisa toksik merosakkan sel hati.',
  },
  {
    id: 'kodeina',
    name: 'Kodeina',
    categoryId: 'analgesik',
    categoryName: 'Analgesik',
    examples: ['Kodeina'],
    functionDesc: 'Melegakan sakit, rawatan batuk dan cirit-birit.',
    usageRule: 'Perlu diambil mengikut preskripsi doktor secara terkawal.',
    sideEffects: 'Menyebabkan seseorang itu berasa mengantuk dan berisiko ketagihan jika disalah guna.',
    molecularKey: 'Alkaloid penyekat refleks sakit & batuk di saraf pusat',
    targetLock: 'Melekat pada reseptor opioid di otak untuk meredakan sakit dan batuk',
    whySideEffectHappens: 'Penindasan sistem saraf pusat memperlahankan kewaspadaan (mengantuk) dan membiasakan otak bergantung kepadanya (ketagihan).',
  },
  {
    id: 'antibiotik',
    name: 'Antibiotik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Penisilin', 'Streptomisin'],
    functionDesc: 'Membunuh atau merencatkan pertumbuhan bakteria.',
    usageRule: 'Mesti dihabiskan tempoh pengambilannya; pesakit alahan penisilin diberi Kad Alahan Ubat.',
    sideEffects: 'Jika tidak dihabiskan, bakteria menjadi imun dan penyakit berulang. Alahan serius boleh membawa maut.',
    molecularKey: 'Cincin molekul pemecah dinding sel bakteria',
    targetLock: 'Menyerang dinding sel peptidoglikan bakteria (sel manusia tiada dinding ini)',
    whySideEffectHappens: 'Penghentian awal membiarkan bakteria kebal membiak; bagi pesakit alahan, sistem imun menyerang penisilin secara melampau.',
  },
  {
    id: 'antiseptik',
    name: 'Antiseptik',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Hidrogen peroksida', 'Iodin', 'Asid borik'],
    functionDesc: 'Membunuh kuman di bahagian luar badan.',
    usageRule: 'Hanya disapu pada bahagian luaran badan sahaja dan tidak dimakan.',
    sideEffects: 'Berbahaya dan beracun sekiranya dimakan atau ditelan.',
    molecularKey: 'Agen pengoksida ringan untuk permukaan kulit hidup',
    targetLock: 'Memusnahkan protein kuman pada luka terbuka tanpa merosakkan kulit luar',
    whySideEffectHappens: 'Kepekatan lembutnya selamat di kulit luar tetapi mencederakan sel sensitif saluran penghadaman jika ditelan.',
  },
  {
    id: 'disinfektan',
    name: 'Disinfektan',
    categoryId: 'antimikrob',
    categoryName: 'Antimikrob',
    examples: ['Alkohol', 'Formaldehid'],
    functionDesc: 'Memusnahkan patogen pada objek bukan hidup seperti lantai dan sistem perparitan.',
    usageRule: 'Untuk permukaan dan objek bukan hidup sahaja.',
    sideEffects: 'Tidak boleh disapu pada luka atau anggota badan manusia kerana memusnahkan tisu hidup.',
    molecularKey: 'Pelarut & pengikat protein berkekuatan tinggi',
    targetLock: 'Melarutkan membran lemak dan menggumpalkan semua protein pada lantai/objek',
    whySideEffectHappens: 'Tindak balas kimianya terlalu agresif — ia tidak dapat membezakan antara kuman dengan sel kulit manusia.',
  },
  {
    id: 'psikotik',
    name: 'Ubat Psikotik',
    categoryId: 'psikotik',
    categoryName: 'Ubat Psikotik',
    examples: ['Haloperidol', 'Klorpromazin', 'Klozapin'],
    functionDesc: 'Merawat psikosis (gejala penyakit mental seperti melihat, mendengar atau mempercayai perkara tidak nyata).',
    usageRule: 'Diambil atas preskripsi doktor pakar.',
    sideEffects: 'Mengakibatkan pergerakan muka dan badan yang tidak normal, kejang dan menggeletar.',
    molecularKey: 'Penyelaras isyarat kimia dopamina di otak',
    targetLock: 'Mengimbangi reseptor saraf yang terlalu aktif di pusat persepsi otak',
    whySideEffectHappens: 'Oleh sebab dopamina juga mengawal pergerakan otot halus, penyekatannya boleh menyebabkan otot menggeletar atau kejang.',
  },
  {
    id: 'antialergi',
    name: 'Antialergi',
    categoryId: 'antialergi',
    categoryName: 'Antialergi',
    examples: ['Antihistamin'],
    functionDesc: 'Melegakan hidung berair dan kegatalan akibat alergi.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor atau ahli farmasi.',
    sideEffects: 'Mengantuk; dos tinggi menyebabkan mulut terasa kering (xerostomia), gangguan penglihatan dan sembelit.',
    molecularKey: 'Penghalang tapak pengikatan histamin',
    targetLock: 'Menduduki reseptor histamin supaya tindak balas gatal dan bengkak berhenti',
    whySideEffectHappens: 'Sebahagian molekul masuk ke otak (mengantuk) dan turut menyekat isyarat kelenjar air liur serta usus (mulut kering & sembelit).',
  },
  {
    id: 'kortikosteroid',
    name: 'Kortikosteroid',
    categoryId: 'kortikosteroid',
    categoryName: 'Kortikosteroid',
    examples: ['Betamethasone valerate', 'Prednisolone'],
    functionDesc: 'Melegakan kawasan radang; mengurangkan bengkak, kemerahan, gatal, alergi, asma dan artritis.',
    usageRule: 'Hanya boleh diambil atas preskripsi doktor.',
    sideEffects: 'Pengambilan jangka panjang menyebabkan muka sembap (moon face), tekanan darah tinggi dan kenaikan gula darah.',
    molecularKey: 'Molekul steroid peniru hormon penenang radang',
    targetLock: 'Memasuki nukleus sel untuk memadamkan isyarat keradangan yang melampau',
    whySideEffectHappens: 'Hormon steroid yang berlebihan dalam tempoh lama mengubah pengekalan air, garam dan pembebasan glukosa dalam darah.',
  },
];

export const COSMETIC_INGREDIENTS: CosmeticIngredient[] = [
  {
    id: 'air',
    name: 'Air',
    role: 'Bahan pelarut dalam penghasilan kosmetik.',
    examples: 'Air bersih / air suling',
    polarityType: 'berkutub',
    molecularRole: 'Molekul berkutub (H2O) membentuk ikatan hidrogen untuk melarutkan bahan larut air.',
  },
  {
    id: 'pengemulsi',
    name: 'Pengemulsi',
    role: 'Membentuk campuran homogen antara air dan minyak.',
    examples: 'Lesitin dan asid stearik',
    polarityType: 'dwikutub',
    molecularRole: 'Mempunyai kepala suka air (hidrofilik) dan ekor suka minyak (hidrofobik) untuk mengikat kedua-duanya.',
  },
  {
    id: 'pemekat',
    name: 'Pemekat',
    role: 'Memekatkan produk kosmetik supaya mudah disapu.',
    examples: 'Gliserin dan xanthan gum',
    polarityType: 'berkutub',
    molecularRole: 'Rantai molekul panjang memerangkap air supaya krim tidak cair dan titisan minyak tidak terpisah.',
  },
  {
    id: 'pelembap',
    name: 'Pelembap',
    role: 'Mengekalkan kelembapan bahan kosmetik pada kulit.',
    examples: 'Gliserin dan natrium laktat',
    polarityType: 'berkutub',
    molecularRole: 'Kumpulan -OH menarik dan memegang molekul air supaya kulit kekal lembut dan tidak kering.',
  },
  {
    id: 'pewangi',
    name: 'Pewangi',
    role: 'Memberikan aroma yang menyenangkan kepada produk.',
    examples: 'Minyak pati',
    polarityType: 'sokongan',
    molecularRole: 'Molekul aromatik kecil dan ringan mudah meruap ke udara untuk dikesan oleh hidung.',
  },
  {
    id: 'pengawet',
    name: 'Pengawet',
    role: 'Mengelakkan kerosakan kosmetik akibat bakteria atau kulat.',
    examples: 'Paraben dan formaldehid',
    polarityType: 'sokongan',
    molecularRole: 'Menghalang pembiakan mikroorganisma di dalam produk yang mengandungi air.',
  },
  {
    id: 'pewarna',
    name: 'Pewarna',
    role: 'Memberikan warna agar kosmetik lebih menarik.',
    examples: 'Ferum(III) oksida',
    polarityType: 'sokongan',
    molecularRole: 'Sebatian pigmen mineral tidak larut menyerap panjang gelombang cahaya tertentu untuk memberi warna.',
  },
];

export const BANNED_CHEMICALS: BannedChemical[] = [
  {
    id: 'merkuri',
    name: 'Merkuri',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta kosmetik secara tidak sah',
    immediateEffect: 'Kulit merengsa walaupun kelihatan cerah dalam masa singkat.',
    severeHarm: 'Kerosakan buah pinggang dan sistem saraf jika diserap ke dalam salur darah.',
    bodyTarget: 'sistem_saraf_ginjal',
    explanation:
      'Merkuri boleh menyebabkan kulit merengsa serta merosakkan buah pinggang dan sistem saraf apabila diserap ke dalam salur darah.',
    molecularMechanism:
      'Ion logam berat merkuri (Hg2+) menyekat enzim pembuat melanin (nampak putih sementara), kemudian meresap masuk ke salur darah dan mengikat kumpulan sulfur (-SH) dalam protein buah pinggang serta saraf.',
  },
  {
    id: 'hidrokuinon',
    name: 'Hidrokuinon',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta kosmetik secara tidak sah',
    immediateEffect: 'Kulit menjadi hipersensitif dan pengurangan pigmentasi.',
    severeHarm: 'Pendedahan kulit kepada sinar UV yang berbahaya akibat kehilangan melanin.',
    bodyTarget: 'melanosit_uv',
    explanation:
      'Hidrokuinon menyebabkan kulit menjadi hipersensitif dan mengurangkan pigmentasi sehingga kulit terdedah kepada sinar UV yang berbahaya.',
    molecularMechanism:
      'Molekul hidrokuinon merencatkan enzim tirosinase yang menghasilkan melanin. Tanpa pigmen melanin sebagai payung penyerap cahaya, sinaran UV terus mencederakan sel kulit.',
  },
  {
    id: 'betamethasone',
    name: 'Betamethasone valerate',
    productFoundIn: 'Dimasukkan ke dalam krim pemutih serta kosmetik secara tidak sah',
    immediateEffect: 'Kulit merengsa, menipis dan berlaku perubahan pigmentasi kulit.',
    severeHarm: 'Kerosakan lapisan pelindung kulit akibat steroid kuat tanpa pengawasan doktor.',
    bodyTarget: 'pigmentasi_epidermis',
    explanation:
      'Betamethasone valerate ialah ubat kortikosteroid yang menyebabkan kulit merengsa dan perubahan pigmentasi kulit apabila disalah guna.',
    molecularMechanism:
      'Steroid mengecutkan salur darah permukaan kulit (memberi ilusi kulit cerah sementara) sambil menipiskan epidermis dan mengganggu kawalan pigmentasi semula jadi.',
  },
  {
    id: 'tretinoin',
    name: 'Tretinoin',
    productFoundIn: 'Krim jerawat (tanpa pengawasan doktor)',
    immediateEffect: 'Kulit kemerahan, pedih dan mengelupas.',
    severeHarm: 'Keradangan dan pengelupasan melampau kerana lapisan kulit luar tertanggal terlalu pantas.',
    bodyTarget: 'lapisan_luar',
    explanation:
      'Tretinoin menyebabkan kulit kemerahan dan mengelupas apabila digunakan dalam krim jerawat tanpa kawalan doktor.',
    molecularMechanism:
      'Memaksa sel kulit membahagi dan menanggalkan sel lama terlalu cepat berbanding keupayaan lapisan pelindung luar kulit pulih semula.',
  },
];

export const POE_MYSTERIES: PoeMystery[] = [
  {
    id: 'poe1',
    title: 'Misteri 1: Mengapa Perut Sakit Selepas Aspirin, Tetapi Hati Rosak Jika Terlebih Parasetamol?',
    dailySituation:
      'Ali demam dan mempunyai sejarah sakit gastrik. Jika dia mengambil Aspirin, perutnya berisiko luka. Jika dia menukar kepada Parasetamol secara berlebihan (15 biji sehari), hatinya pula terancam.',
    questionWhy: 'Bagaimanakah perbezaan sifat molekul kedua-dua ubat ini menerangkan kesan yang berlainan pada organ berbeza?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Parasetamol lebih lemah daripada Aspirin sehingga perlu dimakan banyak biji untuk berkesan.',
        discussionNote: 'Idea biasa, tetapi tidak tepat — Parasetamol berkesan pada dos normal; bahaya berlaku apabila kapasiti penyahtoksin hati dilampaui.',
      },
      {
        id: 'h2',
        label: 'Aspirin bersifat asid dan menghakis dinding perut, manakala Parasetamol neutral tetapi membebankan hati pada dos tinggi.',
        discussionNote: 'Ramalan tepat! Mari lihat mekanisme molekulnya pada perut berbanding hati.',
      },
      {
        id: 'h3',
        label: 'Kedua-duanya sebenarnya merosakkan perut dan hati dengan cara kimia yang sama.',
        discussionNote: 'Tidak tepat — struktur kimia yang berbeza menghasilkan tindak balas yang berbeza pada tisu perut dan enzim hati.',
      },
    ],
    causalChain: {
      step1Molecule: 'Aspirin mempunyai kumpulan asid (-COOH) yang membebaskan ion H+ dan melemahkan lapisan mukus perut; Parasetamol pula neutral.',
      step2Body: 'Pada dos selamat, hati menggunakan perisai antioksidan (glutation) untuk meneutralkan Parasetamol. Melebihi 4000 mg/hari, perisai habis dan sisa toksik menyerang sel hati.',
      step3Principle: 'Struktur kimia menentukan lokasi kesan sampingan, manakala dos menentukan had keselamatan organ.',
    },
    deepChemNote: 'Kimia Organik & Biokimia: keasidan asid karboksilik (-COOH) berbanding had kinetik detoksifikasi glutation/NAPQI di hati.',
    kssmRef: 'Jadual 5.7 Analgesik (m.s. 182)',
  },
  {
    id: 'poe2',
    title: 'Misteri 2: Siti Sudah Sihat Hari ke-3 — Mengapa Doktor Tetap Arah Habiskan Antibiotik?',
    dailySituation:
      'Selepas 3 hari mengambil penisilin daripada tempoh 7 hari, demam Siti reda dan tekaknya tidak lagi sakit. Dia bercadang menyimpan baki ubat untuk kegunaan masa depan.',
    questionWhy: 'Mengapakah berhenti awal menyebabkan jangkitan berulang yang lebih sukar dirawat? Siapakah yang sebenarnya menjadi imun?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Badan Siti akan menjadi kebal dan tidak dapat menyerap ubat lagi pada masa depan.',
        discussionNote: 'Salah tanggapan paling kerap! Bukan badan manusia yang menjadi imun, sebaliknya populasi bakteria yang berubah.',
      },
      {
        id: 'h2',
        label: 'Baki bakteria yang lebih kebal terselamat pada Hari ke-3 lalu membiak menggantikan bakteria yang lemah.',
        discussionNote: 'Ramalan tepat! Inilah pemilihan semula jadi akibat kepekatan antibiotik dihentikan terlalu awal.',
      },
      {
        id: 'h3',
        label: 'Penisilin yang tidak habis akan bertukar menjadi plasebo jika dibiarkan lama.',
        discussionNote: 'Plasebo ialah bahan tanpa bahan ubat sejak awal; masalah di sini berlaku di dalam populasi bakteria tubuh.',
      },
    ],
    causalChain: {
      step1Molecule: 'Antibiotik menyerang dinding sel peptidoglikan bakteria. Pada Hari ke-3, ~80% bakteria lemah sudah mati maka simptom hilang.',
      step2Body: 'Baki ~20% bakteria yang sedikit berbeza dan lebih tahan masih hidup. Tanpa antibiotik pada Hari 4–7, bakteria tahan ini membiak semula dan menguasai badan.',
      step3Principle: 'Tempoh dos penuh mengekalkan kepekatan ubat cukup tinggi supaya tiada bakteria kebal tertinggal untuk membina rintangan.',
    },
    deepChemNote: 'Pemilihan evolusi mikrob: pengurangan kepekatan antibiotik di bawah paras perencatan minimum memihak kepada mutan rintang.',
    kssmRef: 'Jadual 5.7 Antimikrob & Gambar foto 5.10 (m.s. 182–183)',
  },
  {
    id: 'poe3',
    title: 'Misteri 3: Mengapa Minyak & Air dalam Losen Buatan Sendiri Terpisah Semula Selepas 5 Minit?',
    dailySituation:
      'Murid mengacau minyak zaitun, air mawar dan pewarna semula jadi dengan laju untuk membuat losen kulit, tetapi campuran itu segera terpisah menjadi dua lapisan.',
    questionWhy: 'Apakah daya antara molekul yang menolak minyak keluar daripada air, dan molekul jenis apakah yang boleh mendamaikannya?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Minyak lebih ringan sahaja; jika dikacau lebih lama dengan pemekat, ia akan larut dengan sendiri.',
        discussionNote: 'Ketumpatan menentukan lapisan mana di atas, tetapi sebab utama ia tidak bercampur ialah perbezaan kekutuban molekul.',
      },
      {
        id: 'h2',
        label: 'Air berkutub manakala minyak tak berkutub; molekul bertangan dua (Pengemulsi) diperlukan untuk menyatukannya.',
        discussionNote: 'Tepat sekali! Mari perhatikan bagaimana molekul amfifilik membina jambatan misel.',
      },
      {
        id: 'h3',
        label: 'Pengawet diperlukan supaya minyak tidak timbul di atas air.',
        discussionNote: 'Pengawet menghalang pembiakan kulat dan bakteria dalam produk berair, bukan menyatukan minyak dengan air.',
      },
    ],
    causalChain: {
      step1Molecule: 'Molekul air bercas separa (berkutub) dan saling menarik melalui ikatan hidrogen, menolak molekul minyak yang tidak berkutub keluar.',
      step2Body: 'Pengemulsi seperti lesitin memiliki kepala suka air (hidrofilik) dan ekor suka minyak (hidrofobik) yang membalut titisan minyak membentuk campuran homogen.',
      step3Principle: 'Prinsip "serupa melarutkan serupa" diatasi oleh molekul dwisifat (amfifilik) sebagai jambatan.',
    },
    deepChemNote: 'Kepolaran ikatan kimia & pembentukan misel koloid yang menstabilkan emulsi kosmetik.',
    kssmRef: 'Rajah 5.15 Bahan-bahan Asas Kosmetik (m.s. 185)',
  },
  {
    id: 'poe4',
    title: 'Misteri 4: Kulit Putih dalam 3 Hari — Apa Sebenarnya yang Terjadi di Bawah Lapisan Kulit?',
    dailySituation:
      'Satu krim malam tanpa nombor NOT menjanjikan kulit putih seawal 3 hari. Selepas beberapa minggu, kulit menjadi pedih di bawah matahari dan ujian kesihatan mengesan gangguan buah pinggang.',
    questionWhy: 'Bagaimana bahan terlarang dalam krim itu menipu mata pada minggu pertama sebelum merosakkan kulit dan organ dalaman?',
    hypotheses: [
      {
        id: 'h1',
        label: 'Krim itu membersihkan daki kulit sahaja dan tiada kaitan dengan buah pinggang.',
        discussionNote: 'Logam berat seperti merkuri bersaiz amat kecil dan mampu meresap menembusi kulit ke dalam salur darah.',
      },
      {
        id: 'h2',
        label: 'Bahan terlarang menyekat pigmen pelindung melanin (maka UV menyerang kulit) dan menyerap ke darah merosakkan ginjal.',
        discussionNote: 'Ramalan cemerlang! Mari susun rantaian kejadian bagi Merkuri, Hidrokuinon dan Steroid.',
      },
      {
        id: 'h3',
        label: 'Krim itu mengandungi pewarna putih seperti ferum(III) oksida yang menyaluti permukaan kulit.',
        discussionNote: 'Pewarna sah kekal di permukaan dan tidak mengakibatkan hipersensitiviti UV atau kerosakan ginjal.',
      },
    ],
    causalChain: {
      step1Molecule: 'Hidrokuinon dan merkuri menyekat enzim pembuat melanin, manakala steroid (Betamethasone) mengecutkan salur darah supaya kulit tampak pucat segera.',
      step2Body: 'Tanpa perisai melanin, sinaran UV merosakkan sel kulit hipersensitif; merkuri pula masuk ke salur darah lalu mengikat protein buah pinggang dan sistem saraf.',
      step3Principle: 'Krim kosmetik yang sah (berdaftar NOT) kekal di luar kulit; bahan kimia terlarang menembusi ke organ dalaman.',
    },
    deepChemNote: 'Perencatan enzim tirosinase (kehilangan perlindungan UV) dan ketoksikan logam berat Hg2+ terhadap kumpulan -SH protein nefron.',
    kssmRef: 'Jadual 5.8 Bahan Kimia Terlarang (m.s. 186)',
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    scenario: POE_MYSTERIES[0].dailySituation,
    question: POE_MYSTERIES[0].questionWhy,
    options: POE_MYSTERIES[0].hypotheses.map((h) => ({
      id: h.id,
      label: h.label,
      explanation: h.discussionNote,
    })),
    correctOptionId: 'h2',
    kssmRef: POE_MYSTERIES[0].kssmRef,
  },
];
