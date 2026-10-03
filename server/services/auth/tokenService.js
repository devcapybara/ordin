const jwt = require('jsonwebtoken');
const User = require('../../models/User');

let warnedMissingSecret = false;

// Fail closed in production: never sign or verify tokens with a guessable default
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET is not defined in production environment.');
  }

  if (!warnedMissingSecret) {
    console.warn('WARNING: JWT_SECRET is not defined. Using unsafe default for development.');
    warnedMissingSecret = true;
  }
  return 'dev_secret_key';
};

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Verifies a bearer token and returns the user it belongs to.
// Throws if the token is invalid, the user no longer exists, or the token was revoked by logout.
const authenticate = async (token) => {
  const decoded = jwt.verify(token, getJwtSecret());

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new Error('User no longer exists');
  }

  // Set by logout: tokens issued before this moment are no longer accepted
  if (user.tokensValidAfter && decoded.iat < user.tokensValidAfter) {
    throw new Error('Token has been revoked');
  }

  return user;
};

module.exports = { getJwtSecret, generateToken, authenticate };
