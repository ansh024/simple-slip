/**
 * REQUEST VALIDATION UTILITIES
 * 
 * This module provides middleware for validating request data.
 * It helps ensure that incoming requests have the required data before processing.
 * This prevents errors due to missing or invalid data.
 */

/**
 * Validates that required fields are present in the request body
 * 
 * @param {Array} requiredFields - Array of field names that must be present
 * @returns {Function} Express middleware function that validates request
 * 
 * @example
 * // Ensure request has customerName and items fields
 * router.post('/', validateBody(['customerName', 'items']), controller.createSlip);
 */
exports.validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Validates that a numeric ID is present in the request parameters
 * 
 * @returns {Function} Express middleware function that validates request
 * 
 * @example
 * // Ensure request has a valid ID parameter
 * router.get('/:id', validateId(), controller.getSlipById);
 */
exports.validateId = () => {
  return (req, res, next) => {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID parameter is required'
      });
    }
    
    next();
  };
};

/**
 * Validates that query parameters are present in the request
 * 
 * @param {Array} requiredParams - Array of query parameter names that must be present
 * @returns {Function} Express middleware function that validates request
 * 
 * @example
 * // Ensure request has 'q' query parameter
 * router.get('/search', validateQuery(['q']), controller.searchProducts);
 */
exports.validateQuery = (requiredParams) => {
  return (req, res, next) => {
    const missingParams = [];
    
    for (const param of requiredParams) {
      if (req.query[param] === undefined) {
        missingParams.push(param);
      }
    }
    
    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required query parameters: ${missingParams.join(', ')}`
      });
    }
    
    next();
  };
};
