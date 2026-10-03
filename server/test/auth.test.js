const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const jwt = require('jsonwebtoken');

// Replace the User model with an in-memory map so the tests need no database
const users = new Map();
const userModelPath = path.resolve(__dirname, '../models/User.js');
require.cache[userModelPath] = {
  id: userModelPath,
  filename: userModelPath,
  loaded: true,
  exports: {
    findById: (id) => ({ select: async () => users.get(String(id)) || null }),
  },
};

const tokenService = require('../services/auth/tokenService');
const { protect, authorize } = require('../middlewares/auth');

const originalEnv = { ...process.env };

beforeEach(() => {
  users.clear();
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

const fakeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
};

test('production refuses to run without JWT_SECRET', () => {
  process.env.NODE_ENV = 'production';
  delete process.env.JWT_SECRET;
  assert.throws(() => tokenService.getJwtSecret(), /JWT_SECRET is not defined/);
});

test('a valid token resolves to its user', async () => {
  users.set('u1', { _id: 'u1', role: 'OWNER' });
  const user = await tokenService.authenticate(tokenService.generateToken('u1'));
  assert.equal(user._id, 'u1');
});

test('a token signed with another secret is rejected', async () => {
  users.set('u1', { _id: 'u1', role: 'OWNER' });
  const forged = jwt.sign({ id: 'u1' }, 'attacker-guess');
  await assert.rejects(tokenService.authenticate(forged));
});

test('a token for a deleted user is rejected', async () => {
  await assert.rejects(
    tokenService.authenticate(tokenService.generateToken('ghost')),
    /no longer exists/
  );
});

test('logout revokes older tokens but a new login still works', async () => {
  const now = Math.floor(Date.now() / 1000);
  users.set('u1', { _id: 'u1', role: 'OWNER', tokensValidAfter: now + 1 });

  const oldToken = jwt.sign({ id: 'u1', iat: now - 5 }, 'test-secret');
  await assert.rejects(tokenService.authenticate(oldToken), /revoked/);

  // Logged in again after the logout moment
  users.get('u1').tokensValidAfter = now - 10;
  const fresh = await tokenService.authenticate(tokenService.generateToken('u1'));
  assert.equal(fresh._id, 'u1');
});

test('protect rejects requests without a bearer token', async () => {
  const res = fakeRes();
  let called = false;
  await protect({ headers: {} }, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test('protect rejects an invalid token', async () => {
  const res = fakeRes();
  let called = false;
  await protect({ headers: { authorization: 'Bearer not-a-token' } }, res, () => { called = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(called, false);
});

test('protect attaches the user for a valid token', async () => {
  users.set('u1', { _id: 'u1', role: 'WAITER' });
  const req = { headers: { authorization: `Bearer ${tokenService.generateToken('u1')}` } };
  let called = false;
  await protect(req, fakeRes(), () => { called = true; });
  assert.equal(called, true);
  assert.equal(req.user._id, 'u1');
});

test('authorize returns 401 without a user and 403 for the wrong role', () => {
  const guard = authorize('OWNER');

  const noUserRes = fakeRes();
  guard({}, noUserRes, () => {});
  assert.equal(noUserRes.statusCode, 401);

  const wrongRoleRes = fakeRes();
  guard({ user: { role: 'WAITER' } }, wrongRoleRes, () => {});
  assert.equal(wrongRoleRes.statusCode, 403);
});
