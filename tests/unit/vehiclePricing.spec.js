import { test, expect } from '@playwright/test';
import {
  computeNetMonthlyRent,
  formatDisplayedRent,
  formatAdvanceAmount,
  resolvePricingSegment,
  isVatIncludedForDisplay,
  isMotoCategory,
  MIN_DISPLAYED_RENT,
} from '../../src/lib/vehiclePricing.js';

test.describe('computeNetMonthlyRent (canone con anticipo)', () => {
  test('senza anticipo il canone resta quello pieno', () => {
    expect(computeNetMonthlyRent(300, 0, 48)).toBe(300);
  });

  test('l\'anticipo abbassa il canone di anticipo/durata', () => {
    expect(computeNetMonthlyRent(300, 4800, 48)).toBe(200);
  });

  test('il risultato è arrotondato all\'euro', () => {
    expect(computeNetMonthlyRent(299, 1000, 48)).toBe(278); // 299 - 20,83
  });

  test('non scende mai sotto il minimo mostrabile', () => {
    expect(computeNetMonthlyRent(300, 10000, 12)).toBe(MIN_DISPLAYED_RENT);
  });

  test('anticipo negativo o assente viene ignorato', () => {
    expect(computeNetMonthlyRent(300, -100, 48)).toBe(300);
    expect(computeNetMonthlyRent(300, undefined, 48)).toBe(300);
  });

  test('durata zero o mancante non divide per zero', () => {
    expect(computeNetMonthlyRent(300, 1500, 0)).toBe(300);
    expect(computeNetMonthlyRent(300, 1500, undefined)).toBe(300);
  });

  test('canone non numerico restituisce null', () => {
    expect(computeNetMonthlyRent('abc', 1000, 48)).toBeNull();
    expect(computeNetMonthlyRent(undefined, 1000, 48)).toBeNull();
  });

  test('accetta numeri passati come stringa (arrivano dal CMS)', () => {
    expect(computeNetMonthlyRent('300', '4800', '48')).toBe(200);
  });
});

test.describe('resolvePricingSegment', () => {
  test('un segmento esplicito ha la precedenza', () => {
    expect(resolvePricingSegment({ segment: 'P.IVA', vehicleSegments: ['Privati'] })).toBe('P.IVA');
  });

  test('le categorie moto danno sempre "Moto"', () => {
    for (const vehicleCategory of ['Moto', 'Scooter', 'Moto e Scooter']) {
      expect(resolvePricingSegment({ vehicleCategory, vehicleSegments: ['Privati'] })).toBe('Moto');
    }
  });

  test('ReUse ha la precedenza su P.IVA e Privati', () => {
    expect(resolvePricingSegment({ vehicleSegments: ['ReUse', 'P.IVA', 'Privati'] })).toBe('ReUse');
  });

  test('P.IVA ha la precedenza su Privati', () => {
    expect(resolvePricingSegment({ vehicleSegments: ['Privati', 'P.IVA'] })).toBe('P.IVA');
  });

  test('le varianti ReUse seguono il tab corrispondente', () => {
    expect(resolvePricingSegment({ vehicleSegments: ['ReUse-Business'] })).toBe('P.IVA');
    expect(resolvePricingSegment({ vehicleSegments: ['ReUse-Privati'] })).toBe('Privati');
  });

  test('senza segmenti riconoscibili restituisce null', () => {
    expect(resolvePricingSegment({})).toBeNull();
    expect(resolvePricingSegment()).toBeNull();
    expect(resolvePricingSegment({ vehicleSegments: 'Privati' })).toBeNull(); // non è un array
  });
});

test.describe('IVA nel prezzo mostrato', () => {
  test('Privati: prezzo con IVA al 22%', () => {
    expect(formatDisplayedRent(100, { segment: 'Privati' })).toBe(122);
  });

  test('P.IVA: prezzo senza IVA', () => {
    expect(formatDisplayedRent(100, { segment: 'P.IVA' })).toBe(100);
  });

  test('Moto: con IVA, tranne quando il veicolo è anche nel segmento Privati', () => {
    const moto = { segment: 'Moto', vehicleCategory: 'Moto' };
    expect(isVatIncludedForDisplay({ ...moto, vehicleSegments: ['Moto'] })).toBe(true);
    expect(isVatIncludedForDisplay({ ...moto, vehicleSegments: ['Privati'] })).toBe(false);
    expect(formatDisplayedRent(100, { ...moto, vehicleSegments: ['Privati'] })).toBe(100);
  });

  test('il risultato è arrotondato all\'euro', () => {
    expect(formatDisplayedRent(99.5, { segment: 'Privati' })).toBe(121); // 121,39
  });

  test('un importo non numerico restituisce null', () => {
    expect(formatDisplayedRent(undefined, { segment: 'Privati' })).toBeNull();
    expect(formatDisplayedRent('abc', { segment: 'Privati' })).toBeNull();
  });
});

test.describe('formatAdvanceAmount e categorie moto', () => {
  test('formatta l\'anticipo in euro con separatore italiano', () => {
    expect(formatAdvanceAmount(0)).toBe('€0');
    expect(formatAdvanceAmount(undefined)).toBe('€0');
    // In it-IT il punto delle migliaia compare solo da 5 cifre: 1500 → "1500", 10000 → "10.000"
    expect(formatAdvanceAmount(1500)).toBe('€1500');
    expect(formatAdvanceAmount(10000)).toBe('€10.000');
  });

  test('isMotoCategory riconosce solo le tre categorie moto', () => {
    expect(isMotoCategory('Moto')).toBe(true);
    expect(isMotoCategory('Scooter')).toBe(true);
    expect(isMotoCategory('Moto e Scooter')).toBe(true);
    expect(isMotoCategory('Auto')).toBe(false);
    expect(isMotoCategory(undefined)).toBe(false);
  });
});
