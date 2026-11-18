import { test, expect } from '@playwright/test';
import { canonicalSearch } from '../../src/lib/canonicalPath.js';

const cs = (q) => canonicalSearch(new URLSearchParams(q));

test('toglie i vecchi parametri WooCommerce', () => {
  expect(cs('yith_wcan=1&yith_product_brand=volkswagen')).toBe('');
  expect(cs('filter_alimentazione=diesel&query_type_alimentazione=or&product_cat=suv&orderby=price')).toBe('');
});

test('tiene i parametri di tracciamento', () => {
  expect(cs('yith_wcan=1&utm_source=google&gclid=abc')).toBe('?utm_source=google&gclid=abc');
  expect(cs('utm_campaign=x')).toBe('?utm_campaign=x');
  expect(cs('')).toBe('');
});
