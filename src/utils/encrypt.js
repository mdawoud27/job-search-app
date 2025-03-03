import crypto from 'crypto';

export const encrypt = (text) => {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    process.env.ENCRYPTION_KEY /* eslint-disable-line */,
    process.env.ENCRYPTION_IV /* eslint-disable-line */,
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};
