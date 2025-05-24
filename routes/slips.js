/**
 * SLIPS ROUTES
 * 
 * This module defines all routes related to sales slips:
 * - Creating new slips
 * - Retrieving single slip or all slips
 * - Generating PDF receipts
 * - Getting daily summary
 * 
 * These routes use the slipsController to handle business logic.
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { validateBody, validateId } = require('../utils/validator');
const slipsController = require('../controllers/slipsController');

const router = express.Router();

/**
 * @route   POST /api/slips
 * @desc    Create a new slip
 * @access  Private
 */
router.post(
  '/', 
  protect, 
  validateBody(['customerName', 'items']), 
  slipsController.createSlip
);

/**
 * @route   GET /api/slips
 * @desc    Get all slips with pagination
 * @access  Private
 */
router.get(
  '/', 
  protect, 
  slipsController.getAllSlips
);

/**
 * @route   GET /api/slips/next-number
 * @desc    Get next available slip number
 * @access  Private
 */
router.get(
  '/next-number',
  protect,
  slipsController.getNextSlipNumber
);

/**
 * @route   GET /api/slips/summary/today
 * @desc    Get today's sales summary
 * @access  Private
 */
router.get(
  '/summary/today', 
  protect, 
  slipsController.getTodaySummary
);

// PDF routes removed to simplify the application

/**
 * @route   GET /api/slips/:id
 * @desc    Get a single slip by ID
 * @access  Private
 */
router.get(
  '/:id', 
  protect, 
  validateId(), 
  slipsController.getSlipById
);

/**
 * @route   DELETE /api/slips/:id
 * @desc    Delete a slip by ID
 * @access  Private
 */
router.delete(
  '/:id',
  protect,
  validateId(),
  slipsController.deleteSlip
);

module.exports = router;
