/**
 * PRICES ROUTES
 * 
 * This module defines all routes related to products and pricing:
 * - Getting all products with current prices (minimum and fair prices)
 * - Updating product prices (single and batch updates)
 * - Getting price history for products
 * - Adding new products
 * - Searching for products
 * 
 * These routes use the pricesController to handle business logic.
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { validateBody, validateQuery } = require('../utils/validator');
const pricesController = require('../controllers/pricesController');

const router = express.Router();

/**
 * @route   GET /api/prices
 * @desc    Get all products with current prices
 * @access  Private
 */
// Temporarily disable authentication for development
// TODO: Re-enable authentication before production
router.get(
  '/', 
  // protect, 
  pricesController.getAllProducts
);

/**
 * @route   PUT /api/prices/batch
 * @desc    Batch update multiple product prices
 * @access  Private
 */
// Temporarily disable authentication for development
// TODO: Re-enable authentication before production
router.put(
  '/batch', 
  // protect, 
  validateBody(['priceUpdates']), 
  pricesController.batchUpdatePrices
);

/**
 * @route   POST /api/prices/product
 * @desc    Add a new product with minimum and fair prices
 * @access  Private
 */
// Temporarily disable authentication for development
// TODO: Re-enable authentication before production
router.post(
  '/product', 
  // protect, 
  validateBody(['name']), 
  pricesController.addProduct
);

/**
 * @route   GET /api/prices/search
 * @desc    Search for products
 * @access  Private
 */
// Temporarily disable authentication for development
// TODO: Re-enable authentication before production
router.get(
  '/search', 
  // protect, 
  validateQuery(['q']), 
  pricesController.searchProducts
);

/**
 * @route   GET /api/prices/trends
 * @desc    Get price trends for multiple products
 * @access  Private
 */
// Temporarily disable authentication for development
// TODO: Re-enable authentication before production
router.get(
  '/trends', 
  // protect, 
  pricesController.getPriceTrends
);

/**
 * @route   PUT /api/prices/:productId
 * @desc    Update a product's minimum and fair prices
 * @access  Private
 */
// Temporarily disable authentication for development
// TODO: Re-enable authentication before production
router.put(
  '/:productId', 
  // protect, 
  validateBody(['minimum_price', 'fair_price']), 
  pricesController.updatePrice
);

/**
 * @route   GET /api/prices/:productId/history
 * @desc    Get price history for a product
 * @access  Private
 */
// Temporarily disable authentication for development
// TODO: Re-enable authentication before production
router.get(
  '/:productId/history', 
  // protect, 
  pricesController.getPriceHistory
);

module.exports = router;
