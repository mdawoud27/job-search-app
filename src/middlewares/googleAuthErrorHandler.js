// // // src/middlewares/googleAuthErrorHandler.js
// // export const googleAuthErrorHandler = (err, req, res, next) => {
// //   // Log the entire error object for debugging
// //   console.error('Authentication Error:', err);

// //   // Check if error exists before accessing properties
// //   if (err) {
// //     // Handle specific error types
// //     switch (err.name) {
// //       case 'InternalOAuthError':
// //         return res.status(500).json({
// //           message: 'Authentication failed',
// //           error: 'Google OAuth configuration error'
// //         });

// //       case 'TokenError':
// //         return res.status(401).json({
// //           message: 'Token validation failed',
// //           error: 'Invalid or expired token'
// //         });

// //       case 'AuthenticationError':
// //         return res.status(401).json({
// //           message: 'Authentication failed',
// //           error: err.message || 'Unable to authenticate'
// //         });

// //       default:
// //         // Generic error handler
// //         return res.status(500).json({
// //           message: 'Internal server error',
// //           error: err.message || 'An unexpected error occurred'
// //         });
// //     }
// //   }

// //   // If no specific error is found, pass to default error handler
// //   next(err);
// // };

// // Alternative approach with more defensive programming
// export const googleAuthErrorHandler = (err, req, res, next) => {
//   try {
//     console.error('Authentication Error:', err);

//     // Ensure err is an object
//     const error = err || {};

//     // Fallback error message
//     const errorMessage = error.message || 'Authentication failed';
//     const errorName = error.name || 'UnknownError';

//     // Determine appropriate status code
//     const statusCode =
//       errorName === 'InternalOAuthError'
//         ? 500
//         : errorName === 'TokenError'
//           ? 401
//           : errorName === 'AuthenticationError'
//             ? 401
//             : 500;

//     res.status(statusCode).json({
//       message: 'Authentication error',
//       error: errorMessage,
//       errorType: errorName,
//     });
//   } catch (handlerError) {
//     // Absolute last resort error handler
//     console.error('Error in error handler:', handlerError);
//     res.status(500).json({
//       message: 'Critical error',
//       error: 'Unable to process error',
//     });
//     next(handlerError);
//   }
//   next();
// };
