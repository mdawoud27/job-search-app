import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const getEncryptionKey = () => {
  const envKey = process.env.envKey;

  if (!envKey) {
    return crypto
      .createHash('sha256')
      .update('development-fallback-key')
      .digest();
  }

  if (envKey.length === 64 && /^[0-9a-f]+$/i.test(envKey)) {
    /* eslint no-undef: off */
    return Buffer.from(envKey, 'hex');
  }

  if (envKey.length === 44 && envKey.endsWith('==')) {
    return Buffer.from(envKey, 'base64');
  }

  return crypto.createHash('sha256').update(envKey).digest();
};

// Create a 32-byte key (256 bits)
const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16;

// Encrept
export function encrypt(text) {
  try {
    if (!text) {
      return text;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error(`Encryption error: ${error.message}`);
  }
}

// decrept
export function decrypt(encryptedText) {
  try {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText;
    }

    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      return encryptedText;
    }

    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption error: ${error.message}`);
  }
}

export function generateSecureKey() {
  return crypto.randomBytes(32).toString('hex');
}
