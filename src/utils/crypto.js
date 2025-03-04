import crypto from 'crypto';

const ENCRYPTION_KEY = crypto.randomBytes(32); // 256-bit key
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
    if (!encryptedText) {
      return encryptedText;
    }

    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts[0], 'hex'); /* eslint-disable-line */
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
