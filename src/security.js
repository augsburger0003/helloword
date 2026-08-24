const crypto = require("node:crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password, storedValue) {
  if (!storedValue || !storedValue.includes(":")) return false;
  const [saltHex, hashHex] = storedValue.split(":");
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = crypto.scryptSync(password, salt, expected.length);
    return (
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function tokenDigest(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { createToken, hashPassword, tokenDigest, verifyPassword };