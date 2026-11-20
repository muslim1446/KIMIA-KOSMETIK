from pathlib import Path

ROOT = Path(r"C:\Users\SCSM11\Downloads\KIMIA-KOSMETIK")
if not ROOT.exists():
    ROOT = Path.cwd()

FILES = {
    "src/utils/presentationEngine.ts": r"""export interface AntibioticDayPoint {
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
      chemicalCheckSummary: 'Ubat Berdaftar: sukatan dos, kestabilan dan ketiadaan logam berat/steroid tersembunyi disemak.',
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
""",
    "src/utils/presentationEngine.test.ts": r"""import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assessDrugForPatient,
  clampSlideIndex,
  evaluateCosmeticEmulsion,
  evaluateParacetamolDose,
  formatTimerSeconds,
  simulateAntibioticCourse,
  validateNpraCode,
} from './presentationEngine.ts';

test('clampSlideIndex keeps index within valid slide bounds', () => {
  assert.equal(clampSlideIndex(-3, 9), 0);
  assert.equal(clampSlideIndex(4, 9), 4);
  assert.equal(clampSlideIndex(99, 9), 8);
  assert.equal(clampSlideIndex(Number.NaN, 9), 0);
});

test('formatTimerSeconds formats elapsed seconds cleanly as MM:SS', () => {
  assert.equal(formatTimerSeconds(0), '00:00');
  assert.equal(formatTimerSeconds(65), '01:05');
  assert.equal(formatTimerSeconds(605), '10:05');
});

test('simulateAntibioticCourse differentiates full 7-day cure from stopping at day 3', () => {
  const fullCourse = simulateAntibioticCourse(null);
  assert.equal(fullCourse.outcome, 'sembuh_sepenuhnya');
  assert.equal(fullCourse.points.length, 8);
  assert.ok(fullCourse.finalTotal <= 5);
  assert.match(fullCourse.mechanismDetail, /peptidoglikan/i);

  const stoppedEarly = simulateAntibioticCourse(3);
  assert.equal(stoppedEarly.outcome, 'rintangan_berulang');
  assert.ok(stoppedEarly.finalTotal > 40);
  assert.ok(stoppedEarly.resistanceRatio >= 70);
});

test('evaluateParacetamolDose flags hepatotoxicity risk and glutathione depletion above 4000 mg/day', () => {
  const safe = evaluateParacetamolDose(2000);
  assert.equal(safe.status, 'terapeutik');
  assert.ok(safe.glutathioneShieldPercent > 60);

  const overdose = evaluateParacetamolDose(6000);
  assert.equal(overdose.status, 'amaran_hati');
  assert.ok(overdose.liverLoadPercent > 80);
  assert.ok(overdose.glutathioneShieldPercent < 25);
});

test('evaluateCosmeticEmulsion detects phase separation without pengemulsi and mold risk without pengawet', () => {
  const separated = evaluateCosmeticEmulsion({
    air: true,
    pengemulsi: false,
    pemekat: true,
    pelembap: true,
    pewangi: false,
    pengawet: true,
    pewarna: false,
  });
  assert.equal(separated.isHomogeneous, false);
  assert.match(separated.statusLabel, /Pemisahan Dua Fasa/);
  assert.match(separated.molecularNote, /ikatan hidrogen/i);

  const fullStable = evaluateCosmeticEmulsion({
    air: true,
    pengemulsi: true,
    pemekat: true,
    pelembap: true,
    pewangi: true,
    pengawet: true,
    pewarna: true,
  });
  assert.equal(fullStable.isHomogeneous, true);
  assert.equal(fullStable.shelfLifeDays, 365);
  assert.match(fullStable.statusLabel, /Stabil/);
});

test('assessDrugForPatient enforces KSSM Table 5.7 safety rules', () => {
  const aspirinGastric = assessDrugForPatient('aspirin', 'pesakit_gastrik');
  assert.equal(aspirinGastric.suitable, false);
  assert.equal(aspirinGastric.riskLevel, 'bahaya');

  const penicillinAllergy = assessDrugForPatient('antibiotik', 'alahan_penisilin');
  assert.equal(penicillinAllergy.suitable, false);
  assert.equal(penicillinAllergy.riskLevel, 'bahaya');

  const disinfectantHuman = assessDrugForPatient('disinfektan', 'luka_luaran');
  assert.equal(disinfectantHuman.suitable, false);

  const antisepticWound = assessDrugForPatient('antiseptik', 'luka_luaran');
  assert.equal(antisepticWound.suitable, true);

  const steroidWound = assessDrugForPatient('kortikosteroid', 'luka_luaran');
  assert.equal(steroidWound.suitable, false);
  assert.match(steroidWound.mechanismReason, /Kortikosteroid/);

  const allergyAdult = assessDrugForPatient('antialergi', 'dewasa_sihat');
  assert.equal(allergyAdult.suitable, true);
  assert.match(allergyAdult.mechanismReason, /Antihistamin/);

  const psychoticWound = assessDrugForPatient('psikotik', 'luka_luaran');
  assert.equal(psychoticWound.suitable, false);
  assert.match(psychoticWound.mechanismReason, /Ubat psikotik/);
});

test('validateNpraCode distinguishes MAL drug codes, NOT cosmetic codes, and invalid entries', () => {
  assert.equal(validateNpraCode('MAL19981234X').category, 'ubat_berdaftar');
  assert.equal(validateNpraCode('MAL 1998 1234 X').category, 'ubat_berdaftar');
  assert.equal(validateNpraCode('NOT230501234K').category, 'kosmetik_bernotifikasi');
  assert.equal(validateNpraCode('KILANG-PUTIH-99').category, 'tidak_sah');
});
""",
    "src/data/slidesData.ts": r"""export type PresenterId = 1 | 2 | 3 | 4;

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
""",
    "src/hooks/usePresentationSync.ts": r"""import { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDES_META } from '../data/slidesData';
import { clampSlideIndex, EmulsionState, PatientProfileId } from '../utils/presentationEngine';

export type AppViewMode = 'stage' | 'pembentang' | 'audiens';

export interface LaserPoint {
  active: boolean;
  x: number;
  y: number;
}

export interface SharedSlideInteractions {
  molecularLens: boolean;
  coverCompareId: 'ubat' | 'kosmetik' | 'terlarang';
  herbId: 'halia' | 'lidah_buaya' | 'ginseng' | 'asam_jawa';
  herbPrep: 'lesung' | 'rebusan' | 'kapsul';
  ketumOpen: boolean;
  drugCategoryId: 'analgesik' | 'antimikrob' | 'psikotik' | 'antialergi' | 'kortikosteroid';
  selectedDrugId: string;
  selectedPatient: PatientProfileId;
  antibioticMode: 'full' | 'stop3';
  antibioticDay: number;
  paracetamolMg: number;
  placeboTab: 'antibiotik' | 'parasetamol' | 'plasebo';
  misuseCaseIndex: number;
  npraInput: string;
  cosmeticSortCategory: 'all' | 'rias' | 'perawatan' | 'pewangi';
  selectedCosmeticItemId: string;
  emulsion: EmulsionState;
  cosmeticCompareTab: 'buatan_sendiri' | 'komersial_haram';
  bannedChemicalId: 'merkuri' | 'hidrokuinon' | 'betamethasone' | 'tretinoin';
  quizIndex: number;
  quizSelectedOption: string | null;
  poeRevealed: boolean;
}

export interface SyncedPresentationState {
  slideIndex: number;
  blackout: boolean;
  projectorDark: boolean;
  laser: LaserPoint;
  interactions: SharedSlideInteractions;
  updatedAt: number;
  senderId: string;
}

export interface DisplayEnvironmentInfo {
  isExtended: boolean;
  screenCount: number | null;
  screenLabel: string;
  permissionState: 'idle' | 'granted' | 'unsupported';
}

const CHANNEL_NAME = 'kimia-5-4-sync-v2';
const STORAGE_KEY = 'kimia-5-4-shared-state-v2';

export const DEFAULT_INTERACTIONS: SharedSlideInteractions = {
  molecularLens: false,
  coverCompareId: 'ubat',
  herbId: 'halia',
  herbPrep: 'lesung',
  ketumOpen: false,
  drugCategoryId: 'analgesik',
  selectedDrugId: 'aspirin',
  selectedPatient: 'pesakit_gastrik',
  antibioticMode: 'stop3',
  antibioticDay: 7,
  paracetamolMg: 2000,
  placeboTab: 'antibiotik',
  misuseCaseIndex: 0,
  npraInput: 'MAL19981234X',
  cosmeticSortCategory: 'all',
  selectedCosmeticItemId: 'gincu',
  emulsion: {
    air: true,
    pengemulsi: false,
    pemekat: false,
    pelembap: true,
    pewangi: false,
    pengawet: true,
    pewarna: false,
  },
  cosmeticCompareTab: 'buatan_sendiri',
  bannedChemicalId: 'merkuri',
  quizIndex: 0,
  quizSelectedOption: null,
  poeRevealed: false,
};

function createInitialState(senderId: string): SyncedPresentationState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SyncedPresentationState>;
        if (typeof parsed.slideIndex === 'number' && parsed.interactions) {
          return {
            slideIndex: clampSlideIndex(parsed.slideIndex, SLIDES_META.length),
            blackout: Boolean(parsed.blackout),
            projectorDark: Boolean(parsed.projectorDark),
            laser: parsed.laser ?? { active: false, x: 50, y: 50 },
            interactions: { ...DEFAULT_INTERACTIONS, ...parsed.interactions },
            updatedAt: parsed.updatedAt ?? Date.now(),
            senderId,
          };
        }
      }
    } catch {
    }
  }

  return {
    slideIndex: 0,
    blackout: false,
    projectorDark: false,
    laser: { active: false, x: 50, y: 50 },
    interactions: DEFAULT_INTERACTIONS,
    updatedAt: Date.now(),
    senderId,
  };
}

export function getInitialModeFromUrl(): AppViewMode {
  if (typeof window === 'undefined') return 'stage';
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  if (modeParam === 'audiens') return 'audiens';
  if (modeParam === 'pembentang') return 'pembentang';
  return 'stage';
}

export function usePresentationSync() {
  const senderIdRef = useRef<string>(`tab-${Math.random().toString(36).slice(2, 9)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const [mode, setMode] = useState<AppViewMode>(() => getInitialModeFromUrl());
  const [state, setState] = useState<SyncedPresentationState>(() => createInitialState(senderIdRef.current));
  const [connectedPeers, setConnectedPeers] = useState<number>(0);

  const [displayInfo, setDisplayInfo] = useState<DisplayEnvironmentInfo>(() => {
    const ext =
      typeof window !== 'undefined' &&
      Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
    return {
      isExtended: ext,
      screenCount: ext ? 2 : 1,
      screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Paparan Tunggal',
      permissionState: 'idle',
    };
  });

  const broadcastState = useCallback((next: SyncedPresentationState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
    }
    try {
      channelRef.current?.postMessage({ type: 'SYNC_STATE', payload: next });
    } catch {
    }
  }, []);

  const updateSharedState = useCallback(
    (updater: (prev: SyncedPresentationState) => SyncedPresentationState) => {
      setState((prev) => {
        const nextDraft = updater(prev);
        const next: SyncedPresentationState = {
          ...nextDraft,
          slideIndex: clampSlideIndex(nextDraft.slideIndex, SLIDES_META.length),
          updatedAt: Date.now(),
          senderId: senderIdRef.current,
        };
        broadcastState(next);
        return next;
      });
    },
    [broadcastState],
  );

  const patchInteractions = useCallback(
    (partial: Partial<SharedSlideInteractions>) => {
      updateSharedState((prev) => ({
        ...prev,
        interactions: {
          ...prev.interactions,
          ...partial,
        },
      }));
    },
    [updateSharedState],
  );

  const goToSlide = useCallback(
    (targetIndex: number) => {
      updateSharedState((prev) => ({
        ...prev,
        slideIndex: clampSlideIndex(targetIndex, SLIDES_META.length),
      }));
    },
    [updateSharedState],
  );

  const nextSlide = useCallback(() => {
    updateSharedState((prev) => ({
      ...prev,
      slideIndex: clampSlideIndex(prev.slideIndex + 1, SLIDES_META.length),
    }));
  }, [updateSharedState]);

  const prevSlide = useCallback(() => {
    updateSharedState((prev) => ({
      ...prev,
      slideIndex: clampSlideIndex(prev.slideIndex - 1, SLIDES_META.length),
    }));
  }, [updateSharedState]);

  const toggleBlackout = useCallback(() => {
    updateSharedState((prev) => ({ ...prev, blackout: !prev.blackout }));
  }, [updateSharedState]);

  const toggleProjectorDark = useCallback(() => {
    updateSharedState((prev) => ({ ...prev, projectorDark: !prev.projectorDark }));
  }, [updateSharedState]);

  const setLaserPoint = useCallback(
    (laser: LaserPoint) => {
      updateSharedState((prev) => ({ ...prev, laser }));
    },
    [updateSharedState],
  );

  const resetPresentation = useCallback(() => {
    updateSharedState(() => ({
      slideIndex: 0,
      blackout: false,
      projectorDark: false,
      laser: { active: false, x: 50, y: 50 },
      interactions: DEFAULT_INTERACTIONS,
      updatedAt: Date.now(),
      senderId: senderIdRef.current,
    }));
  }, [updateSharedState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleIncoming = (incoming: SyncedPresentationState) => {
      if (!incoming || incoming.senderId === senderIdRef.current) return;
      setState((prev) => {
        if (incoming.updatedAt < prev.updatedAt) return prev;
        return incoming;
      });
    };

    const peers = new Set<string>();
    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = bc;
      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg) return;
        if (msg.type === 'SYNC_STATE') {
          handleIncoming(msg.payload);
        } else if (msg.type === 'PING' && msg.senderId !== senderIdRef.current) {
          peers.add(msg.senderId);
          setConnectedPeers(peers.size);
          bc?.postMessage({ type: 'PONG', senderId: senderIdRef.current });
        } else if (msg.type === 'PONG' && msg.senderId !== senderIdRef.current) {
          peers.add(msg.senderId);
          setConnectedPeers(peers.size);
        } else if (msg.type === 'BYE' && msg.senderId) {
          peers.delete(msg.senderId);
          setConnectedPeers(peers.size);
        }
      };
      bc.postMessage({ type: 'PING', senderId: senderIdRef.current });
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          handleIncoming(JSON.parse(e.newValue));
        } catch {
        }
      }
    };
    window.addEventListener('storage', onStorage);

    const onUnload = () => {
      try {
        bc?.postMessage({ type: 'BYE', senderId: senderIdRef.current });
      } catch {
      }
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      onUnload();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('beforeunload', onUnload);
      bc?.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkExtended = () => {
      const ext = Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
      setDisplayInfo((prev) => {
        if (prev.permissionState === 'granted') return prev;
        return {
          ...prev,
          isExtended: ext,
          screenCount: ext ? 2 : 1,
          screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Paparan Tunggal',
        };
      });
    };
    checkExtended();
    const interval = window.setInterval(checkExtended, 2500);
    window.addEventListener('resize', checkExtended);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', checkExtended);
    };
  }, []);

  const probeExternalDisplays = useCallback(async () => {
    const win = window as Window & {
      getScreenDetails?: () => Promise<{ screens: Array<{ label?: string; isPrimary?: boolean }> }>;
    };
    if (typeof win.getScreenDetails !== 'function') {
      const ext = Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
      setDisplayInfo({
        isExtended: ext,
        screenCount: ext ? 2 : 1,
        screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Mod Sambungan HDMI Manual Sedia',
        permissionState: 'unsupported',
      });
      return;
    }
    try {
      const details = await win.getScreenDetails();
      const count = details.screens.length;
      const ext = count > 1;
      const secondary = details.screens.find((s) => !s.isPrimary);
      setDisplayInfo({
        isExtended: ext,
        screenCount: count,
        screenLabel: ext
          ? `HDMI Aktif: ${secondary?.label || 'Projektor / TV'} (${count} skrin)`
          : '1 Skrin Dikesan — Sambung kabel HDMI & pilih Extend Display',
        permissionState: 'granted',
      });
    } catch {
      const ext = Boolean((window.screen as Screen & { isExtended?: boolean }).isExtended);
      setDisplayInfo({
        isExtended: ext,
        screenCount: ext ? 2 : 1,
        screenLabel: ext ? 'Paparan Luaran / HDMI Dikesan' : 'Paparan Tunggal',
        permissionState: 'idle',
      });
    }
  }, []);

  return {
    mode,
    setMode,
    state,
    connectedPeers,
    displayInfo,
    probeExternalDisplays,
    goToSlide,
    nextSlide,
    prevSlide,
    toggleBlackout,
    toggleProjectorDark,
    setLaserPoint,
    patchInteractions,
    resetPresentation,
  };
}
""",
    "src/components/PresenterConsole.tsx": r"""import React, { useEffect, useState } from 'react';
import {
  Atom,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  ExternalLink,
  EyeOff,
  Lightbulb,
  MonitorCheck,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Tv2,
} from 'lucide-react';
import { SLIDES_META, TEAM_PRESENTERS } from '../data/slidesData';
import {
  DisplayEnvironmentInfo,
  LaserPoint,
  SharedSlideInteractions,
} from '../hooks/usePresentationSync';
import { formatTimerSeconds } from '../utils/presentationEngine';
import { SlideStageContent } from './SlideStageContent';

interface PresenterConsoleProps {
  slideIndex: number;
  blackout: boolean;
  projectorDark: boolean;
  laser: LaserPoint;
  interactions: SharedSlideInteractions;
  connectedPeers: number;
  displayInfo: DisplayEnvironmentInfo;
  onProbeDisplays: () => void;
  onGoToSlide: (idx: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleBlackout: () => void;
  onToggleProjectorDark: () => void;
  onSetLaser: (laser: LaserPoint) => void;
  onPatchInteractions: (partial: Partial<SharedSlideInteractions>) => void;
  onResetAll: () => void;
  onExitPresenterMode: () => void;
}

export const PresenterConsole: React.FC<PresenterConsoleProps> = ({
  slideIndex,
  blackout,
  projectorDark,
  laser,
  interactions,
  connectedPeers,
  displayInfo,
  onProbeDisplays,
  onGoToSlide,
  onNext,
  onPrev,
  onToggleBlackout,
  onToggleProjectorDark,
  onSetLaser,
  onPatchInteractions,
  onResetAll,
  onExitPresenterMode,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [laserArmed, setLaserArmed] = useState(false);
  const mirrorBoxRef = React.useRef<HTMLDivElement | null>(null);
  const [mirrorScale, setMirrorScale] = useState(0.54);

  useEffect(() => {
    const el = mirrorBoxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateScale = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setMirrorScale(Math.min(width / 1280, height / 720));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  const currentMeta = SLIDES_META[slideIndex] ?? SLIDES_META[0];
  const nextMeta = SLIDES_META[slideIndex + 1] ?? null;

  const handleMirrorPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!laserArmed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onSetLaser({ active: true, x, y });
  };

  const handleMirrorPointerLeave = () => {
    if (laser.active) {
      onSetLaser({ ...laser, active: false });
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F3EFE8] text-stone-900 flex flex-col select-none">
      <header className="border-b border-stone-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-800">Mod Pembentang · Kimia Tingkatan 5</div>
            <div className="text-base font-bold text-stone-900">
              Slaid {slideIndex + 1} daripada {SLIDES_META.length} — {currentMeta.presenterLabel}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-stone-200 pl-4 text-xs">
            <MonitorCheck
              className={`w-4 h-4 ${displayInfo.isExtended ? 'text-emerald-700' : 'text-amber-600'}`}
            />
            <span className="text-stone-700 font-medium">{displayInfo.screenLabel}</span>
            <button
              type="button"
              onClick={onProbeDisplays}
              className="px-2.5 py-1 rounded-md border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 cursor-pointer"
            >
              Kesan Skrin HDMI
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-stone-200 bg-stone-50 rounded-lg px-3 py-1.5">
            <span className="tabular-nums-clean text-sm font-bold text-stone-900">
              {formatTimerSeconds(elapsedSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              aria-label={timerRunning ? 'Jeda pemasa' : 'Sambung pemasa'}
              className="text-stone-600 hover:text-stone-900 cursor-pointer"
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setElapsedSeconds(0)}
              aria-label="Set semula pemasa"
              className="text-stone-500 hover:text-stone-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onPatchInteractions({ molecularLens: !interactions.molecularLens })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              interactions.molecularLens
                ? 'border-indigo-700 bg-indigo-50 text-indigo-800'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Zum Biokimia</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextArmed = !laserArmed;
              setLaserArmed(nextArmed);
              if (!nextArmed) onSetLaser({ ...laser, active: false });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              laserArmed
                ? 'border-red-600 bg-red-50 text-red-700'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Laser</span>
          </button>

          <button
            type="button"
            onClick={onToggleBlackout}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
              blackout
                ? 'border-amber-600 bg-amber-50 text-amber-800'
                : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Gelapkan (B)</span>
          </button>

          <button
            type="button"
            onClick={onToggleProjectorDark}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
          >
            {projectorDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{projectorDark ? 'Latar Cerah' : 'Latar Gelap'}</span>
          </button>

          <a
            href="?mode=audiens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white"
          >
            <Tv2 className="w-3.5 h-3.5" />
            <span>Buka Paparan Projektor</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onExitPresenterMode}
            className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 cursor-pointer"
          >
            Tutup (P)
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 p-4">
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-semibold">
              Paparan Audiens {connectedPeers > 0 ? `(${connectedPeers} skrin projektor bersambung)` : '(Sedia disambung ke projektor)'}
            </span>
            <span>
              {laserArmed
                ? 'Gerakkan tetikus pada slaid di bawah untuk menggerakkan laser di skrin projektor.'
                : 'Klik terus butang di dalam pratonton untuk mengawal slaid secara langsung.'}
            </span>
          </div>

          <div
            ref={mirrorBoxRef}
            onMouseMove={handleMirrorPointerMove}
            onMouseLeave={handleMirrorPointerLeave}
            className={`relative flex-1 min-h-0 rounded-2xl border-2 overflow-hidden bg-stone-200/70 flex items-center justify-center ${
              blackout ? 'border-amber-600' : 'border-stone-300'
            }`}
          >
            <div
              className="relative overflow-hidden rounded-lg shadow-md shrink-0"
              style={{
                width: `${1280 * mirrorScale}px`,
                height: `${720 * mirrorScale}px`,
              }}
            >
              <SlideStageContent
                slideIndex={slideIndex}
                interactions={interactions}
                onPatch={onPatchInteractions}
                projectorDark={projectorDark}
              />
            </div>

            {laser.active && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-600 ring-2 ring-white"
                style={{ left: `${laser.x}%`, top: `${laser.y}%` }}
              />
            )}

            {blackout && (
              <div className="pointer-events-none absolute inset-0 bg-stone-950/75 flex items-center justify-center">
                <span className="text-sm font-semibold text-white bg-stone-900 border border-stone-700 px-4 py-2 rounded-lg">
                  Skrin projektor digelapkan sementara (tekan B untuk buka semula)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2 shrink-0">
            <button
              type="button"
              onClick={onPrev}
              disabled={slideIndex === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-35 text-xs font-semibold text-stone-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelum</span>
            </button>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {SLIDES_META.map((s) => (
                <button
                  key={s.index}
                  type="button"
                  onClick={() => onGoToSlide(s.index)}
                  title={s.title}
                  className={`px-2 py-1 rounded-md tabular-nums-clean text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                    s.index === slideIndex
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {s.index + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onResetAll}
                className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50 whitespace-nowrap cursor-pointer"
              >
                Set Semula
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={slideIndex === SLIDES_META.length - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-35 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
              >
                <span>Seterusnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          <div className="border border-stone-200 bg-white rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold text-amber-800">{currentMeta.presenterLabel}</span>
              <span>Cadangan masa: {Math.round(currentMeta.durationSeconds / 60)} minit</span>
            </div>
            <h2 className="font-display text-xl font-bold text-stone-900">{currentMeta.title}</h2>
            <div className="text-xs text-stone-500">{currentMeta.textbookRef}</div>
            <div className="flex flex-wrap gap-3 pt-1 text-xs text-stone-700">
              {currentMeta.presenters.map((pid) => (
                <span key={pid}>
                  <strong>{TEAM_PRESENTERS[pid].name}:</strong> {TEAM_PRESENTERS[pid].focus}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-emerald-200 bg-emerald-50/70 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Lightbulb className="w-4 h-4" />
              <span>Analogi Feynman (Mudah Difahami Semua Pelajar)</span>
            </div>
            <p className="text-sm text-stone-900 leading-relaxed">{currentMeta.presenterNotes.feynmanAnalogy}</p>
          </div>

          <div className="border border-stone-200 bg-white rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-stone-700">Langkah Penyampaian Pembentang</div>
            <ol className="space-y-2 text-sm text-stone-800 leading-relaxed list-decimal list-inside">
              {currentMeta.presenterNotes.talkingPoints.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          </div>

          <div className="border border-amber-200 bg-amber-50/70 rounded-2xl p-4 space-y-3">
            <div>
              <div className="text-xs font-bold text-amber-900">Soalan Mendorong Pemikiran Kelas</div>
              <p className="text-sm text-stone-800 mt-1 leading-relaxed">
                {currentMeta.presenterNotes.questionForClass}
              </p>
            </div>
            <div className="pt-2.5 border-t border-amber-200/80">
              <div className="text-xs font-bold text-stone-800">Nota Pedagogi</div>
              <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                {currentMeta.presenterNotes.reminder}
              </p>
            </div>
          </div>

          {nextMeta && (
            <div className="border border-stone-200 bg-white rounded-2xl p-3.5">
              <div className="text-xs text-stone-500">Slaid Seterusnya ({nextMeta.presenterLabel})</div>
              <div className="text-sm font-bold text-stone-900 mt-0.5">{nextMeta.title}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide01Cover.tsx": r"""import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Sparkles, Stethoscope } from 'lucide-react';
import { TEAM_PRESENTERS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide01Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const COMPARE_CASES: Record<
  SharedSlideInteractions['coverCompareId'],
  {
    title: string;
    moleculeExample: string;
    mechanism: string;
    verdict: string;
  }
> = {
  ubat: {
    title: '1. Ubat: Sukatan Tepat Menuju Sasaran',
    moleculeExample: 'Contoh: Betamethasone valerate (preskripsi doktor), Parasetamol',
    mechanism:
      'Molekul tulen disukat dengan tepat supaya cukup kuat merawat sel bermasalah tanpa merosakkan organ sihat.',
    verdict: 'Selamat apabila dipantau doktor dan membawa nombor pendaftaran MAL yang sah.',
  },
  kosmetik: {
    title: '2. Kosmetik: Bertindak di Permukaan Luar Sahaja',
    moleculeExample: 'Contoh: Air, Lesitin (Pengemulsi), Gliserin (Pelembap)',
    mechanism:
      'Molekulnya kekal pada lapisan luar kulit untuk membersih, melembap atau memberi warna — tidak masuk ke salur darah.',
    verdict: 'Selamat digunakan secara luaran jika mempunyai nombor notifikasi NOT yang sah.',
  },
  terlarang: {
    title: '3. Produk Haram: Bahan Terlarang Tembus ke Darah',
    moleculeExample: 'Contoh: Merkuri, Hidrokuinon, Steroid dalam krim putih segera',
    mechanism:
      'Bahan kimia aktif atau logam berat dimasukkan secara haram, lalu menyerap menembusi kulit terus ke salur darah dan organ.',
    verdict: 'Dilarang sama sekali — merosakkan buah pinggang, sistem saraf dan perisai kulit.',
  },
};

export const Slide01Cover: React.FC<Slide01Props> = ({ interactions, onPatch }) => {
  const active = COMPARE_CASES[interactions.coverCompareId];

  return (
    <div className="h-full w-full grid grid-cols-12 gap-8 px-10 py-7 items-center select-none">
      <div className="col-span-6 flex flex-col justify-between h-full py-1">
        <div className="space-y-4">
          <div className="text-base font-bold text-emerald-800 dark:text-emerald-400">
            Kimia Tingkatan 5 · Bab 5.4
          </div>
          <h1 className="font-display text-[44px] font-extrabold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08]">
            Ubat-ubatan & Bahan Kosmetik
          </h1>
          <p className="text-[19px] font-medium text-stone-700 dark:text-stone-300 leading-relaxed">
            Bahan yang hampir serupa boleh menjadi{' '}
            <span className="font-bold text-blue-900 dark:text-blue-400">ubat penyembuh</span>,{' '}
            <span className="font-bold text-emerald-800 dark:text-emerald-400">kosmetik luaran</span>, atau{' '}
            <span className="font-bold text-red-700 dark:text-red-400">racun senyap</span> — bergantung pada 3 rahsia kimia:
          </p>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-sm font-bold text-blue-900 dark:text-blue-400">Rahsia 1</div>
              <div className="text-[17px] font-bold text-stone-900 dark:text-stone-100 mt-0.5">Struktur</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Bentuk dan sifat asid/kutub molekul
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-sm font-bold text-amber-800 dark:text-amber-400">Rahsia 2</div>
              <div className="text-[17px] font-bold text-stone-900 dark:text-stone-100 mt-0.5">Dos &amp; Tempoh</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Jumlah yang masuk menentu selamat atau toksik
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3.5">
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Rahsia 3</div>
              <div className="text-[17px] font-bold text-stone-900 dark:text-stone-100 mt-0.5">Lapisan Sasaran</div>
              <p className="text-[15px] text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Kekal di luar kulit atau masuk salur darah
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
            {([1, 2, 3, 4] as const).map((id) => (
              <div key={id} className="flex flex-col">
                <span className="text-[16px] font-bold text-stone-900 dark:text-stone-100">
                  {TEAM_PRESENTERS[id].name}
                </span>
                <span className="text-[15px] text-stone-600 dark:text-stone-400 leading-snug">
                  {TEAM_PRESENTERS[id].focus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-6 flex flex-col justify-center">
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-sm">
          <div className="text-[15px] font-semibold text-stone-500 dark:text-stone-400">
            Perbandingan Lapisan Tindakan
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-tight">
            Di Manakah Molekul Ini Bertindak?
          </h2>

          <div className="grid grid-cols-3 gap-2.5 mt-4" role="tablist" aria-label="Perbandingan Tujuan Bahan">
            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'ubat'}
              onClick={() => onPatch({ coverCompareId: 'ubat' })}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[16px] font-bold transition-colors cursor-pointer ${
                interactions.coverCompareId === 'ubat'
                  ? 'bg-blue-900 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Stethoscope className="w-5 h-5 shrink-0" />
              <span>Ubat</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'kosmetik'}
              onClick={() => onPatch({ coverCompareId: 'kosmetik' })}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[16px] font-bold transition-colors cursor-pointer ${
                interactions.coverCompareId === 'kosmetik'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>Kosmetik</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={interactions.coverCompareId === 'terlarang'}
              onClick={() => onPatch({ coverCompareId: 'terlarang' })}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-[16px] font-bold transition-colors cursor-pointer ${
                interactions.coverCompareId === 'terlarang'
                  ? 'bg-red-700 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Terlarang</span>
            </button>
          </div>

          <motion.div
            key={interactions.coverCompareId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-5 grid grid-cols-12 gap-5 items-center"
          >
            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4 flex flex-col items-center">
              <svg viewBox="0 0 200 185" className="w-full h-48" aria-label="Gambar rajah kedalaman serapan molekul">
                <rect x="14" y="16" width="172" height="36" rx="8" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                <text x="100" y="39" textAnchor="middle" fontSize="13" fontWeight="700" fill="#78350F">
                  1. Permukaan Luar Kulit
                </text>

                <rect x="14" y="72" width="172" height="36" rx="8" fill="#E0F2FE" stroke="#0369A1" strokeWidth="2" />
                <text x="100" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0C4A6E">
                  2. Tisu / Sasaran Sakit
                </text>

                <rect
                  x="14"
                  y="128"
                  width="172"
                  height="40"
                  rx="8"
                  fill={interactions.coverCompareId === 'terlarang' ? '#FEE2E2' : '#F5F5F4'}
                  stroke={interactions.coverCompareId === 'terlarang' ? '#B91C1C' : '#A8A29E'}
                  strokeWidth="2"
                />
                <text
                  x="100"
                  y="152"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={interactions.coverCompareId === 'terlarang' ? '#7F1D1D' : '#44403C'}
                >
                  3. Salur Darah &amp; Ginjal
                </text>

                {interactions.coverCompareId === 'ubat' && (
                  <g>
                    <circle cx="34" cy="90" r="8" fill="#1E3A8A" />
                    <path d="M34,20 L34,78" stroke="#1E3A8A" strokeWidth="4" strokeLinecap="round" />
                    <polygon points="27,74 41,74 34,85" fill="#1E3A8A" />
                  </g>
                )}

                {interactions.coverCompareId === 'kosmetik' && (
                  <g>
                    <circle cx="34" cy="34" r="8" fill="#15803D" />
                    <line x1="20" y1="62" x2="180" y2="62" stroke="#15803D" strokeWidth="3" strokeDasharray="5 4" />
                  </g>
                )}

                {interactions.coverCompareId === 'terlarang' && (
                  <g>
                    <path d="M34,20 L34,136" stroke="#B91C1C" strokeWidth="4" strokeLinecap="round" />
                    <polygon points="27,132 41,132 34,144" fill="#B91C1C" />
                    <circle cx="34" cy="148" r="7" fill="#B91C1C" />
                  </g>
                )}
              </svg>
              <div className="text-[15px] font-bold text-stone-700 dark:text-stone-300 text-center mt-1">
                {interactions.coverCompareId === 'ubat'
                  ? 'Sukatan tepat ke sasaran rawatan'
                  : interactions.coverCompareId === 'kosmetik'
                  ? 'Berhenti di permukaan luar kulit'
                  : 'Menembusi kulit masuk ke darah'}
              </div>
            </div>

            <div className="col-span-7 space-y-3">
              <div>
                <div className="text-[20px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {active.title}
                </div>
                <div className="text-[15px] font-semibold text-stone-500 dark:text-stone-400 mt-1">
                  {active.moleculeExample}
                </div>
              </div>
              <p className="text-[17px] leading-relaxed text-stone-800 dark:text-stone-200">{active.mechanism}</p>
              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 text-[16px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                {active.verdict}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide02Traditional.tsx": r"""import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Flame, Hammer, Leaf, Pill } from 'lucide-react';
import { TRADITIONAL_HERBS, TraditionalHerb } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide02Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

function HerbIllustration({ herb }: { herb: TraditionalHerb }) {
  if (herb.id === 'halia') {
    return (
      <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
        <path
          d="M35,74 C30,56 48,44 64,52 C74,38 96,38 104,54 C122,44 142,54 138,72 C135,88 110,90 94,84 C78,92 42,92 35,74 Z"
          fill="#FEF3C7"
          stroke="#B45309"
          strokeWidth="3"
        />
        <path d="M72,46 C70,28 76,18 86,12" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M98,44 C102,28 114,20 126,18" stroke="#15803D" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (herb.id === 'lidah_buaya') {
    return (
      <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
        <path d="M90,100 L62,32 C68,26 78,40 90,78 Z" fill="#D1FAE5" stroke="#15803D" strokeWidth="2.5" />
        <path d="M90,100 L118,32 C112,26 102,40 90,78 Z" fill="#D1FAE5" stroke="#15803D" strokeWidth="2.5" />
        <path d="M90,100 L90,14 C82,34 82,72 90,100 Z" fill="#A7F3D0" stroke="#15803D" strokeWidth="3" />
        <path d="M90,100 L90,14 C98,34 98,72 90,100 Z" fill="#6EE7B7" stroke="#15803D" strokeWidth="3" />
      </svg>
    );
  }
  if (herb.id === 'ginseng') {
    return (
      <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
        <path d="M90,30 C82,42 82,62 90,70 C98,62 98,42 90,30 Z" fill="#FDE68A" stroke="#92400E" strokeWidth="3" />
        <path d="M86,66 L68,100 M94,66 L112,100 M80,78 L58,88 M100,78 L122,88" stroke="#92400E" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M90,30 L90,14 M90,18 L76,10 M90,18 L104,10" stroke="#15803D" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 180 115" className="w-full h-32" aria-hidden="true">
      <path
        d="M44,64 C46,40 70,34 84,48 C98,32 124,38 136,60 C138,78 114,86 96,74 C80,88 48,84 44,64 Z"
        fill="#FED7AA"
        stroke="#7C2D12"
        strokeWidth="3"
      />
      <circle cx="66" cy="62" r="7" fill="#7C2D12" opacity="0.25" />
      <circle cx="92" cy="58" r="7" fill="#7C2D12" opacity="0.25" />
      <circle cx="116" cy="62" r="7" fill="#7C2D12" opacity="0.25" />
    </svg>
  );
}

export const Slide02Traditional: React.FC<Slide02Props> = ({ interactions, onPatch }) => {
  const activeHerb = TRADITIONAL_HERBS.find((h) => h.id === interactions.herbId) ?? TRADITIONAL_HERBS[0];

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-emerald-800 dark:text-emerald-400">
            5.4.1 · Ubat Tradisional (Rajah 5.13 &amp; Gambar foto 5.9)
          </div>
          <h2 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Tumbuhan Membekalkan Molekul Aktif Semula Jadi — Tetapi Dosnya Tidak Sekata
          </h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-4 flex flex-col justify-between gap-2">
          {TRADITIONAL_HERBS.map((herb) => {
            const selected = herb.id === activeHerb.id && !interactions.ketumOpen;
            return (
              <button
                key={herb.id}
                type="button"
                onClick={() => onPatch({ herbId: herb.id, ketumOpen: false })}
                className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
                  selected
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[20px] font-bold text-stone-900 dark:text-stone-100">{herb.name}</span>
                  <Leaf className="w-5 h-5 shrink-0" style={{ color: herb.accentColor }} />
                </div>
                <div className="text-[15px] italic text-stone-600 dark:text-stone-400 mt-0.5">{herb.scientificName}</div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onPatch({ ketumOpen: !interactions.ketumOpen })}
            className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
              interactions.ketumOpen
                ? 'border-red-600 bg-red-50 dark:bg-red-950/50'
                : 'border-amber-400 bg-amber-50/90 dark:bg-amber-950/30 dark:border-amber-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[17px] font-bold text-red-800 dark:text-red-300">Cabaran Minda: Daun Ketum</span>
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
            </div>
            <div className="text-[15px] text-stone-700 dark:text-stone-300 mt-0.5">
              Mengapa herba semula jadi ini diharamkan?
            </div>
          </button>
        </div>

        <div className="col-span-8">
          {interactions.ketumOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full border border-red-200 dark:border-red-800 bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="text-[15px] font-bold text-red-700 dark:text-red-400">
                  Cabaran Minda · Semula Jadi Tidak Bermaksud Sentiasa Selamat
                </div>
                <h3 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-100 mt-1">
                  Daun Ketum (<span className="italic">Mitragyna speciosa</span>)
                </h3>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="rounded-2xl p-5 bg-[#FBF9F5] dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                    <div className="text-[15px] font-bold text-stone-500">Kegunaan Tradisional</div>
                    <p className="text-[17px] text-stone-800 dark:text-stone-200 mt-2 leading-relaxed">
                      Digunakan secara tradisi untuk melegakan sakit belakang dan sebagai pemulih tenaga.
                    </p>
                  </div>
                  <div className="rounded-2xl p-5 bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                    <div className="text-[15px] font-bold text-red-800 dark:text-red-300">Punca Kimia Diharamkan</div>
                    <p className="text-[17px] text-stone-900 dark:text-stone-100 mt-2 leading-relaxed">
                      Mengandungi molekul psikoaktif (mitraginina) yang melekat pada reseptor otak dan mencetuskan <strong>ketagihan</strong> — sebab itu produknya diharamkan di sisi undang-undang.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4">
                <span className="text-[16px] font-semibold text-stone-700 dark:text-stone-300">
                  Prinsip Kimia: Molekul menentukan kesan — sama ada daripada pokok atau makmal.
                </span>
                <button
                  type="button"
                  onClick={() => onPatch({ ketumOpen: false })}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-[15px] font-bold cursor-pointer shrink-0"
                >
                  Kembali ke Senarai Herba
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeHerb.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-3xl p-6 flex flex-col justify-between"
            >
              <div className="grid grid-cols-12 gap-5 items-center">
                <div className="col-span-4 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4">
                  <HerbIllustration herb={activeHerb} />
                  <div className="text-center text-[15px] font-bold text-stone-800 dark:text-stone-200 mt-1">
                    {activeHerb.partUsed}
                  </div>
                </div>

                <div className="col-span-8 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <div className="text-[15px] italic text-emerald-800 dark:text-emerald-400">{activeHerb.scientificName}</div>
                      <h3 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-100 leading-tight">{activeHerb.name}</h3>
                    </div>
                    <span className="text-[15px] font-bold text-amber-800 dark:text-amber-300 text-right">
                      {activeHerb.activeMolecule}
                    </span>
                  </div>

                  <ul className="space-y-1">
                    {activeHerb.uses.map((u) => (
                      <li key={u} className="text-[17px] font-semibold text-stone-900 dark:text-stone-100 flex items-start gap-2.5">
                        <span className="mt-2.5 w-2.5 h-2.5 rounded-full bg-emerald-700 shrink-0" />
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="rounded-xl bg-[#FBF9F5] dark:bg-stone-950 px-4 py-2.5 text-[16px] text-stone-800 dark:text-stone-200 leading-snug">
                    <strong>Bagaimana ia bertindak:</strong> {activeHerb.molecularMechanism}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[16px] font-bold text-stone-700 dark:text-stone-300">
                    Cara Membebaskan Bahan Aktif (Penyediaan):
                  </span>
                  <div className="flex gap-2">
                    {(
                      [
                        { id: 'lesung', label: 'Lesung Batu', Icon: Hammer },
                        { id: 'rebusan', label: 'Direbus', Icon: Flame },
                        { id: 'kapsul', label: 'Pil / Kapsul', Icon: Pill },
                      ] as const
                    ).map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onPatch({ herbPrep: id })}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[15px] font-bold transition-colors cursor-pointer ${
                          interactions.herbPrep === id
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl px-5 py-3 text-[16px] font-medium text-stone-900 dark:text-stone-100 leading-snug">
                  {activeHerb.prepNotes[interactions.herbPrep]}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide03ModernDrugs.tsx": r"""import React from 'react';
import { AlertCircle, Atom, CheckCircle2, ShieldAlert, UserCheck } from 'lucide-react';
import { MODERN_DRUGS, ModernDrugItem } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { assessDrugForPatient, PatientProfileId } from '../../utils/presentationEngine';

interface Slide03Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const CATEGORIES: {
  id: ModernDrugItem['categoryId'];
  name: string;
  subDrugs: string[];
}[] = [
  { id: 'analgesik', name: '1. Analgesik (Tahan Sakit)', subDrugs: ['aspirin', 'parasetamol', 'kodeina'] },
  { id: 'antimikrob', name: '2. Antimikrob (Lawan Kuman)', subDrugs: ['antibiotik', 'antiseptik', 'disinfektan'] },
  { id: 'psikotik', name: '3. Ubat Psikotik', subDrugs: ['psikotik'] },
  { id: 'antialergi', name: '4. Antialergi', subDrugs: ['antialergi'] },
  { id: 'kortikosteroid', name: '5. Kortikosteroid', subDrugs: ['kortikosteroid'] },
];

const PATIENT_PROFILES: { id: PatientProfileId; label: string }[] = [
  { id: 'dewasa_sihat', label: 'Dewasa Sihat' },
  { id: 'pesakit_gastrik', label: 'Pesakit Gastrik' },
  { id: 'kanak_kanak', label: 'Kanak-kanak' },
  { id: 'alahan_penisilin', label: 'Alahan Penisilin' },
  { id: 'luka_luaran', label: 'Luka Terbuka' },
];

export const Slide03ModernDrugs: React.FC<Slide03Props> = ({ interactions, onPatch }) => {
  const activeDrug = MODERN_DRUGS.find((d) => d.id === interactions.selectedDrugId) ?? MODERN_DRUGS[0];
  const assessment = assessDrugForPatient(activeDrug.id, interactions.selectedPatient);

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-2.5">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.1 &amp; 5.4.2 · Ubat Moden (Rajah 5.14 &amp; Jadual 5.7)
          </div>
          <h2 className="font-display text-[29px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Setiap Ubat Moden Ialah Kunci Molekul Khusus — Salah Pesakit Menjadi Bahaya
          </h2>
        </div>

        <button
          type="button"
          onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[15px] font-bold shrink-0 cursor-pointer transition-colors ${
            interactions.molecularLens
              ? 'border-indigo-700 bg-indigo-900 text-white'
              : 'border-stone-300 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-stone-50'
          }`}
        >
          <Atom className="w-4 h-4" />
          <span>{interactions.molecularLens ? 'Mod Biokimia Aktif' : 'Zum Biokimia'}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-5 flex flex-col justify-between gap-2">
          {CATEGORIES.map((cat) => {
            const drugsInCat = MODERN_DRUGS.filter((d) => cat.subDrugs.includes(d.id));
            const catSelected = activeDrug.categoryId === cat.id;
            return (
              <div
                key={cat.id}
                className={`rounded-2xl border px-4 py-2.5 transition-colors ${
                  catSelected
                    ? 'border-blue-800 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onPatch({
                      drugCategoryId: cat.id,
                      selectedDrugId: drugsInCat[0]?.id ?? 'aspirin',
                    })
                  }
                  className="w-full text-left font-display text-[18px] font-bold text-stone-900 dark:text-stone-100 cursor-pointer flex items-center justify-between"
                >
                  <span>{cat.name}</span>
                  {drugsInCat.length === 1 && (
                    <span className="text-[14px] font-medium text-stone-600 dark:text-stone-400">
                      {drugsInCat[0].examples.join(', ')}
                    </span>
                  )}
                </button>

                {drugsInCat.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {drugsInCat.map((d) => {
                      const picked = d.id === activeDrug.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => onPatch({ drugCategoryId: cat.id, selectedDrugId: d.id })}
                          className={`px-3.5 py-1.5 rounded-xl text-[15px] font-bold transition-colors cursor-pointer ${
                            picked
                              ? 'bg-blue-900 text-white'
                              : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="text-[14px] text-stone-600 dark:text-stone-400 px-1">
            <strong>Ibnu Sina</strong> (Bapa Perubatan Moden) · Pil, kapsul, serbuk &amp; larutan
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-between gap-3.5">
          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 space-y-3">
            <div className="flex items-baseline justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-2">
              <div>
                <span className="text-[15px] font-bold text-blue-900 dark:text-blue-400">{activeDrug.categoryName}</span>
                <h3 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {activeDrug.name}
                </h3>
              </div>
              <div className="text-[15px] font-semibold text-stone-700 dark:text-stone-300 text-right">
                Contoh: {activeDrug.examples.join(', ')}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 items-stretch">
              <div className="col-span-6 bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3.5">
                <div className="text-[14px] font-bold text-blue-900 dark:text-blue-400">
                  Mekanisme Kunci &amp; Sasaran
                </div>
                <p className="text-[16px] font-semibold text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                  {activeDrug.functionDesc}
                </p>
                <p className="text-[15px] text-stone-700 dark:text-stone-300 mt-1.5 leading-snug">
                  {activeDrug.targetLock}
                </p>
              </div>

              <div className="col-span-6 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl p-3.5">
                <div className="text-[14px] font-bold text-amber-900 dark:text-amber-300">
                  Mengapa Kesan Sampingan Berlaku?
                </div>
                <p className="text-[15px] text-stone-900 dark:text-stone-100 mt-1 leading-snug">
                  {activeDrug.whySideEffectHappens}
                </p>
              </div>
            </div>

            <div className="text-[15px] text-stone-700 dark:text-stone-300">
              <strong>Aturan Guna:</strong> {activeDrug.usageRule}
            </div>
          </div>

          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                <span className="font-display text-[18px] font-bold text-stone-900 dark:text-stone-100">
                  Uji Kesesuaian pada Pesakit Berbeza
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {PATIENT_PROFILES.map((p) => {
                  const active = p.id === interactions.selectedPatient;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onPatch({ selectedPatient: p.id })}
                      className={`text-center py-2.5 px-2 rounded-xl border transition-colors cursor-pointer text-[14px] font-bold ${
                        active
                          ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                          : 'border-stone-200 dark:border-stone-800 bg-[#FBF9F5] dark:bg-stone-950 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`mt-2.5 rounded-xl border p-3.5 flex items-start gap-3 ${
                assessment.riskLevel === 'selamat'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100'
                  : assessment.riskLevel === 'berjaga'
                  ? 'border-amber-300 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
                  : 'border-red-300 bg-red-50 text-red-950 dark:bg-red-950/40 dark:text-red-100'
              }`}
            >
              {assessment.riskLevel === 'selamat' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              ) : assessment.riskLevel === 'berjaga' ? (
                <AlertCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-[17px] font-bold leading-snug">{assessment.headline}</div>
                <p className="text-[15px] mt-0.5 leading-snug">{assessment.mechanismReason}</p>
                {interactions.molecularLens && (
                  <p className="text-[14px] mt-1 font-semibold opacity-90">
                    Tahap Biokimia: {assessment.molecularDeepDive}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide04KineticsLab.tsx": r"""import React from 'react';
import { Activity, AlertTriangle, Atom, FlaskConical, ShieldCheck } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { evaluateParacetamolDose, simulateAntibioticCourse } from '../../utils/presentationEngine';

interface Slide04Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide04KineticsLab: React.FC<Slide04Props> = ({ interactions, onPatch }) => {
  const sim = simulateAntibioticCourse(interactions.antibioticMode === 'stop3' ? 3 : null);
  const currentDayPoint = sim.points[Math.min(7, Math.max(0, interactions.antibioticDay))] ?? sim.points[7];
  const para = evaluateParacetamolDose(interactions.paracetamolMg);

  const chartW = 420;
  const chartH = 170;
  const mapX = (day: number) => 38 + (day / 7) * (chartW - 60);
  const mapY = (val: number) => chartH - 28 - (Math.min(130, val) / 130) * (chartH - 46);

  const totalPath = sim.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.day)} ${mapY(p.totalBacteria)}`).join(' ');
  const resistantPath = sim.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(p.day)} ${mapY(p.resistantBacteria)}`)
    .join(' ');

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.2 · Kinetik Dos, Rintangan Bakteria &amp; Plasebo
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Dos &amp; Tempoh Menentukan Siapa Menang: Rawatan atau Kerosakan
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0" role="tablist" aria-label="Pilih Demonstrasi">
          {(
            [
              { id: 'antibiotik', label: '1. Antibiotik' },
              { id: 'parasetamol', label: '2. Perisai Hati' },
              { id: 'plasebo', label: '3. Plasebo' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={interactions.placeboTab === tab.id}
              onClick={() => onPatch({ placeboTab: tab.id })}
              className={`px-3.5 py-2 rounded-xl text-[15px] font-bold transition-colors cursor-pointer ${
                interactions.placeboTab === tab.id
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.molecularLens
                ? 'border-indigo-700 bg-indigo-900 text-white'
                : 'border-stone-300 bg-white text-stone-800'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>Biokimia</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        {interactions.placeboTab === 'antibiotik' && (
          <>
            <div className="col-span-7 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-stone-500">Populasi Bakteria (Hari 0–7)</div>
                  <h3 className="font-display text-[24px] font-bold text-stone-900 dark:text-stone-100">
                    Bukan Badan Anda yang Kebal — Bakteria Bermutasi!
                  </h3>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPatch({ antibioticMode: 'full', antibioticDay: 7 })}
                    className={`px-3.5 py-2 rounded-xl border text-[15px] font-bold cursor-pointer ${
                      interactions.antibioticMode === 'full'
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    Habis 7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => onPatch({ antibioticMode: 'stop3', antibioticDay: 7 })}
                    className={`px-3.5 py-2 rounded-xl border text-[15px] font-bold cursor-pointer ${
                      interactions.antibioticMode === 'stop3'
                        ? 'border-red-600 bg-red-50 text-red-800'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    Berhenti Hari 3
                  </button>
                </div>
              </div>

              <div className="my-2 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48" role="img" aria-label="Graf populasi bakteria">
                  <line x1="38" y1="14" x2="38" y2={chartH - 28} stroke="#A8A29E" strokeWidth="2" />
                  <line x1="38" y1={chartH - 28} x2={chartW - 14} y2={chartH - 28} stroke="#A8A29E" strokeWidth="2" />

                  {interactions.antibioticMode === 'stop3' && (
                    <g>
                      <line
                        x1={mapX(3)}
                        y1="14"
                        x2={mapX(3)}
                        y2={chartH - 28}
                        stroke="#B91C1C"
                        strokeDasharray="5 4"
                        strokeWidth="2.5"
                      />
                      <text x={mapX(3) + 8} y="26" fontSize="13" fill="#B91C1C" fontWeight="700">
                        Berhenti Hari 3 (Rasa Sihat)
                      </text>
                    </g>
                  )}

                  <path d={totalPath} fill="none" stroke="#1E3A8A" strokeWidth="4" />
                  <path d={resistantPath} fill="none" stroke="#B91C1C" strokeWidth="4" strokeDasharray="7 4" />

                  <circle cx={mapX(currentDayPoint.day)} cy={mapY(currentDayPoint.totalBacteria)} r="6" fill="#1E3A8A" />
                  <circle cx={mapX(currentDayPoint.day)} cy={mapY(currentDayPoint.resistantBacteria)} r="6" fill="#B91C1C" />

                  {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <text key={d} x={mapX(d)} y={chartH - 7} textAnchor="middle" fontSize="13" fill="#44403C" fontWeight="700">
                      H{d}
                    </text>
                  ))}
                </svg>
                <div className="flex items-center justify-between text-[15px] font-semibold text-stone-800 dark:text-stone-200 px-2">
                  <span>Biru: Semua bakteria · Merah putus: Bakteria kebal</span>
                  <span className="tabular-nums-clean font-bold">
                    Hari {currentDayPoint.day}: {currentDayPoint.totalBacteria} koloni
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label htmlFor="abx-day-slider" className="text-[16px] font-bold text-stone-800 dark:text-stone-200 shrink-0">
                  Hari ke-{interactions.antibioticDay}
                </label>
                <input
                  id="abx-day-slider"
                  type="range"
                  min={0}
                  max={7}
                  step={1}
                  value={interactions.antibioticDay}
                  onChange={(e) => onPatch({ antibioticDay: Number(e.target.value) })}
                  className="w-full accent-stone-900 cursor-pointer h-2.5"
                />
              </div>
            </div>

            <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
              <div className="text-center">
                <div className="text-[17px] font-bold text-stone-800 dark:text-stone-200">
                  Keadaan Dalam Badan (Hari ke-{currentDayPoint.day})
                </div>
                <svg viewBox="0 0 180 170" className="w-48 h-44 mx-auto my-1" aria-hidden="true">
                  <circle cx="90" cy="85" r="76" fill="#FBF9F5" stroke="#A8A29E" strokeWidth="3.5" />
                  <circle cx="90" cy="85" r="68" fill="#F5F5F4" stroke="#E7E5E4" strokeWidth="1.5" />
                  {Array.from({ length: Math.min(24, Math.ceil(currentDayPoint.sensitiveBacteria / 4)) }).map((_, i) => {
                    const angle = i * 2.4;
                    const rad = 14 + ((i * 11) % 45);
                    return (
                      <circle
                        key={`s-${i}`}
                        cx={90 + Math.cos(angle) * rad}
                        cy={85 + Math.sin(angle) * rad}
                        r="5"
                        fill="#1E3A8A"
                        opacity="0.78"
                      />
                    );
                  })}
                  {Array.from({ length: Math.min(24, Math.ceil(currentDayPoint.resistantBacteria / 4)) }).map((_, i) => {
                    const angle = i * 1.9 + 0.6;
                    const rad = 10 + ((i * 13) % 48);
                    return (
                      <circle
                        key={`r-${i}`}
                        cx={90 + Math.cos(angle) * rad}
                        cy={85 + Math.sin(angle) * rad}
                        r="6"
                        fill="#B91C1C"
                      />
                    );
                  })}
                </svg>
                <div className="text-[15px] font-semibold text-stone-700 dark:text-stone-300">
                  Biru: Lemah ({currentDayPoint.sensitiveBacteria}) · Merah: Kebal ({currentDayPoint.resistantBacteria})
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 text-[15px] leading-snug ${
                  sim.outcome === 'sembuh_sepenuhnya'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                    : 'border-red-300 bg-red-50 text-red-950'
                }`}
              >
                <div className="text-[17px] font-bold mb-1">
                  {sim.outcome === 'sembuh_sepenuhnya'
                    ? 'Semua bakteria berjaya dibunuh'
                    : `Amaran: ${sim.resistanceRatio}% bakteria kebal membiak semula!`}
                </div>
                <p>{sim.summary}</p>
                {interactions.molecularLens && (
                  <p className="mt-1.5 font-semibold">{sim.mechanismDetail}</p>
                )}
              </div>
            </div>
          </>
        )}

        {interactions.placeboTab === 'parasetamol' && (
          <div className="col-span-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-7 grid grid-cols-12 gap-7 items-center">
            <div className="col-span-6 space-y-5">
              <div>
                <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
                  Mekanisme Penyahtoksin Hati (Had Selamat 4000 mg/hari)
                </div>
                <h3 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-100 mt-1 leading-tight">
                  Mengapa Terlebih Parasetamol Merosakkan Hati?
                </h3>
                <p className="text-[17px] text-stone-700 dark:text-stone-300 mt-2 leading-relaxed">
                  Hati mempunyai <strong>perisai antioksidan</strong> untuk meneutralkan sisa ubat. Apabila dos melampaui 4000 mg sehari, perisai habis dan sisa reaktif mula menyerang sel hati.
                </p>
              </div>

              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="para-slider" className="text-[17px] font-bold text-stone-800 dark:text-stone-200">
                    Jumlah Dos Sehari
                  </label>
                  <span className="tabular-nums-clean text-[24px] font-bold text-stone-900 dark:text-stone-50">
                    {interactions.paracetamolMg} mg / hari
                  </span>
                </div>
                <input
                  id="para-slider"
                  type="range"
                  min={500}
                  max={8000}
                  step={500}
                  value={interactions.paracetamolMg}
                  onChange={(e) => onPatch({ paracetamolMg: Number(e.target.value) })}
                  className="w-full accent-stone-900 dark:accent-stone-100 cursor-pointer h-2.5"
                />
                <div className="flex justify-between tabular-nums-clean text-[15px] font-bold text-stone-600 dark:text-stone-400">
                  <span>500 mg (1 biji)</span>
                  <span>Had selamat: 4000 mg</span>
                  <span>8000 mg (Toksik)</span>
                </div>
              </div>
            </div>

            <div className="col-span-6 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-bold text-stone-900 dark:text-stone-100">Simulasi Perisai Hati</span>
                <Activity className="w-6 h-6 text-blue-900 dark:text-blue-400" />
              </div>

              <svg viewBox="0 0 360 135" className="w-full h-36" aria-label="Gambar rajah perisai hati menentang dos berlebihan">
                <rect x="12" y="24" width="94" height="86" rx="14" fill="#DBEAFE" stroke="#1E3A8A" strokeWidth="2" />
                <text x="59" y="58" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1E3A8A">
                  Dos Masuk
                </text>
                <text x="59" y="82" textAnchor="middle" fontSize="16" fontWeight="800" fill="#1E3A8A">
                  {interactions.paracetamolMg} mg
                </text>

                <path d="M110,67 L138,67" stroke="#44403C" strokeWidth="3.5" strokeLinecap="round" />
                <polygon points="134,60 146,67 134,74" fill="#44403C" />

                <rect
                  x="150"
                  y="24"
                  width="98"
                  height="86"
                  rx="14"
                  fill={para.glutathioneShieldPercent > 35 ? '#DCFCE7' : '#FEE2E2'}
                  stroke={para.glutathioneShieldPercent > 35 ? '#15803D' : '#B91C1C'}
                  strokeWidth="2.5"
                />
                <text
                  x="199"
                  y="56"
                  textAnchor="middle"
                  fontSize="13.5"
                  fontWeight="700"
                  fill={para.glutathioneShieldPercent > 35 ? '#14532D' : '#7F1D1D'}
                >
                  Perisai Hati
                </text>
                <text
                  x="199"
                  y="82"
                  textAnchor="middle"
                  fontSize="17"
                  fontWeight="800"
                  fill={para.glutathioneShieldPercent > 35 ? '#15803D' : '#B91C1C'}
                >
                  {para.glutathioneShieldPercent}% Baki
                </text>

                <path d="M252,67 L276,67" stroke="#44403C" strokeWidth="3.5" strokeLinecap="round" />
                <polygon points="272,60 284,67 272,74" fill="#44403C" />

                <rect
                  x="286"
                  y="24"
                  width="64"
                  height="86"
                  rx="14"
                  fill={para.status === 'amaran_hati' ? '#B91C1C' : '#DCFCE7'}
                />
                <text
                  x="318"
                  y="62"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fill={para.status === 'amaran_hati' ? '#FFFFFF' : '#14532D'}
                >
                  {para.status === 'amaran_hati' ? 'Sel Hati' : 'Sisa'}
                </text>
                <text
                  x="318"
                  y="82"
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="800"
                  fill={para.status === 'amaran_hati' ? '#FFFFFF' : '#14532D'}
                >
                  {para.status === 'amaran_hati' ? 'ROSAK!' : 'Keluar'}
                </text>
              </svg>

              <div
                className={`p-4 rounded-xl border text-[16px] font-bold leading-snug ${
                  para.status === 'amaran_hati'
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                }`}
              >
                <div>{para.label}</div>
                {interactions.molecularLens && (
                  <p className="text-[14px] font-medium mt-1">{para.toxicRiskNote}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {interactions.placeboTab === 'plasebo' && (
          <div className="col-span-12 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-7 grid grid-cols-12 gap-7 items-center">
            <div className="col-span-6 space-y-4">
              <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
                Ujian Klinikal Perubatan (m.s. 184)
              </div>
              <h3 className="font-display text-[30px] font-bold text-stone-900 dark:text-stone-100 leading-tight">
                Bagaimana Saintis Tahu Ubat Benar-benar Berkesan?
              </h3>
              <p className="text-[18px] text-stone-700 dark:text-stone-300 leading-relaxed">
                <strong>Plasebo</strong> ialah bahan yang menyerupai ubat sebenar, tetapi{' '}
                <strong>tiada sebarang nilai terapeutik</strong> atau bahan ubat aktif.
              </p>
              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-5 text-[16px] text-stone-800 dark:text-stone-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                  <FlaskConical className="w-5 h-5 text-blue-900 dark:text-blue-400" />
                  <span>Prinsip Eksperimen Terkawal</span>
                </div>
                <p>
                  Pesakit yang diberi pil gula sering berasa sedikit lega kerana <strong>harapan otak</strong>. Saintis membandingkan ubat sebenar dengan plasebo supaya hanya molekul yang benar-benar berkesan secara kimia diluluskan!
                </p>
              </div>
            </div>

            <div className="col-span-6 grid grid-cols-2 gap-4">
              <div className="border-2 border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-[17px]">
                  <ShieldCheck className="w-6 h-6" />
                  <span>Kumpulan Ubat Sebenar</span>
                </div>
                <div className="text-[24px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  Ada Molekul Aktif
                </div>
                <p className="text-[16px] text-stone-800 dark:text-stone-200 leading-relaxed">
                  Harapan otak <strong>+ Tindak balas kimia sebenar</strong> terhadap punca penyakit.
                </p>
              </div>

              <div className="border-2 border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-stone-800 dark:text-stone-200 font-bold text-[17px]">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <span>Kumpulan Plasebo</span>
                </div>
                <div className="text-[24px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  0% Bahan Ubat
                </div>
                <p className="text-[16px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  Rupa pil sama persis, tetapi hanya mengandungi gula atau kanji sebagai kawalan perbandingan.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide05AbuseNpra.tsx": r"""import React from 'react';
import { AlertOctagon, ArrowRight, CheckCircle2, FileCheck2, ShieldAlert } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { validateNpraCode } from '../../utils/presentationEngine';

interface Slide05Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

const MISUSE_CASES = [
  {
    title: 'Penyalahgunaan Antibiotik',
    cause: 'Berhenti awal atau makan antibiotik tanpa preskripsi doktor.',
    bodyProcess: 'Baki bakteria tahan lasak terselamat dan membiak menjadi koloni kebal.',
    impact: 'Rintangan antibiotik — jangkitan berulang lebih sukar dirawat.',
  },
  {
    title: 'Ubat Herba Tanpa Pengesahan',
    cause: 'Mengambil produk herba tanpa ujian klinikal atau dicampur bahan terlarang.',
    bodyProcess: 'Hati dan buah pinggang terpaksa menapis bahan kimia tidak diketahui dan logam berat.',
    impact: 'Kegagalan fungsi hati dan buah pinggang.',
  },
  {
    title: 'Penyalahgunaan Kodeina',
    cause: 'Mengambil ubat batuk atau ubat tahan sakit kodeina melebihi dos.',
    bodyProcess: 'Molekul mengikat reseptor saraf otak secara berterusan sehingga otak menuntut dos lebih tinggi.',
    impact: 'Menyebabkan ketagihan dan kebergantungan kepada ubat.',
  },
];

export const Slide05AbuseNpra: React.FC<Slide05Props> = ({ interactions, onPatch }) => {
  const npraResult = validateNpraCode(interactions.npraInput);

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 pb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-red-700 dark:text-red-400">
            5.4.2 &amp; 5.4.3 · Penyalahgunaan Ubat &amp; Kawalan KKM
          </div>
          <h2 className="font-display text-[29px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Rantaian Kesan Penyalahgunaan Ubat &amp; Semakan Pendaftaran NPRA
          </h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-6 flex flex-col justify-between gap-2.5">
          <div className="space-y-2.5">
            {MISUSE_CASES.map((item, idx) => {
              const active = idx === interactions.misuseCaseIndex;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => onPatch({ misuseCaseIndex: idx })}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                    active
                      ? 'border-red-600 bg-red-50/80 dark:bg-red-950/40'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[19px] font-bold text-stone-900 dark:text-stone-100">
                      {idx + 1}. {item.title}
                    </span>
                    <AlertOctagon className={`w-5 h-5 shrink-0 ${active ? 'text-red-600' : 'text-stone-400'}`} />
                  </div>
                  {active && (
                    <div className="mt-2.5 space-y-1.5 text-[15px] text-stone-800 dark:text-stone-200 leading-snug">
                      <p>
                        <strong>Punca:</strong> {item.cause}
                      </p>
                      <p className="flex items-start gap-1.5">
                        <ArrowRight className="w-4 h-4 text-red-700 shrink-0 mt-1" />
                        <span>
                          <strong>Apa berlaku di dalam badan:</strong> {item.bodyProcess}
                        </span>
                      </p>
                      <p className="text-red-800 dark:text-red-300 font-bold">
                        <strong>Akibat:</strong> {item.impact}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center gap-2 font-display text-[17px] font-bold text-stone-900 dark:text-stone-100">
              <FileCheck2 className="w-5 h-5 text-blue-900 dark:text-blue-400" />
              <span>Kawalan Undang-undang di Malaysia</span>
            </div>
            <ul className="text-[15px] text-stone-800 dark:text-stone-200 space-y-1 leading-snug">
              <li>
                · <strong>Akta Perubatan Tradisional &amp; Komplementari 2016</strong> dan <strong>Dasar PT&amp;K Kebangsaan</strong>
              </li>
              <li>
                · <strong>NPRA</strong> (Bahagian Regulatori Farmasi Negara) — menyemak kualiti, dos dan keselamatan produk.
              </li>
            </ul>
          </div>
        </div>

        <div className="col-span-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">Penyahkod Label Produk</div>
            <h3 className="font-display text-[26px] font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-tight">
              Kenali Perbezaan Kod MAL &amp; NOT
            </h3>
            <p className="text-[16px] text-stone-700 dark:text-stone-300 mt-1.5 leading-snug">
              <strong>MAL</strong> = Ubat Berdaftar (diuji ketulenan dan sukatan dos). <strong>NOT</strong> = Kosmetik Bernotifikasi (luaran sahaja, bebas bahan terlarang).
            </p>

            <div className="mt-4">
              <label htmlFor="npra-code-input" className="block text-[15px] font-bold text-stone-800 dark:text-stone-200 mb-1.5">
                Uji nombor pada kotak produk:
              </label>
              <input
                id="npra-code-input"
                type="text"
                value={interactions.npraInput}
                onChange={(e) => onPatch({ npraInput: e.target.value })}
                placeholder="MAL19981234X atau NOT230501234K"
                className="w-full tabular-nums-clean text-[20px] font-bold px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-[#FBF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { code: 'MAL19981234X', label: 'Contoh Ubat (MAL)' },
                { code: 'NOT230501234K', label: 'Contoh Kosmetik (NOT)' },
                { code: 'KRIM-PUTIH-99', label: 'Tanpa Kod Sah' },
              ].map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => onPatch({ npraInput: preset.code })}
                  className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[15px] font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`mt-4 rounded-2xl border p-4 flex items-start gap-3 ${
              npraResult.validFormat
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-red-300 bg-red-50 text-red-950'
            }`}
          >
            {npraResult.validFormat ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="text-[17px] font-bold">{npraResult.label}</div>
              <p className="text-[15px] leading-snug">{npraResult.chemicalCheckSummary}</p>
              <p className="text-[14px] opacity-90 leading-snug">{npraResult.guidance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide06CosmeticTypes.tsx": r"""import React from 'react';
import { Droplets, Palette, Sparkles, Wind } from 'lucide-react';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide06Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

interface CosmeticProductItem {
  id: string;
  name: string;
  category: 'rias' | 'perawatan' | 'pewangi';
  categoryLabel: string;
  purpose: string;
  chemicalNote: string;
  actionZone: 'atas_kulit' | 'lapisan_epidermis' | 'udara';
}

const COSMETIC_ITEMS: CosmeticProductItem[] = [
  {
    id: 'bedak',
    name: 'Bedak',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Menyerap minyak berlebihan dan menyekatakan warna permukaan wajah.',
    chemicalNote: 'Serbuk mineral halus + pigmen pepejal tidak larut duduk di atas permukaan kulit.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'gincu',
    name: 'Gincu',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Memberikan warna pada bibir dan melindunginya daripada kekeringan.',
    chemicalNote: 'Lilin + minyak + pigmen warna (Ferum(III) oksida) menyaluti permukaan bibir.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'maskara',
    name: 'Pensel Alis, Celak & Maskara',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Membentuk alis, menebalkan bulu mata dan menyerlahkan garisan mata.',
    chemicalNote: 'Pemekat dan pigmen warna melekat di luar bulu mata dan garisan kulit.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'pemerah_pipi',
    name: 'Pemerah Pipi & Pembayang Mata',
    category: 'rias',
    categoryLabel: 'Kosmetik Rias',
    purpose: 'Menambahkan warna untuk mencantikkan wajah secara luaran.',
    chemicalNote: 'Zarahan pigmen mineral memantulkan warna tertentu di lapisan atas kulit.',
    actionZone: 'atas_kulit',
  },
  {
    id: 'krim_pelembap',
    name: 'Krim & Pelembap Kulit',
    category: 'perawatan',
    categoryLabel: 'Kosmetik Perawatan',
    purpose: 'Merawat kekeringan kulit dengan mengekalkan kelembapan.',
    chemicalNote: 'Emulsi minyak + air bersama pelembap (gliserin) mengikat air di lapisan luar kulit.',
    actionZone: 'lapisan_epidermis',
  },
  {
    id: 'masker',
    name: 'Masker Muka',
    category: 'perawatan',
    categoryLabel: 'Kosmetik Perawatan',
    purpose: 'Membersih dan menyegarkan permukaan kulit wajah.',
    chemicalNote: 'Pelarut air, pemekat dan pelembap melembutkan lapisan luar kulit.',
    actionZone: 'lapisan_epidermis',
  },
  {
    id: 'deodoran',
    name: 'Deodoran',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Mengurangkan bau badan dan memberikan kesegaran luaran.',
    chemicalNote: 'Mengandungi pewangi (minyak pati mudah meruap) untuk mengatasi bau.',
    actionZone: 'udara',
  },
  {
    id: 'minyak_wangi',
    name: 'Minyak Wangi',
    category: 'pewangi',
    categoryLabel: 'Pewangi',
    purpose: 'Memberikan haruman yang menyenangkan.',
    chemicalNote: 'Molekul aromatik kecil mudah meruap menjadi gas di udara lalu dikesan oleh hidung.',
    actionZone: 'udara',
  },
];

export const Slide06CosmeticTypes: React.FC<Slide06Props> = ({ interactions, onPatch }) => {
  const filteredItems =
    interactions.cosmeticSortCategory === 'all'
      ? COSMETIC_ITEMS
      : COSMETIC_ITEMS.filter((item) => item.category === interactions.cosmeticSortCategory);

  const selectedItem =
    COSMETIC_ITEMS.find((i) => i.id === interactions.selectedCosmeticItemId) ?? COSMETIC_ITEMS[1];

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-emerald-800 dark:text-emerald-400">
            5.4.4 · Pengelasan Bahan Kosmetik (Rajah 5.16)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Kosmetik Kegunaan Luaran: Pigmen Padat, Emulsi Lembap atau Molekul Meruap
          </h2>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 content-start">
        <div className="col-span-12 grid grid-cols-4 gap-3">
          {(
            [
              { id: 'all', title: 'Semua Contoh', desc: '8 produk harian KSSM', Icon: Sparkles },
              { id: 'rias', title: 'Kosmetik Rias', desc: 'Pigmen atas kulit (warna)', Icon: Palette },
              { id: 'perawatan', title: 'Kosmetik Perawatan', desc: 'Emulsi kunci air kulit', Icon: Droplets },
              { id: 'pewangi', title: 'Pewangi', desc: 'Molekul kecil meruap ke udara', Icon: Wind },
            ] as const
          ).map(({ id, title, desc, Icon }) => {
            const active = interactions.cosmeticSortCategory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPatch({ cosmeticSortCategory: id })}
                className={`text-left rounded-2xl border p-3.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[17px] font-bold">{title}</span>
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-amber-300 dark:text-amber-700' : 'text-emerald-700'}`} />
                </div>
                <div className={`text-[14px] mt-1 font-medium ${active ? 'text-stone-300 dark:text-stone-700' : 'text-stone-600 dark:text-stone-400'}`}>
                  {desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="col-span-7 grid grid-cols-2 gap-3 content-start">
          {filteredItems.map((item) => {
            const selected = item.id === selectedItem.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPatch({ selectedCosmeticItemId: item.id })}
                className={`text-left rounded-2xl border px-4 py-3.5 transition-colors cursor-pointer ${
                  selected
                    ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:border-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="font-display text-[18px] font-bold text-stone-900 dark:text-stone-100">{item.name}</div>
                <div className="text-[14px] font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5">
                  {item.categoryLabel}
                </div>
              </button>
            );
          })}
        </div>

        <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <div className="text-[14px] font-bold text-emerald-800 dark:text-emerald-400">{selectedItem.categoryLabel}</div>
              <h3 className="font-display text-[26px] font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-tight">
                {selectedItem.name}
              </h3>
            </div>

            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
              <svg viewBox="0 0 280 95" className="w-full h-24" aria-label="Lokasi tindakan kosmetik pada kulit dan udara">
                <rect
                  x="10"
                  y="6"
                  width="260"
                  height="26"
                  rx="6"
                  fill={selectedItem.actionZone === 'udara' ? '#DCFCE7' : '#F5F5F4'}
                  stroke={selectedItem.actionZone === 'udara' ? '#15803D' : '#D6D3D1'}
                  strokeWidth="1.8"
                />
                <text x="140" y="23" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1C1917">
                  Udara Sekitar (Molekul Meruap)
                </text>

                <rect
                  x="10"
                  y="36"
                  width="260"
                  height="25"
                  rx="6"
                  fill={selectedItem.actionZone === 'atas_kulit' ? '#FDE68A' : '#FEF3C7'}
                  stroke={selectedItem.actionZone === 'atas_kulit' ? '#B45309' : '#E5E7EB'}
                  strokeWidth="1.8"
                />
                <text x="140" y="53" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#78350F">
                  Atas Permukaan Kulit (Pigmen &amp; Lilin)
                </text>

                <rect
                  x="10"
                  y="65"
                  width="260"
                  height="25"
                  rx="6"
                  fill={selectedItem.actionZone === 'lapisan_epidermis' ? '#DBEAFE' : '#EFF6FF'}
                  stroke={selectedItem.actionZone === 'lapisan_epidermis' ? '#1E3A8A' : '#E5E7EB'}
                  strokeWidth="1.8"
                />
                <text x="140" y="82" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1E3A8A">
                  Lapisan Luar Kulit (Mengunci Kelembapan)
                </text>
              </svg>
            </div>

            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3.5">
              <div className="text-[14px] font-bold text-stone-500">Tujuan Penggunaan</div>
              <p className="text-[16px] text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">{selectedItem.purpose}</p>
            </div>

            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl p-3.5">
              <div className="text-[14px] font-bold text-emerald-900 dark:text-emerald-300">Sifat Fizikal &amp; Kimia</div>
              <p className="text-[15px] text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">{selectedItem.chemicalNote}</p>
            </div>
          </div>

          <div className="mt-2 pt-2.5 border-t border-stone-200 dark:border-stone-800 text-[14px] text-stone-700 dark:text-stone-300 leading-snug">
            Dikawal di bawah <strong>Peraturan-peraturan Kawalan Dadah dan Kosmetik 1984</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide07EmulsionLab.tsx": r"""import React from 'react';
import { Atom, Beaker, Check, RotateCcw } from 'lucide-react';
import { COSMETIC_INGREDIENTS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';
import { EmulsionState, evaluateCosmeticEmulsion } from '../../utils/presentationEngine';

interface Slide07Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide07EmulsionLab: React.FC<Slide07Props> = ({ interactions, onPatch }) => {
  const em = interactions.emulsion;
  const evalResult = evaluateCosmeticEmulsion(em);

  const toggleIngredient = (key: keyof EmulsionState) => {
    onPatch({
      emulsion: {
        ...em,
        [key]: !em[key],
      },
    });
  };

  const applyPreset = (preset: 'separated' | 'complete') => {
    if (preset === 'separated') {
      onPatch({
        emulsion: {
          air: true,
          pengemulsi: false,
          pemekat: false,
          pelembap: true,
          pewangi: false,
          pengawet: true,
          pewarna: false,
        },
      });
    } else {
      onPatch({
        emulsion: {
          air: true,
          pengemulsi: true,
          pemekat: true,
          pelembap: true,
          pewangi: true,
          pengawet: true,
          pewarna: true,
        },
      });
    }
  };

  const baseFill = em.pewarna ? '#FDE2E4' : '#E0F2FE';
  const oilLayerFill = '#FCD34D';

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-2.5">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.4 · Bahan-bahan Asas Kosmetik (Rajah 5.15)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Mengapa Minyak &amp; Air Terpisah — Dan Bagaimana Pengemulsi Mendamaikannya
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => applyPreset('separated')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-[14px] font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-50 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Fasa Terpisah</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('complete')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-[14px] font-bold text-white dark:text-stone-900 hover:bg-stone-800 cursor-pointer"
          >
            <Beaker className="w-4 h-4" />
            <span>Campur Semua 7</span>
          </button>
          <button
            type="button"
            onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.molecularLens
                ? 'border-indigo-700 bg-indigo-900 text-white'
                : 'border-stone-300 bg-white text-stone-800'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>Biokimia</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-6 grid grid-cols-2 gap-2.5 content-between">
          {COSMETIC_INGREDIENTS.map((ing, idx) => {
            const active = em[ing.id];
            return (
              <button
                key={ing.id}
                type="button"
                onClick={() => toggleIngredient(ing.id)}
                aria-pressed={active}
                className={`text-left rounded-2xl border px-3.5 py-2.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-blue-800 bg-blue-50/70 dark:bg-blue-950/50'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 ${
                      active
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'border-stone-300 dark:border-stone-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-display text-[17px] font-bold text-stone-900 dark:text-stone-100">
                    {idx + 1}. {ing.name}
                  </span>
                </div>
                <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-1 leading-snug">
                  {interactions.molecularLens ? ing.molecularRole : ing.role}
                </p>
                <div className="text-[13px] font-semibold text-stone-500 mt-0.5">{ing.examples}</div>
              </button>
            );
          })}

          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 px-3.5 py-2.5 flex flex-col justify-center">
            <div className="text-[14px] font-bold text-amber-900 dark:text-amber-300">Kunci Rahsia Polariti</div>
            <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-0.5 leading-snug">
              <strong>Air</strong> berkutub, <strong>Minyak</strong> tak berkutub — hanya <strong>Pengemulsi</strong> boleh memegang kedua-duanya!
            </p>
          </div>
        </div>

        <div className="col-span-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-4 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[15px] font-bold text-stone-700 dark:text-stone-300">Makroskopik (Bikar) + Molekul</span>
            <span
              className={`text-[15px] font-bold ${
                evalResult.isHomogeneous && em.pengawet ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {evalResult.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 flex justify-center bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-2">
              <svg viewBox="0 0 185 168" className="w-44 h-40" role="img" aria-label="Bikar campuran bahan kosmetik">
                {em.pewangi && (
                  <g stroke="#15803D" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8">
                    <path d="M68,26 C63,16 74,12 69,4" />
                    <path d="M92,24 C87,14 98,10 93,2" />
                    <path d="M116,26 C111,16 122,12 117,4" />
                  </g>
                )}

                <defs>
                  <clipPath id="beakerClipV2">
                    <rect x="42" y="44" width="100" height="106" rx="8" />
                  </clipPath>
                </defs>

                <g clipPath="url(#beakerClipV2)">
                  {em.air ? (
                    <>
                      <rect x="42" y="72" width="100" height="78" fill={baseFill} />
                      {!em.pengemulsi ? (
                        <>
                          <rect x="42" y="50" width="100" height="24" fill={oilLayerFill} opacity="0.95" />
                          <line x1="42" y1="74" x2="142" y2="74" stroke="#B45309" strokeWidth="2.5" />
                          <text x="92" y="66" textAnchor="middle" fontSize="11.5" fill="#78350F" fontWeight="800">
                            Minyak
                          </text>
                          <text x="92" y="114" textAnchor="middle" fontSize="11.5" fill="#0369A1" fontWeight="800">
                            Air Terpisah
                          </text>
                        </>
                      ) : (
                        <>
                          <rect x="42" y="52" width="100" height="98" fill={em.pewarna ? '#FBCFE8' : '#ECFDF5'} />
                          {[
                            [64, 78],
                            [92, 68],
                            [120, 82],
                            [72, 110],
                            [106, 104],
                            [124, 126],
                            [62, 130],
                            [94, 134],
                          ].map(([cx, cy], idx) => (
                            <circle
                              key={idx}
                              cx={cx}
                              cy={cy}
                              r={em.pemekat ? 6.5 : 4.5}
                              fill={em.pewarna ? '#DB2777' : '#1E3A8A'}
                              opacity="0.32"
                            />
                          ))}
                          <text x="92" y="96" textAnchor="middle" fontSize="12" fill="#1C1917" fontWeight="800">
                            Sekata!
                          </text>
                          <text x="92" y="112" textAnchor="middle" fontSize="10.5" fill="#44403C" fontWeight="700">
                            Homogen
                          </text>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <rect x="42" y="94" width="100" height="56" fill={oilLayerFill} opacity="0.9" />
                      <text x="92" y="126" textAnchor="middle" fontSize="11.5" fill="#78350F" fontWeight="800">
                        Minyak Sahaja
                      </text>
                    </>
                  )}

                  {em.air && !em.pengawet && (
                    <g fill="#3F6212">
                      <circle cx="58" cy="140" r="4.5" />
                      <circle cx="126" cy="138" r="5" />
                      <text x="92" y="144" textAnchor="middle" fontSize="10.5" fill="#3F6212" fontWeight="800">
                        Kulat Tumbuh
                      </text>
                    </g>
                  )}
                </g>

                <path
                  d="M36,36 L42,42 L42,146 C42,151 46,154 52,154 L132,154 C138,154 142,151 142,146 L142,42 L148,36"
                  fill="none"
                  stroke="#44403C"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="col-span-7 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
              <div className="text-[13px] font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                Zum Molekul: Bagaimana Pengemulsi Bekerja?
              </div>
              <svg viewBox="0 0 270 132" className="w-full h-32" aria-label="Gambar rajah molekul pengemulsi menyatukan air dan minyak">
                {!em.pengemulsi ? (
                  <g>
                    <rect x="8" y="8" width="254" height="46" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
                    <text x="135" y="29" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#78350F">
                      Minyak (Tak Berkutub / Tolak Air)
                    </text>
                    <text x="135" y="46" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#92400E">
                      Terapung di atas kerana enggan bercampur
                    </text>

                    <line x1="12" y1="66" x2="258" y2="66" stroke="#B91C1C" strokeWidth="2.5" strokeDasharray="5 4" />

                    <rect x="8" y="76" width="254" height="48" rx="10" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.8" />
                    <text x="135" y="98" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#1E3A8A">
                      Air H2O (Berkutub / Tarik Sesama Air)
                    </text>
                    <text x="135" y="115" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#1E40AF">
                      Tiada jambatan untuk memegang minyak
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect x="8" y="8" width="254" height="116" rx="12" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.8" />
                    <circle cx="135" cy="64" r="24" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                    <text x="135" y="68" textAnchor="middle" fontSize="12" fontWeight="800" fill="#78350F">
                      Minyak
                    </text>

                    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                      const rad = (deg * Math.PI) / 180;
                      const x1 = 135 + Math.cos(rad) * 23;
                      const y1 = 64 + Math.sin(rad) * 23;
                      const x2 = 135 + Math.cos(rad) * 38;
                      const y2 = 64 + Math.sin(rad) * 38;
                      return (
                        <g key={deg}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B45309" strokeWidth="3" strokeLinecap="round" />
                          <circle cx={x2} cy={y2} r="5.5" fill="#1D4ED8" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                      );
                    })}

                    <text x="135" y="114" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#1E3A8A">
                      Kepala Biru pegang Air · Ekor pegang Minyak!
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center tabular-nums-clean">
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
              <div className="text-[13px] font-semibold text-stone-500">Kelikatan</div>
              <div className="text-[18px] font-bold text-stone-900 dark:text-stone-100">{evalResult.viscosityScore}%</div>
            </div>
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
              <div className="text-[13px] font-semibold text-stone-500">Kelembapan</div>
              <div className="text-[18px] font-bold text-stone-900 dark:text-stone-100">{evalResult.hydrationScore}%</div>
            </div>
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl py-2 px-1">
              <div className="text-[13px] font-semibold text-stone-500">Tempoh Tahan</div>
              <div className="text-[18px] font-bold text-stone-900 dark:text-stone-100">{evalResult.shelfLifeDays} hari</div>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-[15px] font-medium text-stone-900 dark:text-stone-100 leading-snug">
            <div>{evalResult.diagnosis}</div>
            {interactions.molecularLens && (
              <div className="text-[14px] font-bold text-indigo-900 dark:text-indigo-300 mt-1">
                Tahap Molekul: {evalResult.molecularNote}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide08BannedForensics.tsx": r"""import React from 'react';
import { Atom, CheckCircle2, ShieldAlert, Skull } from 'lucide-react';
import { BANNED_CHEMICALS } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide08Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide08BannedForensics: React.FC<Slide08Props> = ({ interactions, onPatch }) => {
  const activeChemical =
    BANNED_CHEMICALS.find((c) => c.id === interactions.bannedChemicalId) ?? BANNED_CHEMICALS[0];

  return (
    <div className="h-full w-full flex flex-col gap-3.5 px-10 py-6 select-none">
      <div className="shrink-0 border-b border-stone-200 dark:border-stone-800 pb-2.5 flex items-end justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-red-700 dark:text-red-400">
            5.4.4 · Rajah 5.17 &amp; Jadual 5.8 (m.s. 185–186)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Kesan Cerah Palsu: Bahan Haram Menyekat Melanin &amp; Menyerap ke Salur Darah
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onPatch({ cosmeticCompareTab: 'buatan_sendiri' })}
            className={`px-3.5 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'buatan_sendiri'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                : 'border-stone-200 text-stone-700 bg-white'
            }`}
          >
            Buatan Sendiri
          </button>
          <button
            type="button"
            onClick={() => onPatch({ cosmeticCompareTab: 'komersial_haram' })}
            className={`px-3.5 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.cosmeticCompareTab === 'komersial_haram'
                ? 'border-red-600 bg-red-50 text-red-900'
                : 'border-stone-200 text-stone-700 bg-white'
            }`}
          >
            Komersial Haram
          </button>
          <button
            type="button"
            onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[14px] font-bold cursor-pointer ${
              interactions.molecularLens
                ? 'border-indigo-700 bg-indigo-900 text-white'
                : 'border-stone-300 bg-white text-stone-800'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>Biokimia</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 content-start">
        <div className="col-span-12">
          {interactions.cosmeticCompareTab === 'buatan_sendiri' ? (
            <div className="border border-emerald-200 bg-emerald-50/80 rounded-2xl px-4 py-3 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Mudah Dihasilkan:</strong> Bahan semula jadi di sekeliling kita.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Selamat Digunakan:</strong> Tiada bahan kimia berbahaya.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Kos Murah:</strong> Lebih menjimatkan perbelanjaan.
                </span>
              </div>
            </div>
          ) : (
            <div className="border border-red-200 bg-red-50/80 rounded-2xl px-4 py-3 grid grid-cols-3 gap-4">
              <div className="flex items-start gap-2.5 text-[15px] text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Kesan Sampingan:</strong> Membahayakan kulit dan organ.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Bahan Terlarang:</strong> Dimasukkan secara tidak sah.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-[15px] text-red-950">
                <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Iklan Mengelirukan:</strong> Janji cerah melampau dan segera.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-5 flex flex-col justify-between gap-2.5">
          {BANNED_CHEMICALS.map((chem) => {
            const active = chem.id === activeChemical.id;
            return (
              <button
                key={chem.id}
                type="button"
                onClick={() => onPatch({ bannedChemicalId: chem.id })}
                className={`text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
                  active
                    ? 'border-red-600 bg-red-50 dark:bg-red-950/50'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[19px] font-bold text-stone-900 dark:text-stone-100">{chem.name}</span>
                  <Skull className={`w-5 h-5 shrink-0 ${active ? 'text-red-700' : 'text-stone-400'}`} />
                </div>
                <div className="text-[14px] text-stone-700 dark:text-stone-300 mt-0.5 leading-snug">{chem.productFoundIn}</div>
              </button>
            );
          })}
        </div>

        <div className="col-span-7 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5 bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-3">
              <svg viewBox="0 0 215 190" className="w-full h-48" role="img" aria-label="Kesan serapan bahan kimia pada lapisan kulit dan organ">
                <line
                  x1="18"
                  y1="14"
                  x2="18"
                  y2={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? 156 : activeChemical.bodyTarget === 'melanosit_uv' ? 78 : 40}
                  stroke="#B91C1C"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? 156 : activeChemical.bodyTarget === 'melanosit_uv' ? 78 : 40}
                  r="6"
                  fill="#B91C1C"
                />

                <rect
                  x="34"
                  y="20"
                  width="172"
                  height="32"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'lapisan_luar' || activeChemical.bodyTarget === 'pigmentasi_epidermis' ? '#FCA5A5' : '#FDE68A'}
                  stroke="#B45309"
                  strokeWidth="1.5"
                />
                <text x="120" y="40" textAnchor="middle" fontSize="12" fill="#451A03" fontWeight="800">
                  1. Lapisan Luar Kulit
                </text>

                <rect
                  x="34"
                  y="58"
                  width="172"
                  height="36"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'melanosit_uv' ? '#FECACA' : '#FEF3C7'}
                  stroke="#D97706"
                  strokeWidth="1.5"
                />
                <text x="120" y="80" textAnchor="middle" fontSize="12" fill="#78350F" fontWeight="800">
                  2. Melanin (Perisai UV)
                </text>

                <rect x="34" y="100" width="172" height="30" rx="6" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
                <text x="120" y="119" textAnchor="middle" fontSize="12" fill="#7F1D1D" fontWeight="800">
                  3. Salur Darah
                </text>

                <rect
                  x="34"
                  y="136"
                  width="172"
                  height="38"
                  rx="6"
                  fill={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? '#B91C1C' : '#E7E5E4'}
                />
                <text
                  x="120"
                  y="159"
                  textAnchor="middle"
                  fontSize="12"
                  fill={activeChemical.bodyTarget === 'sistem_saraf_ginjal' ? '#FFFFFF' : '#44403C'}
                  fontWeight="800"
                >
                  4. Ginjal &amp; Sistem Saraf
                </text>
              </svg>
            </div>

            <div className="col-span-7 space-y-2.5">
              <div>
                <div className="text-[14px] font-bold text-red-700 dark:text-red-400">Analisis Bahan Terlarang</div>
                <h3 className="font-display text-[24px] font-bold text-stone-900 dark:text-stone-100 leading-tight">
                  {activeChemical.name}
                </h3>
              </div>

              <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3">
                <div className="text-[14px] font-bold text-stone-500">Kesan pada Permukaan Kulit</div>
                <p className="text-[15px] text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">
                  {activeChemical.immediateEffect}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3">
                <div className="text-[14px] font-bold text-red-800 dark:text-red-300">Bahaya Serius</div>
                <p className="text-[15px] text-red-950 dark:text-red-100 mt-0.5 font-bold leading-snug">
                  {activeChemical.severeHarm}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2.5 border-t border-stone-200 dark:border-stone-800 text-[15px] text-stone-800 dark:text-stone-200 leading-snug">
            <strong>Bagaimana ia berlaku?</strong>{' '}
            {interactions.molecularLens ? activeChemical.molecularMechanism : activeChemical.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};
""",
    "src/components/slides/Slide09Quiz.tsx": r"""import React from 'react';
import { ArrowRight, Atom, Eye, HelpCircle, Lightbulb } from 'lucide-react';
import { POE_MYSTERIES } from '../../data/slidesData';
import { SharedSlideInteractions } from '../../hooks/usePresentationSync';

interface Slide09Props {
  interactions: SharedSlideInteractions;
  onPatch: (partial: Partial<SharedSlideInteractions>) => void;
}

export const Slide09Quiz: React.FC<Slide09Props> = ({ interactions, onPatch }) => {
  const mystery = POE_MYSTERIES[interactions.quizIndex] ?? POE_MYSTERIES[0];
  const pickedHypothesis = mystery.hypotheses.find((h) => h.id === interactions.quizSelectedOption);

  return (
    <div className="h-full w-full flex flex-col gap-4 px-10 py-6 select-none">
      <div className="shrink-0 flex items-end justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div>
          <div className="text-[15px] font-bold text-blue-900 dark:text-blue-400">
            5.4.5 · Makmal Penaakulan Feynman (Ramal → Perhati → Terangkan)
          </div>
          <h2 className="font-display text-[28px] font-bold text-stone-900 dark:text-stone-50 mt-0.5 leading-tight">
            Faham Kimia di Sebalik Fenomena — Bukan Menghafal Jawapan Peperiksaan
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {POE_MYSTERIES.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPatch({ quizIndex: idx, quizSelectedOption: null, poeRevealed: false })}
              className={`px-3.5 py-2 rounded-xl border text-[15px] font-bold cursor-pointer ${
                idx === interactions.quizIndex
                  ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900'
                  : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50'
              }`}
            >
              Misteri {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-5">
        <div className="col-span-5 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded-2xl p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[15px] font-bold text-blue-900 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
              <span>Langkah 1 · Situasi Dunia Sebenar</span>
            </div>
            <h3 className="font-display text-[21px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {mystery.title}
            </h3>
            <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-2xl p-4 text-[16px] text-stone-800 dark:text-stone-200 leading-relaxed">
              {mystery.dailySituation}
            </div>
            <p className="text-[16px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {mystery.questionWhy}
            </p>
          </div>

          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-1.5">
            <div className="text-[14px] font-bold text-emerald-800 dark:text-emerald-400">
              3 Prinsip Kimia Utama Bab 5.4:
            </div>
            <div className="text-[14px] text-stone-700 dark:text-stone-300 leading-snug">
              1. <strong>Struktur &amp; Kekutuban</strong> · 2. <strong>Dos &amp; Tempoh</strong> · 3. <strong>Sasaran &amp; Pengawasan NPRA</strong>
            </div>
          </div>
        </div>

        <div className="col-span-7 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="text-[15px] font-bold text-stone-700 dark:text-stone-300">
              Langkah 2 · Ramalkan Dahulu Bersama Kelas (Klik untuk bincang idea):
            </div>
            {mystery.hypotheses.map((hyp, i) => {
              const selected = interactions.quizSelectedOption === hyp.id;
              return (
                <button
                  key={hyp.id}
                  type="button"
                  onClick={() => onPatch({ quizSelectedOption: hyp.id })}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors cursor-pointer ${
                    selected
                      ? 'border-blue-800 bg-blue-50/80 dark:bg-blue-950/50'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-[14px] font-bold px-2.5 py-0.5 rounded-lg border border-stone-300 bg-[#FBF9F5] text-stone-800 shrink-0">
                      Idea {i + 1}
                    </span>
                    <span className="text-[15px] font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                      {hyp.label}
                    </span>
                  </div>
                  {selected && (
                    <p className="mt-1.5 pl-16 text-[14px] font-medium text-blue-950 dark:text-blue-200 leading-snug">
                      {hyp.discussionNote}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[15px] font-bold text-emerald-900 dark:text-emerald-400">
                <Lightbulb className="w-5 h-5" />
                <span>Langkah 3 · Penjelasan Sebab-Akibat Molekul (Feynman)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPatch({ molecularLens: !interactions.molecularLens })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[13px] font-bold cursor-pointer ${
                    interactions.molecularLens
                      ? 'border-indigo-700 bg-indigo-900 text-white'
                      : 'border-stone-300 bg-white text-stone-800'
                  }`}
                >
                  <Atom className="w-3.5 h-3.5" />
                  <span>Biokimia</span>
                </button>
                <button
                  type="button"
                  onClick={() => onPatch({ poeRevealed: !interactions.poeRevealed })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[14px] font-bold cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{interactions.poeRevealed ? 'Tutup Penjelasan' : 'Dedah Mekanisme Molekul'}</span>
                </button>
              </div>
            </div>

            {interactions.poeRevealed ? (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3">
                  <div className="text-[13px] font-bold text-blue-900 dark:text-blue-400 flex items-center gap-1">
                    <span>1. Punca Molekul</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-1 leading-snug">
                    {mystery.causalChain.step1Molecule}
                  </p>
                </div>
                <div className="bg-[#FBF9F5] dark:bg-stone-950 rounded-xl p-3">
                  <div className="text-[13px] font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                    <span>2. Kesan Dalam Badan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[14px] text-stone-800 dark:text-stone-200 mt-1 leading-snug">
                    {mystery.causalChain.step2Body}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3">
                  <div className="text-[13px] font-bold text-emerald-900 dark:text-emerald-300">
                    3. Prinsip Kimia
                  </div>
                  <p className="text-[14px] font-bold text-emerald-950 dark:text-emerald-100 mt-1 leading-snug">
                    {mystery.causalChain.step3Principle}
                  </p>
                  {interactions.molecularLens && (
                    <p className="text-[13px] text-indigo-900 dark:text-indigo-300 mt-1 leading-snug">
                      {mystery.deepChemNote}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[15px] text-stone-600 dark:text-stone-400 leading-snug">
                {pickedHypothesis
                  ? 'Bagus! Selepas kelas membincangkan ramalan di atas, klik "Dedah Mekanisme Molekul" untuk menyemak bagaimana proses kimianya berlaku.'
                  : 'Beri peluang kepada kelas membina ramalan dahulu sebelum mendedahkan mekanisme molekul sebenar.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
""",
}

for rel_path, content in FILES.items():
    target = ROOT / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8", newline="\n")
    print(f"Updated: {target}")

print("Done. Run 'npm run lint' and 'npm run build' in the project root.")