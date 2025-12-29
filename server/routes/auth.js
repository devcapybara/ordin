const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const register = require('../controllers/auth/register');
const login = require('../controllers/auth/login');
const logout = require('../controllers/auth/logout');
const getMe = require('../controllers/auth/getMe');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
