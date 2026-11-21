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
      summary: `Berhenti pada hari ke-${stopAtDay}: baki bakteria terus hidup lalu menjadi imun kepada antibiotik dan penyakit berulang semula.`,
      mechanismDetail:
        'Antibiotik tidak dihabiskan: bakteria yang terselamat menjadi imun kepada antibiotik (Jadual 5.7, m.s. 182).',
    };
  }

  return {
    points,
    finalTotal,
    resistanceRatio,
    outcome: 'sembuh_sepenuhnya',
    summary: 'Antibiotik dihabiskan: semua bakteria berjaya dibunuh atau direncatkan pertumbuhannya.',
    mechanismDetail:
      'Antibiotik perlu dihabiskan supaya semua bakteria dibunuh dan penyakit tidak berulang semula (Jadual 5.7, m.s. 182).',
  };
}

export function evaluateParacetamolDose(dailyMg: number): ParacetamolDoseResult {
  const mg = Math.max(0, Math.min(8000, Number.isFinite(dailyMg) ? dailyMg : 0));
  if (mg < 1000) {
    return {
      status: 'rendah',
      label: 'Dos rendah — ikut sukatan dan preskripsi doktor',
      liverLoadPercent: 20,
      liverSafePercent: 90,
      toxicRiskNote: 'Parasetamol melegakan sakit dalam keadaan sedar apabila diambil mengikut dos.',
    };
  }
  if (mg <= 4000) {
    return {
      status: 'terapeutik',
      label: 'Dos betul — selamat untuk hati dan melegakan sakit',
      liverLoadPercent: 40,
      liverSafePercent: 80,
      toxicRiskNote: 'Ubat adalah selamat jika diambil dengan betul mengikut preskripsi doktor.',
    };
  }
  return {
    status: 'amaran_hati',
    label: 'Melebihi dos — boleh menyebabkan kerosakan hati!',
    liverLoadPercent: 95,
    liverSafePercent: 15,
    toxicRiskNote: 'Parasetamol melebihi dos dapat menyebabkan kerosakan hati (Jadual 5.7, m.s. 182).',
  };
}

export function evaluateCosmeticEmulsion(state: EmulsionState): EmulsionEvaluation {
  const isHomogeneous = state.air && state.pengemulsi;

  let statusLabel = 'Campuran Tidak Lengkap';
  let diagnosis = 'Tambahkan Air sebagai bahan pelarut dan Pengemulsi untuk membentuk campuran homogen.';
  let molecularNote = 'Pengemulsi menyatukan air dan minyak supaya bercampur sekata (Rajah 5.15, m.s. 185).';

  if (!state.air) {
    statusLabel = 'Tiada Bahan Pelarut (Air)';
    diagnosis = 'Tambahkan Air sebagai bahan pelarut utama dalam penghasilan kosmetik.';
    molecularNote = 'Air ialah bahan pelarut asas dalam penghasilan kosmetik.';
  } else if (!state.pengemulsi) {
    statusLabel = 'Air dan Minyak Terpisah';
    diagnosis = 'Campuran tidak sekata! Tambahkan Pengemulsi untuk membentuk campuran homogen antara air dan minyak.';
    molecularNote = 'Contoh pengemulsi: lesitin dan asid stearik.';
  } else if (!state.pengawet) {
    statusLabel = 'Homogen (Tanpa Pengawet)';
    diagnosis = 'Campuran sudah sekata, tetapi tanpa Pengawet produk mudah rosak.';
    molecularNote = 'Pengawet seperti paraben dan formaldehid mengelakkan kerosakan kosmetik.';
  } else if (!state.pemekat || !state.pelembap) {
    statusLabel = 'Homogen Asas';
    diagnosis = 'Tambahkan Pemekat untuk memekatkan produk dan Pelembap untuk mengekalkan kelembapan.';
    molecularNote = 'Contoh pemekat: gliserin dan xanthan gum; pelembap: gliserin dan natrium laktat.';
  } else {
    statusLabel = 'Campuran Homogen & Lengkap';
    diagnosis = 'Kesemua tujuh bahan asas lengkap mengikut Rajah 5.15.';
    molecularNote = 'Air, pengemulsi, pemekat, pelembap, pewangi, pengawet dan pewarna saling melengkapi.';
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
        headline: 'TIDAK SESUAI — Risiko Ulser Perut',
        mechanismReason:
          'Aspirin bersifat asid dan tidak sesuai bagi pesakit gastrik atau diberi kepada kanak-kanak kerana dapat menyebabkan ulser perut.',
        textbookNote: 'Rujuk Jadual 5.7 (m.s. 182): Perlu diambil mengikut preskripsi doktor.',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan untuk Luka Luaran',
        mechanismReason: 'Aspirin ialah analgesik untuk melegakan sakit dalam keadaan sedar, bukan antiseptik luka.',
        textbookNote: 'Gunakan antiseptik untuk bahagian luar badan.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai Mengikut Preskripsi Doktor',
      mechanismReason: 'Melegakan sakit dalam keadaan sedar bagi dewasa tanpa masalah gastrik.',
      textbookNote: 'Perlu diambil mengikut preskripsi doktor.',
    };
  }

  if (drugId === 'parasetamol') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan untuk Luka Luaran',
        mechanismReason: 'Parasetamol melegakan sakit dalam keadaan sedar; luka luaran memerlukan antiseptik.',
        textbookNote: 'Parasetamol melebihi dos dapat menyebabkan kerosakan hati.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai Mengikut Dos Betul',
      mechanismReason: 'Melegakan sakit dalam keadaan sedar, namun melebihi dos dapat menyebabkan kerosakan hati.',
      textbookNote: 'Perlu diambil mengikut preskripsi doktor dan tidak melebihi dos.',
    };
  }

  if (drugId === 'antibiotik') {
    if (patient === 'alahan_penisilin') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'BAHAYA — Alahan Boleh Membawa Maut',
        mechanismReason:
          'Alahan dapat membawa maut. Pesakit dengan alahan penisilin akan diberikan Kad Alahan Ubat.',
        textbookNote: 'Maklumkan doktor sebelum menerima antibiotik.',
      };
    }
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Perlu Preskripsi Doktor',
        mechanismReason: 'Luka luaran kecil disapu antiseptik; antibiotik diambil atas arahan doktor untuk jangkitan bakteria.',
        textbookNote: 'Antibiotik perlu dihabiskan supaya semua bakteria dibunuh.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'selamat',
      headline: 'Sesuai (Perlu Dihabiskan)',
      mechanismReason:
        'Membunuh atau merencatkan pertumbuhan bakteria. Perlu dihabiskan supaya bakteria tidak menjadi imun.',
      textbookNote: 'Jika tidak dihabiskan, penyakit akan berulang semula.',
    };
  }

  if (drugId === 'antiseptik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: true,
        riskLevel: 'selamat',
        headline: 'Sesuai untuk Bahagian Luar Badan',
        mechanismReason: 'Hidrogen peroksida, iodin dan asid borik digunakan di bahagian luar badan dan tidak dimakan.',
        textbookNote: 'Hanya disapu pada bahagian luaran sahaja.',
      };
    }
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'TIDAK DIMAKAN — Kegunaan Luaran Sahaja',
      mechanismReason: 'Antiseptik hanya disapu pada bahagian luaran sahaja dan berbahaya jika dimakan.',
      textbookNote: 'Rujuk Jadual 5.7 (m.s. 182).',
    };
  }

  if (drugId === 'disinfektan') {
    return {
      suitable: false,
      riskLevel: 'bahaya',
      headline: 'BUKAN UNTUK MANUSIA — Objek Bukan Hidup Sahaja',
      mechanismReason:
        'Disinfektan (alkohol dan formaldehid) memusnahkan patogen pada objek bukan hidup seperti lantai dan sistem perparitan.',
      textbookNote: 'Tidak boleh digunakan pada tubuh manusia.',
    };
  }

  if (drugId === 'kodeina') {
    if (patient === 'kanak_kanak') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Perlu Kawalan Ketat Doktor',
        mechanismReason: 'Kodeina menyebabkan mengantuk dan berisiko ketagihan jika disalah guna.',
        textbookNote: 'Diambil mengikut preskripsi doktor sahaja.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Preskripsi Doktor — Kesan Mengantuk',
      mechanismReason: 'Melegakan sakit, rawatan batuk dan cirit birit; menyebabkan berasa mengantuk.',
      textbookNote: 'Penyalahgunaan kodeina menyebabkan ketagihan (Gambar foto 5.10).',
    };
  }

  if (drugId === 'psikotik') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Tidak Berkaitan dengan Luka',
        mechanismReason: 'Ubat psikotik (haloperidol, klorpromazin, klozapin) merawat psikosis, bukan luka kulit.',
        textbookNote: 'Diambil atas preskripsi doktor.',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Diambil atas Preskripsi Doktor',
      mechanismReason:
        'Merawat psikosis; boleh mengakibatkan pergerakan muka dan badan tidak normal, kejang dan menggeletar.',
      textbookNote: 'Hanya digunakan atas arahan doktor.',
    };
  }

  if (drugId === 'antialergi') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'berjaga',
        headline: 'Bukan untuk Luka Luaran',
        mechanismReason: 'Antihistamin melegakan hidung berair dan kegatalan, bukan merawat luka luaran.',
        textbookNote: 'Hanya boleh diambil atas preskripsi doktor.',
      };
    }
    return {
      suitable: true,
      riskLevel: 'berjaga',
      headline: 'Preskripsi Doktor Sahaja',
      mechanismReason:
        'Melegakan hidung berair dan kegatalan; mengantuk dan dos tinggi menyebabkan mulut kering (xerostomia), gangguan penglihatan dan sembelit.',
      textbookNote: 'Hanya boleh diambil atas preskripsi doktor (Jadual 5.7, m.s. 183).',
    };
  }

  if (drugId === 'kortikosteroid') {
    if (patient === 'luka_luaran') {
      return {
        suitable: false,
        riskLevel: 'bahaya',
        headline: 'Guna atas Preskripsi Doktor Sahaja',
        mechanismReason:
          'Kortikosteroid (betamethasone valerate atau prednisolone) melegakan radang, bukan membunuh kuman.',
        textbookNote: 'Hanya boleh diambil atas preskripsi doktor.',
      };
    }
    return {
      suitable: patient === 'dewasa_sihat',
      riskLevel: 'berjaga',
      headline: 'Preskripsi Doktor — Elakkan Jangka Panjang',
      mechanismReason:
        'Melegakan bengkak, kemerahan, gatal, alergi, asma dan artritis; jangka panjang menyebabkan muka sembap (moon face), tekanan darah tinggi dan kenaikan gula darah.',
      textbookNote: 'Hanya boleh diambil atas preskripsi doktor (Jadual 5.7, m.s. 183).',
    };
  }

  return {
    suitable: patient === 'dewasa_sihat',
    riskLevel: patient === 'dewasa_sihat' ? 'berjaga' : 'bahaya',
    headline: 'Memerlukan Preskripsi Doktor',
    mechanismReason: 'Ambil ubat mengikut preskripsi doktor supaya selamat dan berkesan.',
    textbookNote: 'Ubat selamat jika diambil dengan betul (m.s. 181).',
  };
}

export function validateNpraCode(rawCode: string): NpraCheckResult {
  const code = rawCode.replace(/[\s-]+/g, '').toUpperCase();
  if (/^MAL\d{8}[A-Z]{1,2}$/.test(code)) {
    return {
      validFormat: true,
      category: 'ubat_berdaftar',
      label: 'Nombor Pendaftaran Ubat NPRA (MAL)',
      guidance: 'Diselia oleh Bahagian Regulatori Farmasi Negara (NPRA) untuk kualiti dan keselamatan ubat.',
      chemicalCheckSummary: 'Ubat berdaftar (tradisional atau moden) yang memenuhi piawaian keselamatan KKM.',
    };
  }
  if (/^NOT\d{9}[A-Z]$/.test(code)) {
    return {
      validFormat: true,
      category: 'kosmetik_bernotifikasi',
      label: 'Nombor Notifikasi Kosmetik NPRA (NOT)',
      guidance: 'Kosmetik kegunaan luaran yang berdaftar dengan Bahagian Regulatori Farmasi Negara (NPRA).',
      chemicalCheckSummary: 'Kosmetik bernotifikasi di bawah Peraturan Kawalan Dadah dan Kosmetik 1984.',
    };
  }
  return {
    validFormat: false,
    category: 'tidak_sah',
    label: 'Bukan Format Rasmi MAL atau NOT',
    guidance: 'Elakkan produk tanpa pendaftaran NPRA kerana berisiko mengandungi bahan berbahaya.',
    chemicalCheckSummary: 'Tiada jaminan keselamatan atau pengesahan dos daripada pihak berkuasa.',
  };
}
