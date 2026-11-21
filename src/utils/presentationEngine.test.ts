import assert from 'node:assert/strict';
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
  assert.match(fullCourse.mechanismDetail, /semua bakteria dibunuh/i);

  const stoppedEarly = simulateAntibioticCourse(3);
  assert.equal(stoppedEarly.outcome, 'rintangan_berulang');
  assert.ok(stoppedEarly.finalTotal > 40);
  assert.ok(stoppedEarly.resistanceRatio >= 70);
  assert.match(stoppedEarly.mechanismDetail, /imun kepada antibiotik/i);
});

test('evaluateParacetamolDose flags liver damage risk above therapeutic dose', () => {
  const safe = evaluateParacetamolDose(2000);
  assert.equal(safe.status, 'terapeutik');
  assert.ok(safe.liverSafePercent > 60);

  const overdose = evaluateParacetamolDose(6000);
  assert.equal(overdose.status, 'amaran_hati');
  assert.ok(overdose.liverLoadPercent > 80);
  assert.ok(overdose.liverSafePercent < 25);
});

test('evaluateCosmeticEmulsion detects separation without pengemulsi and complete Rajah 5.15 mix', () => {
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
  assert.match(separated.statusLabel, /Terpisah/);
  assert.match(separated.molecularNote, /lesitin/i);

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
  assert.equal(fullStable.hasThickener, true);
  assert.equal(fullStable.hasMoisturizer, true);
  assert.equal(fullStable.hasPreservative, true);
  assert.match(fullStable.statusLabel, /Homogen & Lengkap/);
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
  assert.match(allergyAdult.mechanismReason, /xerostomia/i);

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
