/**
 * ERROR HANDLING UTILITIES
 * 
 * This module provides functions to standardize error handling throughout the application.
 * It helps reduce boilerplate code in controllers and ensures consistent error responses.
 */

/**
 * Wraps async controller functions to catch errors and forward them to Express error handler
 * This eliminates the need for try/catch blocks in every controller function
 * 
 * @param {Function} fn - The async controller function to wrap
 * @returns {Function} Express middleware function that handles errors
 * 
 * @example
 * // Instead of:
 * router.get('/', async (req, res) => {
 *   try {
 *     // controller logic
 *   } catch (err) {
 *     // error handling
 *   }
 * });
 * 
 * // Use:
 * router.get('/', catchAsync(async (req, res) => {
 *   // controller logic - no try/catch needed
 * }));
 */
exports.catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Creates a standardized API error with status code
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Error object with status code
 */
exports.AppError = class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
};

/**
 * Standard format for database errors
 * 
 * @param {Error} error - The database error
 * @param {string} operation - Description of the operation that failed
 * @returns {Error} Formatted error with additional context
 */
exports.handleDatabaseError = (error, operation = 'Database operation') => {
  console.error(`Database Error (${operation}):`, error.message);
  
  const enhancedError = new this.AppError(
    `${operation} failed: ${error.message}`,
    500
  );
  enhancedError.originalError = error;
  enhancedError.code = error.code || 'UNKNOWN_DB_ERROR';
  
  return enhancedError;
};

/**
 * Global error handler for Express
 * Formats error responses consistently based on environment and error type
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Log error for debugging
  console.error(err);
  
  // Development: send detailed error
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // Production: send cleaner error
  else {
    // Operational errors: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    } 
    // Programming or unknown errors: send generic message
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};
