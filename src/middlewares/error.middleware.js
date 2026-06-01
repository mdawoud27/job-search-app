import { AppError } from '../utils/AppError.js';

export class ErrorHandler {
  static notFound(req, res, next) {
    next(new AppError(`NOT FOUND! - ${req.originalUrl}`, 404));
  }

  /* eslint no-unused-vars: off */
  static errorHandler(err, req, res, next) {
    // Handle Mongoose CastError (invalid ObjectId format)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format: ${err.value}`,
      });
    }

    // Handle Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    const statusCode =
      err.statusCode ||
      err.status ||
      (res.statusCode === 200 ? 500 : res.statusCode);
    res.status(statusCode).json({
      success: false,
      message: err.message,
    });
  }
}
