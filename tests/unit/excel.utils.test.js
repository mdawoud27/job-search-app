import { generateApplicationsExcel } from '../../src/utils/excel.utils.js';

const makeApp = (overrides = {}) => ({
  _id: { toString: () => 'app_123' },
  jobId: { jobTitle: 'Software Engineer' },
  userId: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  status: 'pending',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  userCV: { secure_url: 'https://example.com/cv.pdf' },
  ...overrides,
});

/**
 * generateApplicationsExcel tests
 */
describe('generateApplicationsExcel', () => {
  it('should return a Buffer', async () => {
    const applications = [makeApp()];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle accepted status styling without error', async () => {
    const applications = [makeApp({ status: 'accepted' })];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle rejected status styling without error', async () => {
    const applications = [makeApp({ status: 'rejected' })];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle in consideration status styling without error', async () => {
    const applications = [makeApp({ status: 'in consideration' })];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle default/other status styling without error', async () => {
    const applications = [makeApp({ status: 'viewed' })];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle missing jobId gracefully', async () => {
    const applications = [makeApp({ jobId: null })];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle missing userId gracefully', async () => {
    const applications = [makeApp({ userId: null })];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle missing userCV gracefully', async () => {
    const applications = [makeApp({ userCV: null })];
    const result = await generateApplicationsExcel(
      applications,
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle an empty applications array', async () => {
    const result = await generateApplicationsExcel(
      [],
      'Test Company',
      '2024-01-15',
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should handle multiple applications', async () => {
    const applications = [
      makeApp({ status: 'accepted' }),
      makeApp({ _id: { toString: () => 'app_456' }, status: 'rejected' }),
      makeApp({
        _id: { toString: () => 'app_789' },
        status: 'in consideration',
      }),
    ];
    const result = await generateApplicationsExcel(
      applications,
      'Acme Corp',
      '2024-02-20',
    );
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });
});
