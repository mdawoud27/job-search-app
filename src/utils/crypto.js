import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Get the key from environment variables and ensure it's the correct length
const getEncryptionKey = () => {
  const envKey = process.env.envKey;

  if (!envKey) {
    // Create a deterministic key for development (don't use in production)
    return crypto
      .createHash('sha256')
      .update('development-fallback-key')
      .digest();
  }

  // If key is provided as hex string, convert to buffer
  if (envKey.length === 64 && /^[0-9a-f]+$/i.test(envKey)) {
    /* eslint no-undef: off */
    return Buffer.from(envKey, 'hex');
  }

  // If key is provided as base64 string
  if (envKey.length === 44 && envKey.endsWith('==')) {
    return Buffer.from(envKey, 'base64');
  }

  // Otherwise, hash the provided string to get a 32-byte key
  return crypto.createHash('sha256').update(envKey).digest();
};

// Create a 32-byte key (256 bits)
const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text) {
  try {
    // Validate input
    if (!text) {
      return text;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted text
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error(`Encryption error: ${error.message}`);
  }
}

export function decrypt(encryptedText) {
  try {
    // Validate input
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText;
    }

    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      return encryptedText; // Not in the expected format
    }

    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];

    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

    // Decrypt the text
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption error: ${error.message}`);
  }
}

// Export a function to generate a secure key (for initial setup)
export function generateSecureKey() {
  return crypto.randomBytes(32).toString('hex');
}
