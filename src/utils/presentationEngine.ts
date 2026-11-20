export interface AntibioticDayPoint {
  day: number;
  sensitiveBacteria: number;
  resistantBacteria: number;
  totalBacteria: number;
}

export interface AntibioticSimulationResult {
  points: AntibioticDayPoint[];
  finalTotal: number;
  resistanceRatio: number;
  outcome: 'sembuh_sepenuhnya' | 'rintangan_berulang';
  summary: string;
  mechanismDetail: string;
}

export interface EmulsionState {
  air: boolean;
  pengemulsi: boolean;
  pemekat: boolean;
  pelembap: boolean;
  pewangi: boolean;
  pengawet: boolean;
  pewarna: boolean;
}

export interface EmulsionEvaluation {
  isHomogeneous: boolean;
  viscosityScore: number;
  hydrationScore: number;
  shelfLifeDays: number;
  hasFragrance: boolean;
  hasColorTint: boolean;
  statusLabel: string;
  diagnosis: string;
  molecularNote: string;
}

export interface ParacetamolDoseResult {
  status: 'rendah' | 'terapeutik' | 'amaran_hati';
  label: string;
  liverLoadPercent: number;
  glutathioneShieldPercent: number;
  toxicRiskNote: string;
}

export type PatientProfileId =
  | 'dewasa_sihat'
  | 'pesakit_gastrik'
  | 'kanak_kanak'
  | 'alahan_penisilin'
  | 'luka_luaran';

export interface DrugSafetyAssessment {
  suitable: boolean;
  riskLevel: 'selamat' | 'berjaga' | 'bahaya';
  headline: string;
  mechanismReason: string;
  molecularDeepDive: string;
}

export interface NpraCheckResult {
  validFormat: boolean;
  category: 'ubat_berdaftar' | 'kosmetik_bernotifikasi' | 'tidak_sah';
  label: string;
  guidance: string;
  chemicalCheckSummary: string;
}

export function clampSlideIndex(index: number, totalSlides: number): number {
  if (totalSlides <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(totalSlides - 1, Math.trunc(index)));
}

export function formatTimerSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function simulateAntibioticCourse(stopAtDay: number | null): AntibioticSimulationResult {
  const points: AntibioticDayPoint[] = [];
  let sensitive = 92;
  let resistant = 8;

  for (let day = 0; day <= 7; day++) {
    const total = Math.round(sensitive + resistant);
    points.push({
      day,
      sensitiveBacteria: Math.round(sensitive),
      resistantBacteria: Math.round(resistant),
      totalBacteria: total,
    });

    const takingAntibiotic = stopAtDay === null || day < stopAtDay;
    if (takingAntibiotic) {
      sensitive = Math.max(0, sensitive * 0.42);
      resistant = day < 4 ? Math.max(2, resistant * 0.68) : Math.max(0, resistant * 0.35);
    } else {
      sensitive = Math.min(40, sensitive * 1.15);
      resistant = Math.min(110, resistant * 1.85 + 6);
    }
  }

  const last = points[points.length - 1];
  const finalTotal = last.totalBacteria;
  const resistanceRatio = finalTotal > 0 ? Math.round((last.resistantBacteria / finalTotal) * 100) : 0;

  if (stopAtDay !== null && stopAtDay < 7) {
    return {
      points,
      finalTotal,
      resistanceRatio,
      outcome: 'rintangan_berulang',
      summary: `Berhenti pada hari ke-${stopAtDay} membiarkan baki bakteria yang lebih kebal terus hidup dan membiak semula.`,
      mechanismDetail:
        'Bukan badan kita yang menjadi kebal. Apabila kepekatan antibiotik jatuh pada Hari ke-3, bakteria berperisai dinding sel lebih tebal terselamat lalu membiak dan mewariskan rintangan.',
    };
  }

  return {
    points,
    finalTotal,
    resistanceRatio,
    outcome: 'sembuh_sepenuhnya',
    summary: 'Tempoh 7 hari dihabiskan: kepekatan antibiotik kekal cukup tinggi untuk membunuh semua bakteria.',
    mechanismDetail:
      'Antibiotik seperti Penisilin mengganggu pembentukan dinding sel peptidoglikan bakteria sehingga bakteria lemah dan kebal turut pecah sebelum sempat membiak.',
  };
}

export function evaluateParacetamolDose(dailyMg: number): ParacetamolDoseResult {
  const mg = Math.max(0, Math.min(8000, Number.isFinite(dailyMg) ? dailyMg : 0));
  if (mg < 1000) {
    return {
      status: 'rendah',
      label: 'Dos rendah — molekul ubat terlalu sedikit untuk melegakan sakit',
      liverLoadPercent: Math.round((mg / 4000) * 30),
      glutathioneShieldPercent: 92,
      toxicRiskNote: 'Hati menguraikan bahan ubat dengan sangat mudah tanpa kehabisan perisai.',
    };
  }
  if (mg <= 4000) {
    const shield = Math.round(90 - ((mg - 1000) / 3000) * 35);
    return {
      status: 'terapeutik',
      label: 'Dos selamat — perisai hati masih cukup menyahtoksin baki ubat',
      liverLoadPercent: Math.round(25 + ((mg - 1000) / 3000) * 35),
      glutathioneShieldPercent: shield,
      toxicRiskNote: 'Molekul sisa dineutralkan oleh perisai antioksidan hati (glutation) sebelum keluar melalui air kencing.',
    };
  }
  const excessRatio = (mg - 4000) / 4000;
  return {
    status: 'amaran_hati',
    label: 'Melebihi had 4000 mg — perisai hati habis dan sel hati rosak!',
    liverLoadPercent: Math.min(100, Math.round(70 + excessRatio * 30)),
    glutathioneShieldPercent: Math.max(0, Math.round(30 - excessRatio * 30)),
    toxicRiskNote: 'Apabila glutation habis, metabolit reaktif (NAPQI) mengikat terus protein sel hati dan menyebabkan kerosakan hati.',
  };
}

export function evaluateCosmeticEmulsion(state: EmulsionState): EmulsionEvaluation {
  const isHomogeneous = state.air && state.pengemulsi;
  const viscosityScore = (state.pemekat ? 55 : 15) + (state.pengemulsi ? 25 : 0) + (state.pelembap ? 15 : 0);
  const hydrationScore = (state.air ? 35 : 0) + (state.pelembap ? 55 : 0) + (state.pengemulsi ? 10 : 0);
  const shelfLifeDays = state.pengawet ? 365 : state.air ? 5 : 30;

  let statusLabel = 'Campuran Tidak Lengkap';
  let diagnosis = 'Tambahkan Air sebagai pelarut dan Pengemulsi untuk menyatukan fasa minyak dan air.';
  let molecularNote = 'Air ialah molekul berkutub; minyak ialah rantai tak berkutub — kedua-duanya menolak satu sama lain.';

  if (!state.air) {
    statusLabel = 'Tiada Pelarut (Air)';
    diagnosis = 'Hanya terdapat fasa minyak tanpa Air sebagai pelarut utama kosmetik.';
    molecularNote = 'Tanpa molekul air berkutub, bahan larut air seperti pelembap natrium laktat tidak dapat larut sekata.';
  } else if (!state.pengemulsi) {
    statusLabel = 'Pemisahan Dua Fasa';
    diagnosis = 'Minyak terapung di atas air! Tambahkan Pengemulsi untuk membentuk campuran homogen.';
    molecularNote = 'Molekul air menarik sesama air melalui ikatan hidrogen lalu menolak molekul minyak yang tidak berkutub ke permukaan.';
  } else if (!state.pengawet) {
    statusLabel = 'Campuran Homogen (Mudah Rosak)';
    diagnosis = 'Campuran sudah sekata, tetapi tanpa Pengawet produk mudah ditumbuhi bakteria dan kulat dalam 5 hari.';
    molecularNote = 'Pengemulsi berjaya membentuk misel minyak dalam air, tetapi air bebas menjadi habitat sesuai bagi mikrob tanpa pengawet.';
  } else if (!state.pemekat || !state.pelembap) {
    statusLabel = 'Campuran Stabil Asas';
    diagnosis = 'Campuran sekata dan diawet. Tambahkan Pemekat dan Pelembap untuk mengunci air pada kulit.';
    molecularNote = 'Pemekat membentuk jaringan rantai panjang yang memperlahankan pergerakan titisan; pelembap mengikat molekul air supaya tidak cepat kering.';
  } else {
    statusLabel = 'Campuran Kosmetik Stabil & Sekata';
    diagnosis = 'Semua 7 bahan asas lengkap: pelarut air, jambatan pengemulsi, pemekat, pelembap, pewangi, pengawet dan pewarna.';
    molecularNote = 'Molekul pengemulsi (kepala hidrofilik + ekor hidrofobik) membalut setiap titisan minyak menjadi misel stabil dalam pelarut air.';
  }

  return {
    isHomogeneous,
    viscosityScore: Math.min(100, viscosityScore),
    hydrationScore: Math.min(100, hydrationScore),
    shelfLifeDays,
    hasFragrance: state.pewangi,
    hasColorTint: state.pewarna,
    statusLabel,
    diagnosis,
    molecularNote,
  };
}

export function assessDrugForPatient(drugId: string, patient: PatientProfileId): DrugSafetyAssessment {
  if (drugId === 'aspirin') {
    if (patient === 'pesakit_gastrik' || patient === 'kanak_kanak') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'DILARANG — Risiko Ulser Perut & Komplikasi',
        mechanismReason:
          'Aspirin bersifat asid dan tidak sesuai bagi pesakit gastrik atau kanak-kanak kerana boleh menghakis dinding perut hingga menyebabkan ulser perut.',
        molecularDeepDive:
          'Kumpulan asid karboksilik (-COOH) membebaskan ion H+ dan merencatkan penghasilan lapisan mukus pelindung dinding perut.',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Tidak Sesuai untuk Sapuan Luka',
        mechanismReason: 'Aspirin ialah analgesik dalaman untuk melegakan sakit, bukan antiseptik untuk membunuh kuman pada luka.',
        molecularDeepDive: 'Molekul Aspirin menyekat isyarat sakit melalui aliran darah, bukan membunuh mikrob di permukaan kulit.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai (Diambil Selepas Makan dengan Preskripsi)',
      mechanismReason: 'Melegakan sakit dalam keadaan sedar bagi orang dewasa tanpa sejarah sakit gastrik.',
      molecularDeepDive: 'Makanan bertindak sebagai penampan fizikal mengurangkan sentuhan terus sifat asid Aspirin pada dinding perut.',
    };
  }

  if (drugId === 'parasetamol') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Tidak Merawat Jangkitan Luka Luaran',
        mechanismReason: 'Parasetamol melegakan sakit secara dalaman; luka terbuka memerlukan antiseptik di permukaan kulit.',
        molecularDeepDive: 'Parasetamol menenangkan isyarat sakit di sistem saraf pusat dan tidak memusnahkan bakteria pada luka.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai Mengikut Sukatan Dos Tepat',
      mechanismReason:
        'Tidak bersifat asid seperti Aspirin maka lebih lembut pada perut, tetapi dos berlebihan boleh menyebabkan kerosakan hati.',
      molecularDeepDive: 'Molekul neutral ini mengelakkan hakisan asid perut; hati meneutralkannya dalam dos harian selamat (<= 4000 mg).',
    };
  }

  if (drugId === 'antibiotik') {
    if (patient === 'alahan_penisilin') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'AMARAN MAUT — Rujuk Kad Alahan Ubat!',
        mechanismReason:
          'Pesakit mempunyai alahan kepada Penisilin. Pengambilannya mencetuskan tindak balas alahan serius yang boleh membawa maut.',
        molecularDeepDive: 'Sistem imun tersalah anggap struktur molekul cincin beta-laktam Penisilin sebagai ancaman lalu membebaskan histamin melampau.',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan Pilihan Pertama Luka Kecil',
        mechanismReason: 'Luka luaran kecil disapu antiseptik; antibiotik hanya diambil atas preskripsi doktor bagi jangkitan bakteria.',
        molecularDeepDive: 'Penggunaan antibiotik sewenang-wenangnya tanpa jangkitan bakteria nyata mempercepatkan rintangan antibiotik.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai (Wajib Dihabiskan Sepenuhnya)',
      mechanismReason: 'Membunuh atau merencatkan pertumbuhan bakteria; perlu dihabiskan supaya bakteria tidak menjadi imun.',
      molecularDeepDive: 'Antibiotik menyasarkan struktur khas bakteria (seperti dinding peptidoglikan) tanpa merosakkan sel manusia.',
    };
  }

  if (drugId === 'antiseptik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: true,
        riskLevel: 'selamat',
        headline: 'Tepat — Antiseptik untuk Bahagian Luar Badan',
        mechanismReason: 'Hidrogen peroksida, iodin dan asid borik membunuh kuman pada luka luaran dan tidak boleh dimakan.',
        molecularDeepDive: 'Bertindak mengoksidakan dan menyahaktifkan protein mikrob di permukaan luka dalam kepekatan lembut untuk tisu kulit.',
      };
    }
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'TIDAK BOLEH DIMAKAN — Bahagian Luaran Sahaja',
      mechanismReason: 'Antiseptik hanya disapu pada bahagian luaran badan dan berbahaya jika ditelan ke dalam sistem penghadaman.',
      molecularDeepDive: 'Bahan pengoksida seperti hidrogen peroksida atau iodin boleh mencederakan sel mukosa usus jika dimakan.',
    };
  }

  if (drugId === 'disinfektan') {
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'BUKAN UNTUK MANUSIA — Objek Bukan Hidup Sahaja',
      mechanismReason:
        'Disinfektan seperti alkohol dan formaldehid memusnahkan patogen pada lantai dan sistem perparitan, bukan pada luka atau tubuh.',
      molecularDeepDive: 'Menyahaslian protein dan membran sel secara agresif tanpa memilih — membunuh kedua-dua patogen dan tisu manusia yang hidup.',
    };
  }

  if (drugId === 'kodeina') {
    if (patient === 'kanak_kanak') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'DILARANG Tanpa Arahan Pakar',
        mechanismReason: 'Kodeina menyebabkan rasa mengantuk kuat dan berisiko ketagihan serta gangguan pernafasan pada kanak-kanak.',
        molecularDeepDive: 'Molekul Kodeina mengikat reseptor opioid di sistem saraf pusat dan memperlahankan isyarat kawalan saraf.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Preskripsi Terkawal — Kesan Mengantuk & Risiko Ketagihan',
      mechanismReason: 'Melegakan sakit, batuk dan cirit-birit, namun menyebabkan mengantuk dan risiko ketagihan jika disalah guna.',
      molecularDeepDive: 'Sebahagian Kodeina ditukar dalam badan untuk menyekat isyarat sakit dan refleks batuk di otak.',
    };
  }

  if (drugId === 'psikotik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Tidak Berkaitan — Rawatan Mental Sahaja',
        mechanismReason:
          'Ubat psikotik (Haloperidol, Klorpromazin, Klozapin) merawat gejala psikosis dalam sistem saraf, bukan luka kulit.',
        molecularDeepDive: 'Berfungsi melaraskan isyarat neurotransmiter (seperti dopamina) di otak, bukan membasmi mikrob.',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Preskripsi Pakar & Pemantauan Ketat',
      mechanismReason:
        'Diambil atas preskripsi doktor bagi merawat psikosis; berisiko menyebabkan pergerakan muka dan badan tidak normal, kejang dan menggeletar.',
      molecularDeepDive: 'Penyekatan reseptor dopamina secara meluas turut menjejaskan laluan saraf pengawal pergerakan otot.',
    };
  }

  if (drugId === 'antialergi') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan Antiseptik Luka',
        mechanismReason:
          'Antihistamin melegakan hidung berair dan kegatalan, bukan membunuh bakteria pada luka terbuka.',
        molecularDeepDive: 'Menyekat reseptor histamin bagi mengurangkan tindak balas alergi, tanpa kesan antibakteria.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Melegakan Alahan (Awas Kesan Mengantuk)',
      mechanismReason:
        'Antihistamin melegakan hidung berair dan kegatalan, namun mengakibatkan mengantuk; dos tinggi menyebabkan mulut terasa kering (xerostomia), gangguan penglihatan dan sembelit.',
      molecularDeepDive: 'Antihistamin bersaing menduduki tapak pengikatan histamin supaya pembuluh darah tidak membengkak atau berair.',
    };
  }

  if (drugId === 'kortikosteroid') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Elakkan pada Luka Terbuka Tanpa Arahan Doktor',
        mechanismReason:
          'Kortikosteroid (Betamethasone valerate, Prednisolone) meredakan radang, bukan membunuh kuman.',
        molecularDeepDive: 'Penindasan tindak balas imun setempat boleh melambatkan pertahanan semula jadi kulit terhadap kuman luka.',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Preskripsi Doktor — Elakkan Guna Jangka Panjang',
      mechanismReason:
        'Meredakan bengkak, alergi, asma dan artritis; pengambilan jangka panjang menyebabkan muka sembap (moon face), tekanan darah tinggi dan kenaikan gula darah.',
      molecularDeepDive: 'Hormon steroid sintetik meniru kortisol untuk meredakan keradangan, tetapi dos berpanjangan mengganggu metabolisme garam dan glukosa.',
    };
  }

  return {
    suitable: patient === 'dewasa_sihat',
    riskLevel: patient === 'dewasa_sihat' ? 'berjaga' : 'bahaya',
    headline: 'Memerlukan Preskripsi Doktor',
    mechanismReason: 'Sentiasa rujuk doktor atau ahli farmasi sebelum mengambil ubat moden mengikut keadaan pesakit.',
    molecularDeepDive: 'Keberkesanan dan keselamatan molekul bergantung pada dos dan kondisi biologi pesakit.',
  };
}

export function validateNpraCode(rawCode: string): NpraCheckResult {
  const code = rawCode.replace(/[\s-]+/g, '').toUpperCase();
  if (/^MAL\d{8}[A-Z]{1,2}$/.test(code)) {
    return {
      validFormat: true,
      category: 'ubat_berdaftar',
      label: 'Format Nombor Pendaftaran Ubat NPRA (MAL) Sah',
      guidance: 'Menunjukkan produk ubat/tradisional melalui semakan ketulenan bahan aktif dan had bahan cemar oleh NPRA.',
      chemicalCheckSummary: 'Ubat Berdaftar: sukatan dos, kestabilan dan ketiadaan logam berat atau steroid tersembunyi disemak.',
    };
  }
  if (/^NOT\d{9}[A-Z]$/.test(code)) {
    return {
      validFormat: true,
      category: 'kosmetik_bernotifikasi',
      label: 'Format Nombor Notifikasi Kosmetik (NOT) Dikenali',
      guidance: 'Menunjukkan produk kosmetik kegunaan luaran berdaftar notifikasi dan disaring bebas bahan kimia terlarang.',
      chemicalCheckSummary: 'Kosmetik Bernotifikasi: disahkan untuk kegunaan luaran serta bebas merkuri, hidrokuinon dan tretinoin.',
    };
  }
  return {
    validFormat: false,
    category: 'tidak_sah',
    label: 'Nombor Tidak Menepati Format Rasmi NPRA',
    guidance: 'Berhati-hati dengan produk tanpa nombor MAL atau NOT kerana tiada pengesahan dos dan berisiko dicampur racun berjadual.',
    chemicalCheckSummary: 'Amaran Kimia: kandungan bahan aktif tidak diketahui dan berisiko mengandungi merkuri, steroid atau logam berat.',
  };
}
