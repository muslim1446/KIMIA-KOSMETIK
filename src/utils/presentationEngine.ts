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
  viscosityScore: number; // 0..100
  hydrationScore: number; // 0..100
  shelfLifeDays: number;
  hasFragrance: boolean;
  hasColorTint: boolean;
  statusLabel: string;
  diagnosis: string;
}

export type PatientProfileId = 'dewasa_sihat' | 'pesakit_gastrik' | 'kanak_kanak' | 'alahan_penisilin' | 'luka_luaran';

export interface DrugSafetyAssessment {
  suitable: boolean;
  riskLevel: 'selamat' | 'berjaga' | 'bahaya';
  headline: string;
  mechanismReason: string;
}

export interface NpraCheckResult {
  validFormat: boolean;
  category: 'ubat_berdaftar' | 'kosmetik_bernotifikasi' | 'tidak_sah';
  label: string;
  guidance: string;
}

/**
 * Clamp and wrap slide navigation index cleanly.
 */
export function clampSlideIndex(index: number, totalSlides: number): number {
  if (totalSlides <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(totalSlides - 1, Math.trunc(index)));
}

/**
 * Format elapsed seconds into MM:SS for Mod Pembentang timer.
 */
export function formatTimerSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Simulate 7-day bacterial load under full antibiotic course vs stopping at day 3.
 * Pure deterministic model reflecting KSSM 5.4.2 biological mechanism:
 * antibiotics eliminate sensitive bacteria first; stopping early leaves hardy mutants to rebound.
 */
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
      // Antibiotic withdrawn early: surviving resistant mutants multiply rapidly
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
      summary: `Berhenti pada hari ke-${stopAtDay} membiarkan bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula.`,
    };
  }

  return {
    points,
    finalTotal,
    resistanceRatio,
    outcome: 'sembuh_sepenuhnya',
    summary: 'Pengambilan penuh 7 hari dihabiskan: semua bakteria berjaya dibunuh supaya penyakit tidak berulang.',
  };
}

/**
 * Evaluate Paracetamol daily dose safety (KSSM: exceeding safe dose damages liver).
 */
export function evaluateParacetamolDose(dailyMg: number): {
  status: 'rendah' | 'terapeutik' | 'amaran_hati';
  label: string;
  liverLoadPercent: number;
} {
  const mg = Math.max(0, Math.min(8000, Number.isFinite(dailyMg) ? dailyMg : 0));
  if (mg < 1000) {
    return {
      status: 'rendah',
      label: 'Dos rendah (kesan melegakan sakit masih minimum)',
      liverLoadPercent: Math.round((mg / 4000) * 35),
    };
  }
  if (mg <= 4000) {
    return {
      status: 'terapeutik',
      label: 'Dos selamat (berkesan merawat tanpa merosakkan hati)',
      liverLoadPercent: Math.round(25 + ((mg - 1000) / 3000) * 35),
    };
  }
  return {
    status: 'amaran_hati',
    label: 'Melebihi dos selamat — boleh menyebabkan kerosakan hati!',
    liverLoadPercent: Math.min(100, Math.round(65 + ((mg - 4000) / 4000) * 35)),
  };
}

/**
 * Evaluate cosmetic emulsion beaker state from the 7 KSSM base ingredients.
 */
export function evaluateCosmeticEmulsion(state: EmulsionState): EmulsionEvaluation {
  const isHomogeneous = state.air && state.pengemulsi;
  const viscosityScore = (state.pemekat ? 55 : 15) + (state.pengemulsi ? 25 : 0) + (state.pelembap ? 15 : 0);
  const hydrationScore = (state.air ? 35 : 0) + (state.pelembap ? 55 : 0) + (state.pengemulsi ? 10 : 0);
  const shelfLifeDays = state.pengawet ? 365 : state.air ? 5 : 30;

  let statusLabel = 'Campuran Tidak Lengkap';
  let diagnosis = 'Tambahkan Air sebagai pelarut dan Pengemulsi untuk menyatukan fasa minyak dan air.';

  if (!state.air) {
    statusLabel = 'Tiada Pelarut (Air)';
    diagnosis = 'Hanya terdapat fasa minyak tanpa Air sebagai pelarut dalam penghasilan kosmetik.';
  } else if (!state.pengemulsi) {
    statusLabel = 'Pemisahan Dua Fasa';
    diagnosis = 'Minyak terapung di atas air! Tambahkan Pengemulsi (lesitin atau asid stearik) untuk membentuk campuran homogen.';
  } else if (!state.pengawet) {
    statusLabel = 'Campuran Homogen (Mudah Rosak)';
    diagnosis = 'Campuran sudah sekata, tetapi tanpa Pengawet (paraben atau formaldehid) produk mudah rosak akibat kulat dan bakteria.';
  } else if (!state.pemekat || !state.pelembap) {
    statusLabel = 'Campuran Stabil Asas';
    diagnosis = 'Campuran sekata dan diawet. Tambahkan Pemekat dan Pelembap untuk tekstur krim yang baik serta mengekalkan kelembapan.';
  } else {
    statusLabel = 'Campuran Kosmetik Stabil & Sekata';
    diagnosis = 'Semua bahan asas lengkap: pelarut air, campuran homogen, pemekat, pelembap, pewangi, pengawet dan pewarna.';
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
  };
}

/**
 * Assess whether a selected modern drug fits a specific patient profile based on KSSM Table 5.7 rules.
 */
export function assessDrugForPatient(drugId: string, patient: PatientProfileId): DrugSafetyAssessment {
  if (drugId === 'aspirin') {
    if (patient === 'pesakit_gastrik' || patient === 'kanak_kanak') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'DILARANG — Risiko Ulser Perut & Komplikasi',
        mechanismReason:
          'Aspirin bersifat asid. Pengambilannya oleh pesakit gastrik atau kanak-kanak menghakis mukosa perut dan boleh mencetuskan ulser perut.',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Tidak Sesuai untuk Sapuan Luka',
        mechanismReason: 'Aspirin ialah analgesik sistemik yang dimakan, bukan antiseptik untuk membunuh mikrob pada luka luaran.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai (Dengan Nasihat Pengambilan Selepas Makan)',
      mechanismReason: 'Berfungsi melegakan kesakitan dalam keadaan sedar bagi orang dewasa tanpa sejarah gastrik.',
    };
  }

  if (drugId === 'parasetamol') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Tidak Merawat Jangkitan Luka Luaran',
        mechanismReason: 'Parasetamol melegakan sakit secara dalaman, namun luka terdedah memerlukan antiseptik luaran.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai Mengikut Dos Tepat',
      mechanismReason:
        'Melegakan sakit dan demam tanpa sifat asid yang melukakan perut, asalkan tidak melebihi had dos bagi mengelakkan kerosakan hati.',
    };
  }

  if (drugId === 'antibiotik') {
    if (patient === 'alahan_penisilin') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'AMARAN MAUT — Rujuk Kad Alahan Ubat!',
        mechanismReason:
          'Pesakit mempunyai alahan kepada Penisilin. Pengambilannya boleh mencetuskan tindak balas anafilaksis yang membawa maut; doktor perlu menggantikan kelas antibiotik lain.',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan Rawatan Pertama Luka Kecil',
        mechanismReason: 'Luka luaran kecil disapu dahulu dengan antiseptik; antibiotik hanya diambil mengikut preskripsi doktor bagi jangkitan bakteria.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai (Perlu Dihabiskan Sepenuhnya)',
      mechanismReason: 'Membunuh atau merencatkan pertumbuhan bakteria; perlu dihabiskan supaya semua bakteria dibunuh dan penyakit tidak berulang semula.',
    };
  }

  if (drugId === 'antiseptik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: true,
        riskLevel: 'selamat',
        headline: 'Tepat — Antiseptik untuk Bahagian Luar Badan',
        mechanismReason: 'Hidrogen peroksida, iodin dan asid borik digunakan pada bahagian luar badan untuk luka luaran sahaja dan tidak boleh dimakan.',
      };
    }
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'TIDAK BOLEH DIMAKAN — Kegunaan Luaran Sahaja',
      mechanismReason: 'Antiseptik hanya disapu pada bahagian luaran badan sahaja dan tidak dimakan.',
    };
  }

  if (drugId === 'disinfektan') {
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'BUKAN UNTUK MANUSIA — Objek Bukan Hidup Sahaja',
      mechanismReason:
        'Disinfektan seperti alkohol dan formaldehid memusnahkan patogen pada objek bukan hidup seperti lantai dan sistem perparitan, bukan pada tisu manusia.',
    };
  }

  if (drugId === 'kodeina') {
    if (patient === 'kanak_kanak') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Tidak Sesuai Tanpa Pengawasan Pakar',
        mechanismReason: 'Kodeina menyebabkan mengantuk melampau dan berisiko penindasan pernafasan serta ketagihan.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Preskripsi Terkawal — Awas Kesan Mengantuk',
      mechanismReason: 'Berkesan untuk sakit kuat, batuk dan cirit-birit, tetapi dilarang memandu atau menyalahgunakannya.',
    };
  }

  if (drugId === 'psikotik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Tidak Berkaitan — Rawatan Mental Sahaja',
        mechanismReason:
          'Ubat psikotik (Haloperidol, Klorpromazin, Klozapin) merawat psikosis di dalam sistem saraf, bukan luka fizikal pada kulit.',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Preskripsi Pakar & Pemantauan Ketat',
      mechanismReason:
        'Hanya diambil dengan preskripsi doktor bagi pesakit psikosis; berisiko menyebabkan pergerakan muka atau badan tidak normal, kejang dan menggeletar.',
    };
  }

  if (drugId === 'antialergi') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan Antiseptik Luka',
        mechanismReason:
          'Antihistamin melegakan tindak balas alahan (hidung berair dan gatal), tetapi tidak membunuh bakteria pada luka terbuka.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Melegakan Alahan (Awas Kesan Mengantuk)',
      mechanismReason:
        'Antihistamin melegakan hidung berair dan kegatalan, namun mengakibatkan mengantuk; dos tinggi pula menyebabkan mulut terasa kering (xerostomia), gangguan penglihatan dan sembelit.',
    };
  }

  if (drugId === 'kortikosteroid') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Elakkan pada Luka Terbuka Tanpa Arahan Doktor',
        mechanismReason:
          'Kortikosteroid (Betamethasone valerate, Prednisolone) meredakan keradangan, bukan membunuh kuman; penggunaan pada luka terjangkit boleh melambatkan penyembuhan.',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Preskripsi Doktor — Elakkan Guna Jangka Panjang',
      mechanismReason:
        'Meredakan radang, bengkak, asma dan artritis dengan berkesan, tetapi penggunaan berpanjangan menyebabkan muka sembap (moon face), tekanan darah tinggi dan kenaikan gula darah.',
    };
  }

  return {
    suitable: patient === 'dewasa_sihat',
    riskLevel: patient === 'dewasa_sihat' ? 'berjaga' : 'bahaya',
    headline: 'Memerlukan Preskripsi Doktor',
    mechanismReason: 'Sentiasa rujuk doktor atau ahli farmasi sebelum mengambil ubat moden mengikut keadaan pesakit.',
  };
}

/**
 * Validate Malaysian NPRA registration codes: MAL (drugs/traditional) vs NOT (cosmetics).
 */
export function validateNpraCode(rawCode: string): NpraCheckResult {
  const code = rawCode.replace(/[\s-]+/g, '').toUpperCase();
  if (/^MAL\d{8}[A-Z]{1,2}$/.test(code)) {
    return {
      validFormat: true,
      category: 'ubat_berdaftar',
      label: 'Format Nombor Pendaftaran Ubat NPRA (MAL) Sah',
      guidance: 'Kod MAL menunjukkan produk ubat atau tradisional berdaftar telah dinilai keselamatan dan kualitinya oleh Bahagian Regulatori Farmasi Negara (NPRA).',
    };
  }
  if (/^NOT\d{9}[A-Z]$/.test(code)) {
    return {
      validFormat: true,
      category: 'kosmetik_bernotifikasi',
      label: 'Format Nombor Notifikasi Kosmetik NPRA (NOT) Sah',
      guidance: 'Kod NOT menunjukkan bahan kosmetik bernotifikasi di bawah Peraturan Kawalan Dadah dan Kosmetik 1984 (untuk kegunaan luaran sahaja).',
    };
  }
  return {
    validFormat: false,
    category: 'tidak_sah',
    label: 'Nombor Tidak Menepati Format Rasmi NPRA',
    guidance: 'Berhati-hati dengan produk tanpa nombor MAL (ubat) atau NOT (kosmetik) yang sah kerana berisiko mengandungi bahan terlarang atau tiada kajian klinikal.',
  };
}
