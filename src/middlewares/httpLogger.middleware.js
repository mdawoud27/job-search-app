import logger from '../config/logger.js';

export function httpLogger(req, res, next) {
  const start = Date.now();

  const sanitizedUrl = new URL(req.originalUrl, 'http://localhost');
  ['accessToken', 'refreshToken', 'token', 'code'].forEach((key) => {
    if (sanitizedUrl.searchParams.has(key)) {
      sanitizedUrl.searchParams.set(key, '[REDACTED]');
    }
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](
      `${req.method} ${sanitizedUrl.pathname}${sanitizedUrl.search} ${res.statusCode}`,
      {
        requestId: req.requestId,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      },
    );
  });

  next();
}
