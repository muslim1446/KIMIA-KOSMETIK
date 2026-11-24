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
  hasThickener: boolean;
  hasMoisturizer: boolean;
  hasPreservative: boolean;
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
  liverSafePercent: number;
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
  textbookNote: string;
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
  const resistanceRatio =
    finalTotal > 0 ? Math.round((last.resistantBacteria / finalTotal) * 100) : 0;

  if (stopAtDay !== null && stopAtDay < 7) {
    return {
      points,
      finalTotal,
      resistanceRatio,
      outcome: 'rintangan_berulang',
      summary: 'Antibiotik tidak dihabiskan: bakteria menjadi imun kepada antibiotik, penyakit berulang semula dan memerlukan dos yang lebih tinggi untuk rawatan seterusnya.',
      mechanismDetail:
        'Antibiotik perlu dihabiskan supaya semua bakteria dibunuh. Jika tidak, bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula (Jadual 5.7, m.s. 182).',
    };
  }

  return {
    points,
    finalTotal,
    resistanceRatio,
    outcome: 'sembuh_sepenuhnya',
    summary: 'Antibiotik dihabiskan: semua bakteria dibunuh atau direncatkan pertumbuhannya.',
    mechanismDetail:
      'Antibiotik perlu dihabiskan supaya semua bakteria dibunuh. Jika tidak, bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula (Jadual 5.7, m.s. 182).',
  };
}

export function evaluateParacetamolDose(dailyMg: number): ParacetamolDoseResult {
  const mg = Math.max(0, Math.min(8000, Number.isFinite(dailyMg) ? dailyMg : 0));
  if (mg < 1000) {
    return {
      status: 'rendah',
      label: 'Dos rendah — perlu diambil mengikut preskripsi doktor.',
      liverLoadPercent: 20,
      liverSafePercent: 90,
      toxicRiskNote: 'Parasetamol melegakan sakit dalam keadaan sedar (Jadual 5.7, m.s. 182).',
    };
  }
  if (mg <= 4000) {
    return {
      status: 'terapeutik',
      label: 'Dos betul — selamat jika diambil dengan betul mengikut preskripsi doktor.',
      liverLoadPercent: 40,
      liverSafePercent: 80,
      toxicRiskNote: 'Ubat adalah selamat jika diambil dengan betul (m.s. 181).',
    };
  }
  return {
    status: 'amaran_hati',
    label: 'Melebihi dos — parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
    liverLoadPercent: 95,
    liverSafePercent: 15,
    toxicRiskNote: 'Parasetamol melebihi dos dapat menyebabkan kerosakan hati (Jadual 5.7, m.s. 182).',
  };
}

export function evaluateCosmeticEmulsion(state: EmulsionState): EmulsionEvaluation {
  const isHomogeneous = state.air && state.pengemulsi;

  let statusLabel = 'Campuran Tidak Lengkap';
  let diagnosis = 'Tambahkan Air (bahan pelarut) dan Pengemulsi untuk membentuk campuran homogen antara air dan minyak.';
  let molecularNote = 'Pengemulsi membentuk campuran homogen antara air dan minyak. Contoh: Lesitin dan asid stearik (Rajah 5.15, m.s. 185).';

  if (!state.air) {
    statusLabel = 'Tiada Air (Bahan Pelarut)';
    diagnosis = 'Tambahkan Air sebagai bahan pelarut dalam penghasilan kosmetik.';
    molecularNote = 'Air: Bahan pelarut dalam penghasilan kosmetik (Rajah 5.15).';
  } else if (!state.pengemulsi) {
    statusLabel = 'Air dan Minyak Terpisah';
    diagnosis = 'Tiada Pengemulsi — campuran antara air dan minyak tidak homogen.';
    molecularNote = 'Pengemulsi: Membentuk campuran homogen antara air dan minyak. Contoh: Lesitin dan asid stearik.';
  } else if (!state.pengawet) {
    statusLabel = 'Homogen (Tanpa Pengawet)';
    diagnosis = 'Campuran homogen, tetapi tanpa Pengawet kosmetik mudah rosak.';
    molecularNote = 'Pengawet: Mengelakkan kerosakan kosmetik. Contoh: Paraben dan formaldehid.';
  } else if (!state.pemekat || !state.pelembap) {
    statusLabel = 'Homogen Asas';
    diagnosis = 'Tambahkan Pemekat untuk memekatkan produk dan Pelembap untuk mengekalkan kelembapan bahan kosmetik.';
    molecularNote = 'Pemekat: Gliserin dan xanthan gum · Pelembap: Gliserin dan natrium laktat.';
  } else {
    statusLabel = 'Campuran Homogen & Lengkap';
    diagnosis = 'Ketujuh-tujuh bahan asas kosmetik lengkap mengikut Rajah 5.15 (m.s. 185).';
    molecularNote = 'Air, pengemulsi, pemekat, pelembap, pewangi, pengawet dan pewarna (Rajah 5.15).';
  }

  return {
    isHomogeneous,
    hasThickener: state.pemekat,
    hasMoisturizer: state.pelembap,
    hasPreservative: state.pengawet,
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
        headline: 'TIDAK SESUAI — Bersifat Asid',
        mechanismReason:
          'Aspirin bersifat asid, tidak sesuai bagi pesakit gastrik atau kanak-kanak kerana dapat menyebabkan pendarahan dalaman dan ulser perut.',
        textbookNote: 'Jadual 5.7 (m.s. 182): Diambil mengikut preskripsi doktor selepas makan.',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan Kegunaan Bahagian Luar Badan',
        mechanismReason: 'Aspirin ialah analgesik yang melegakan sakit dalam keadaan sedar; bahagian luar badan menggunakan antiseptik.',
        textbookNote: 'Jadual 5.7 (m.s. 182).',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Perlu Diambil Mengikut Preskripsi Doktor',
      mechanismReason: 'Aspirin melegakan sakit dalam keadaan sedar dan bersifat asid.',
      textbookNote: 'Jadual 5.7 (m.s. 182): Perlu diambil mengikut preskripsi doktor.',
    };
  }

  if (drugId === 'parasetamol') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan Kegunaan Bahagian Luar Badan',
        mechanismReason: 'Parasetamol ialah analgesik yang melegakan sakit dalam keadaan sedar, bukan antiseptik untuk bahagian luar badan.',
        textbookNote: 'Parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Selamat Jika Tidak Melebihi Dos',
      mechanismReason: 'Parasetamol melegakan sakit dalam keadaan sedar; pengambilan melebihi dos dapat menyebabkan kerosakan hati.',
      textbookNote: 'Jadual 5.7 (m.s. 182): Perlu diambil mengikut preskripsi doktor.',
    };
  }

  if (drugId === 'antibiotik') {
    if (patient === 'alahan_penisilin') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'BAHAYA — Alahan Penisilin',
        mechanismReason:
          'Alahan dapat membawa maut. Pesakit dengan alahan penisilin diberikan Kad Alahan Ubat sebagai pemberitahuan tentang keadaannya.',
        textbookNote: 'Jadual 5.7 (m.s. 182).',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Perlu Dihabiskan Mengikut Preskripsi',
        mechanismReason: 'Antibiotik membunuh atau merencatkan pertumbuhan bakteria; bahagian luar badan disapu antiseptik.',
        textbookNote: 'Jadual 5.7 (m.s. 182).',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Antibiotik Perlu Dihabiskan',
      mechanismReason:
        'Membunuh atau merencatkan pertumbuhan bakteria. Jika dos tidak dihabiskan, bakteria menjadi imun kepada antibiotik dan penyakit akan berulang semula.',
      textbookNote: 'Jadual 5.7 (m.s. 182).',
    };
  }

  if (drugId === 'antiseptik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: true,
        riskLevel: 'selamat',
        headline: 'Sesuai — Bahagian Luar Badan Sahaja',
        mechanismReason: 'Antiseptik seperti hidrogen peroksida, iodin dan asid borik digunakan di bahagian luar badan.',
        textbookNote: 'Hanya disapu pada bahagian luaran sahaja dan tidak dimakan.',
      };
    }
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'TIDAK DIMAKAN — Bahagian Luaran Sahaja',
      mechanismReason: 'Antiseptik hanya disapu pada bahagian luaran sahaja dan tidak dimakan.',
      textbookNote: 'Jadual 5.7 (m.s. 182).',
    };
  }

  if (drugId === 'disinfektan') {
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'OBJEK BUKAN HIDUP SAHAJA',
      mechanismReason:
        'Disinfektan seperti alkohol dan formaldehid memusnahkan patogen yang terdapat pada objek bukan hidup seperti lantai dan sistem perparitan.',
      textbookNote: 'Jadual 5.7 (m.s. 182).',
    };
  }

  if (drugId === 'kodeina') {
    if (patient === 'kanak_kanak') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Diambil Mengikut Preskripsi Doktor',
        mechanismReason: 'Kodeina melegakan sakit, rawatan batuk dan cirit birit serta menyebabkan berasa mengantuk.',
        textbookNote: 'Penyalahgunaan kodeina menyebabkan ketagihan (Gambar foto 5.10).',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Diambil Mengikut Preskripsi Doktor',
      mechanismReason: 'Melegakan sakit, rawatan batuk dan cirit birit; menyebabkan mengantuk dan ketagihan jika disalahgunakan.',
      textbookNote: 'Jadual 5.7 & Gambar foto 5.10 (m.s. 182–183).',
    };
  }

  if (drugId === 'psikotik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Bukan Kegunaan Bahagian Luaran',
        mechanismReason: 'Ubat psikotik (haloperidol, klorpromazin, klozapin) merawat psikosis atas preskripsi doktor.',
        textbookNote: 'Jadual 5.7 (m.s. 183).',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Diambil Atas Preskripsi Doktor',
      mechanismReason:
        'Merawat psikosis; mengakibatkan pergerakan muka dan badan yang tidak normal, kejang dan menggeletar.',
      textbookNote: 'Jadual 5.7 (m.s. 183).',
    };
  }

  if (drugId === 'antialergi') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan Kegunaan Bahagian Luaran',
        mechanismReason: 'Antihistamin melegakan hidung berair dan kegatalan atas preskripsi doktor.',
        textbookNote: 'Jadual 5.7 (m.s. 183).',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Hanya Atas Preskripsi Doktor',
      mechanismReason:
        'Melegakan hidung berair dan kegatalan; mengakibatkan mengantuk serta mulut terasa kering (xerostomia), gangguan penglihatan dan sembelit pada dos tinggi.',
      textbookNote: 'Jadual 5.7 (m.s. 183).',
    };
  }

  if (drugId === 'kortikosteroid') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Hanya Atas Preskripsi Doktor',
        mechanismReason:
          'Kortikosteroid (betamethasone valerate atau prednisolone) memberikan kelegaan bagi kawasan radang, bukan kegunaan antiseptik luaran.',
        textbookNote: 'Jadual 5.7 (m.s. 183).',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Hanya Atas Preskripsi Doktor',
      mechanismReason:
        'Memberikan kelegaan bagi kawasan radang, alergi, asma serta artritis; pengambilan jangka panjang menyebabkan muka sembap (moon face), tekanan darah tinggi dan meningkatkan kandungan gula darah.',
      textbookNote: 'Jadual 5.7 (m.s. 183).',
    };
  }

  return {
    suitable: patient === 'dewasa_sihat',
    riskLevel: patient === 'dewasa_sihat' ? 'berjaga' : 'bahaya',
    headline: 'Diambil Mengikut Preskripsi Doktor',
    mechanismReason: 'Ubat adalah selamat jika diambil dengan betul.',
    textbookNote: 'm.s. 181.',
  };
}

export function validateNpraCode(rawCode: string): NpraCheckResult {
  const code = rawCode.replace(/[\s-]+/g, '').toUpperCase();
  if (/^MAL\d{8}[A-Z]{1,2}$/.test(code)) {
    return {
      validFormat: true,
      category: 'ubat_berdaftar',
      label: 'Nombor Pendaftaran Ubat Berdaftar (MAL)',
      guidance: 'Bahagian Regulatori Farmasi Negara (NPRA) menyelia kualiti dan keselamatan ubat-ubatan serta kosmetik.',
      chemicalCheckSummary: 'Memenuhi format pendaftaran ubat Kementerian Kesihatan.',
    };
  }
  if (/^NOT\d{9}[A-Z]$/.test(code)) {
    return {
      validFormat: true,
      category: 'kosmetik_bernotifikasi',
      label: 'Nombor Notifikasi Kosmetik (NOT)',
      guidance: 'Kosmetik yang ingin digunakan hendaklah berdaftar dengan Bahagian Regulatori Farmasi Negara.',
      chemicalCheckSummary: 'Tertakluk kepada Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984.',
    };
  }
  return {
    validFormat: false,
    category: 'tidak_sah',
    label: 'Bukan Format Rasmi MAL atau NOT',
    guidance: 'Pastikan ubat dan kosmetik berdaftar dengan Bahagian Regulatori Farmasi Negara (NPRA).',
    chemicalCheckSummary: 'Produk tidak berdaftar berisiko mengandungi bahan kimia berbahaya secara tidak sah.',
  };
}
