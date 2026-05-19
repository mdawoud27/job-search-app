import { jest } from '@jest/globals';

/* eslint-disable no-var */
var mockSendMailRef;

jest.mock('nodemailer', () => {
  const sendMailFn = jest.fn().mockResolvedValue({ messageId: 'test-id' });
  mockSendMailRef = sendMailFn;
  return {
    default: { createTransport: () => ({ sendMail: sendMailFn }) },
    createTransport: () => ({ sendMail: sendMailFn }),
  };
});

import {
  sendOTPEmail,
  sendEmail,
  sendAcceptanceEmail,
  sendRejectionEmail,
} from '../../src/utils/email.utils.js';

beforeEach(() => {
  if (mockSendMailRef) mockSendMailRef.mockClear();
});

const getLastCallArgs = () => mockSendMailRef.mock.calls[0][0];

/**
 * sendOTPEmail tests
 */
describe('sendOTPEmail', () => {
  it('should call sendMail with default subject when none provided', async () => {
    await sendOTPEmail('user@example.com', '123456');

    expect(mockSendMailRef).toHaveBeenCalledTimes(1);
    const args = getLastCallArgs();
    expect(args.to).toBe('user@example.com');
    expect(args.subject).toBe('Verify your Email');
    expect(args.text).toContain('123456');
  });

  it('should call sendMail with custom subject when provided', async () => {
    await sendOTPEmail('user@example.com', '654321', 'Reset your password');

    const args = getLastCallArgs();
    expect(args.subject).toBe('Reset your password');
    expect(args.text).toContain('654321');
  });
});

/**
 * sendEmail tests
 */
describe('sendEmail', () => {
  it('should call sendMail with the provided options', async () => {
    await sendEmail({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    });

    expect(mockSendMailRef).toHaveBeenCalledTimes(1);
    const args = getLastCallArgs();
    expect(args.from).toBe('sender@example.com');
    expect(args.to).toBe('recipient@example.com');
    expect(args.subject).toBe('Test Subject');
    expect(args.html).toBe('<p>Hello</p>');
  });

  it('should fall back to env USER_EMAIL when from is not provided', async () => {
    await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(mockSendMailRef).toHaveBeenCalledTimes(1);
    const args = getLastCallArgs();
    expect(args.to).toBe('recipient@example.com');
  });
});

/**
 * sendAcceptanceEmail tests
 */
describe('sendAcceptanceEmail', () => {
  it('should include applicant name, job title and company in HTML', async () => {
    await sendAcceptanceEmail(
      'hr@company.com',
      'applicant@example.com',
      'John Doe',
      'Software Engineer',
      'Acme Corp',
    );

    expect(mockSendMailRef).toHaveBeenCalledTimes(1);
    const args = getLastCallArgs();
    expect(args.to).toBe('applicant@example.com');
    expect(args.subject).toContain('Accepted');
    expect(args.html).toContain('John Doe');
    expect(args.html).toContain('Software Engineer');
    expect(args.html).toContain('Acme Corp');
  });
});

/**
 * sendRejectionEmail tests
 */
describe('sendRejectionEmail', () => {
  it('should include applicant name, job title and company in HTML', async () => {
    await sendRejectionEmail(
      'hr@company.com',
      'applicant@example.com',
      'Jane Smith',
      'Product Manager',
      'Beta Corp',
    );

    expect(mockSendMailRef).toHaveBeenCalledTimes(1);
    const args = getLastCallArgs();
    expect(args.to).toBe('applicant@example.com');
    expect(args.subject).toContain('Application');
    expect(args.html).toContain('Jane Smith');
    expect(args.html).toContain('Product Manager');
    expect(args.html).toContain('Beta Corp');
  });
});
