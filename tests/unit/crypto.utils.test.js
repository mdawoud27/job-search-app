import { encrypt, decrypt, generateSecureKey } from '../../src/utils/crypto.js';

/**
 * encrypt tests
 */
describe('encrypt', () => {
  it('should return a string in iv:encrypted format', () => {
    const result = encrypt('hello world');
    expect(typeof result).toBe('string');
    const parts = result.split(':');
    expect(parts).toHaveLength(2);
    // IV is 16 bytes = 32 hex chars
    expect(parts[0]).toHaveLength(32);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it('should return different ciphertext each call (random IV)', () => {
    const a = encrypt('hello');
    const b = encrypt('hello');
    expect(a).not.toBe(b);
  });

  it('should return null when input is null', () => {
    expect(encrypt(null)).toBeNull();
  });

  it('should return undefined when input is undefined', () => {
    expect(encrypt(undefined)).toBeUndefined();
  });

  it('should return empty string when input is empty string', () => {
    expect(encrypt('')).toBe('');
  });
});

/**
 * decrypt tests
 */
describe('decrypt', () => {
  it('should decrypt a previously encrypted value', () => {
    const original = 'my secret number';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should return input unchanged when it has no colon', () => {
    const input = 'notencrypted';
    expect(decrypt(input)).toBe(input);
  });

  it('should return input unchanged when it has more than 2 colon-separated parts', () => {
    const input = 'a:b:c';
    expect(decrypt(input)).toBe(input);
  });

  it('should return null when input is null', () => {
    expect(decrypt(null)).toBeNull();
  });

  it('should return undefined when input is undefined', () => {
    expect(decrypt(undefined)).toBeUndefined();
  });

  it('should return empty string when input is empty string', () => {
    expect(decrypt('')).toBe('');
  });
});

/**
 * Round-trip tests
 */
describe('encrypt/decrypt round-trip', () => {
  const testCases = [
    'simple text',
    '01234567890',
    'Special ch@rs! #$%',
    '   spaces   ',
    'a'.repeat(100),
  ];

  testCases.forEach((text) => {
    it(`should round-trip: "${text.slice(0, 30)}"`, () => {
      expect(decrypt(encrypt(text))).toBe(text);
    });
  });
});

/**
 * generateSecureKey tests
 */
describe('generateSecureKey', () => {
  it('should return a 64-character hex string', () => {
    const key = generateSecureKey();
    expect(typeof key).toBe('string');
    expect(key).toHaveLength(64);
    expect(/^[0-9a-f]+$/i.test(key)).toBe(true);
  });

  it('should return a different key each call', () => {
    const key1 = generateSecureKey();
    const key2 = generateSecureKey();
    expect(key1).not.toBe(key2);
  });
});
