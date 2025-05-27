/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * This middleware validates JWT tokens to protect API routes.
 * It ensures that only authenticated users can access protected endpoints.
 * 
 * HOW IT WORKS:
 * 1. It extracts the JWT token from the Authorization header
 * 2. It verifies the token using the JWT_SECRET from environment variables
 * 3. If valid, it adds the user data to the request object and allows the request to proceed
 * 4. If invalid, it returns a 401 Unauthorized response
 * 
 * This middleware should be added to any route that requires authentication.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError, catchAsync } = require('../utils/errorHandler');

/**
 * Middleware function to protect routes from unauthorized access
 * Use this by adding it as a parameter in your route definition:
 * router.get('/protected-route', protect, yourControllerFunction);
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Extract token from Authorization header
  // The header should be in format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Split the header and get the token part
    token = req.headers.authorization.split(' ')[1];
  }

  // 2. Check if token exists
  if (!token) {
    throw new AppError('Not authorized to access this route. No token provided.', 401);
  }

  try {
    // 3. Verify token
    // This will throw an error if the token is invalid or expired
    const decoded = jwt.verify(token, config.jwt.secret);

    // 4. Add user data to request object
    // This makes the user information available to the route handler
    req.user = {
      id: decoded.id,
      phone: decoded.phone,
      role: decoded.role,
      shop_id: decoded.shop_id
    };

    // 5. Proceed to the route handler
    next();
  } catch (error) {
    // Handle token verification errors
    throw new AppError('Not authorized to access this route. Invalid token.', 401);
  }
});
