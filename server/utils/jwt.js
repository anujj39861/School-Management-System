const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
  console.error('FATAL: JWT_SECRET missing in environment');
}

function generateToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

module.exports = { generateToken, verifyToken };
