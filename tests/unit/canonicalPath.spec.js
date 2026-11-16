import { test, expect } from '@playwright/test';
import { canonicalPath } from '../../src/lib/canonicalPath.js';

// proxy.ts fa 308 quando canonicalPath(url) è diverso dall'URL: un URL canonico deve restare identico,
// altrimenti redirect in loop.
const same = (p) => decodeURIComponent(canonicalPath(p)) === decodeURIComponent(p);

test('varianti del vecchio sito vanno allo slug della sitemap', () => {
  expect(canonicalPath('/vehicle/KIA/SPORTAGE')).toBe('/vehicle/kia/sportage');
  expect(canonicalPath('/vehicle/BMW/F900%20R')).toBe('/vehicle/bmw/f900-r');
  expect(canonicalPath('/vehicle/AUDI/A3')).toBe('/vehicle/audi/a3');
});

test('gli URL canonici non vengono reindirizzati', () => {
  for (const p of ['/vehicle/kia/sportage', '/vehicle/bmw/f900-r', '/vehicle/smart/%231', "/vehicle/fiat/doblo'", '/vehicle/fiat/doblo%27', '/vehicle/peugeot/208-1.2']) {
    expect(same(p), p).toBe(true);
  }
});
