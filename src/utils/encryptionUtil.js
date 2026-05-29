const crypto = require('crypto');

// Derive stable 32-byte key and 16-byte IV from SECRET_KEY env var.
// Using randomBytes caused "bad decrypt" after every server restart because
// Render spins down free-tier servers and generates a new random key on wake.
const secret = process.env.SECRET_KEY || 'fallback-secret-change-in-production';
const key = crypto.createHash('sha256').update(secret).digest();   // 32 bytes
const iv  = crypto.createHash('md5').update(secret).digest();      // 16 bytes

const encrypt = (data) => {
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]).toString("hex");
};

const decrypt = (encryptedData) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([decipher.update(Buffer.from(encryptedData, "hex")), decipher.final()]).toString('utf-8');
};

module.exports = { encrypt, decrypt };
