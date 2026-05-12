export class ErrorHandler {
  // 404 handler
  static notFound(req, res, next) {
    const error = new Error(`NOT FOUND! - ${req.originalUrl}`);
    res.status(404);
    next(error);
  }

  /* eslint no-unused-vars: off */
  // global error handler
  static errorHandler(err, req, res, next) {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }
}
