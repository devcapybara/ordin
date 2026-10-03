const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// In-memory restaurant so updateConfigs can run without a database
let restaurant;
const restaurantModelPath = path.resolve(__dirname, '../models/Restaurant.js');
require.cache[restaurantModelPath] = {
  id: restaurantModelPath,
  filename: restaurantModelPath,
  loaded: true,
  exports: { findById: async () => restaurant },
};

const { isRoleDisabled } = require('../services/roles');
const updateConfigs = require('../controllers/restaurants/updateConfigs');

const freshRestaurant = (disabledRoles = []) => ({
  name: 'Test',
  configs: { tax: 0.1, serviceCharge: 0.05, disabledRoles: [...disabledRoles] },
  saved: 0,
  async save() { this.saved++; },
});

const fakeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};

const call = async (user, body) => {
  const res = fakeRes();
  await updateConfigs({ user: { role: user, restaurantId: 'r1' }, body }, res);
  return res;
};

beforeEach(() => { restaurant = freshRestaurant(); });

test('only KITCHEN, CASHIER and WAITER can be turned off', () => {
  restaurant = freshRestaurant(['KITCHEN']);
  assert.equal(isRoleDisabled(restaurant, 'KITCHEN'), true);
  assert.equal(isRoleDisabled(restaurant, 'WAITER'), false);
  assert.equal(isRoleDisabled(restaurant, 'OWNER'), false);
  assert.equal(isRoleDisabled(restaurant, 'MANAGER'), false);
});

test('restaurants without disabledRoles have every role on', () => {
  assert.equal(isRoleDisabled({ configs: {} }, 'CASHIER'), false);
  assert.equal(isRoleDisabled(null, 'CASHIER'), false);
});

test('owner can turn a role off', async () => {
  const res = await call('OWNER', { disabledRoles: ['KITCHEN', 'WAITER'] });
  assert.equal(res.statusCode, 200);
  assert.deepEqual([...restaurant.configs.disabledRoles].sort(), ['KITCHEN', 'WAITER']);
});

test('manager cannot change which roles are on', async () => {
  const res = await call('MANAGER', { disabledRoles: ['CASHIER'] });
  assert.equal(res.statusCode, 403);
  assert.equal(restaurant.configs.disabledRoles.length, 0);
});

test('manager saving unchanged settings is accepted', async () => {
  restaurant = freshRestaurant(['KITCHEN']);
  const res = await call('MANAGER', { name: 'Renamed', disabledRoles: ['KITCHEN'] });
  assert.equal(res.statusCode, 200);
  assert.equal(restaurant.saved, 1);
});

test('unknown roles are rejected', async () => {
  const res = await call('OWNER', { disabledRoles: ['OWNER'] });
  assert.equal(res.statusCode, 400);
  const notArray = await call('OWNER', { disabledRoles: 'KITCHEN' });
  assert.equal(notArray.statusCode, 400);
});
