const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculatePromoDiscount, calculateOrderTotals } = require('../services/orderTotals');

test('percentage promo is capped by maxDiscountAmount', () => {
  const promo = { type: 'PERCENTAGE', value: 10, maxDiscountAmount: 5000 };
  assert.equal(calculatePromoDiscount(promo, 20000), 2000);
  assert.equal(calculatePromoDiscount(promo, 100000), 5000);
});

test('fixed promo never exceeds the subtotal', () => {
  const promo = { type: 'FIXED', value: 50000 };
  assert.equal(calculatePromoDiscount(promo, 30000), 30000);
});

test('totals match the POS formula: tax and service apply after discount', () => {
  const totals = calculateOrderTotals({ subtotal: 100000, discountAmount: 10000, tax: 0.1, serviceCharge: 0.05 });
  // afterDiscount 90000, tax 9000, service 4500, total 103500
  assert.equal(totals.taxAmount, 9000);
  assert.equal(totals.serviceChargeAmount, 4500);
  assert.equal(totals.totalAmount, 103500);
});

test('total is rounded and never negative', () => {
  const totals = calculateOrderTotals({ subtotal: 1000, discountAmount: 5000, tax: 0.1, serviceCharge: 0.05 });
  assert.equal(totals.afterDiscount, 0);
  assert.equal(totals.totalAmount, 0);

  const rounded = calculateOrderTotals({ subtotal: 3333, tax: 0.1, serviceCharge: 0.05 });
  assert.equal(Number.isInteger(rounded.totalAmount), true);
});
