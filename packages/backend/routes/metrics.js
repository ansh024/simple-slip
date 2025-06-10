/**
 * METRICS ROUTES
 * 
 * Routes for accessing and analyzing metrics data
 */

const express = require('express');
const router = express.Router();
const { catchAsync } = require('../utils/errorHandler');
const metricsService = require('../utils/metricsService');

/**
 * @desc    Get voice recognition accuracy metrics
 * @route   GET /api/metrics/voice
 * @access  Private
 */
router.get('/voice', catchAsync(async (req, res) => {
  const filters = {
    shopId: req.query.shopId ? parseInt(req.query.shopId) : null,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  
  const analytics = await metricsService.getVoiceAnalytics(filters);
  
  res.json({
    success: true,
    data: analytics
  });
}));

module.exports = router;
