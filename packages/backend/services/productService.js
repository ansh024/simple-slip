/**
 * PRODUCT SERVICE
 * 
 * Service for matching product names from voice input to actual products in the database.
 * Uses fuzzy matching algorithms for better accuracy in product identification.
 */

const { pool } = require('../database/db');

/**
 * Find products by name using fuzzy matching
 * @param {string} name - Product name to match
 * @param {number} shopId - Shop ID to filter products by
 * @param {number} threshold - Match threshold (0-100)
 * @returns {Promise<Array>} Matched products
 */
async function findProductsByNameFuzzy(name, shopId, threshold = 60) {
  try {
    // First try exact matching
    const exactResult = await pool.query(`
      SELECT id, name, default_unit
      FROM products 
      WHERE (name ILIKE $1 OR $1 = ANY(aliases))
      ORDER BY name
    `, [`%${name}%`]);
    
    if (exactResult.rows.length > 0) {
      return exactResult.rows.map(product => ({
        ...product,
        matchScore: 100,
        matchType: 'exact'
      }));
    }
    
    // If no exact match, try similarity matching
    // Note: This assumes PostgreSQL has the pg_trgm extension enabled
    const fuzzyResult = await pool.query(`
      SELECT 
        id, name, default_unit,
        SIMILARITY(LOWER(name), LOWER($1)) * 100 as match_score
      FROM products
      ORDER BY match_score DESC
      LIMIT 5
    `, [name]);
    
    return fuzzyResult.rows
      .filter(product => product.match_score >= threshold)
      .map(product => ({
        ...product,
        matchScore: Math.round(product.match_score),
        matchType: 'fuzzy'
      }));
      
  } catch (error) {
    console.error('Error in product matching:', error);
    return [];
  }
}

/**
 * Get current price for a product
 * @param {number} productId - Product ID
 * @returns {Promise<number>} Current price
 */
async function getCurrentPrice(productId) {
  try {
    const result = await pool.query(`
      SELECT price 
      FROM price_board
      WHERE product_id = $1
      ORDER BY effective_date DESC
      LIMIT 1
    `, [productId]);
    
    return result.rows.length > 0 ? result.rows[0].price : null;
  } catch (error) {
    console.error('Error getting product price:', error);
    return null;
  }
}

/**
 * Match voice-extracted items to products in database
 * @param {Array} items - Array of items extracted from voice
 * @returns {Promise<Object>} Matching results with stats
 */
async function matchItemsToProducts(items) {
  const results = {
    matchedItems: [],
    unmatchedItems: [],
    matchRate: 0,
    totalItems: items.length,
    matchedCount: 0
  };
  
  if (!items || items.length === 0) {
    return results;
  }
  
  for (const item of items) {
    const matchedProducts = await findProductsByNameFuzzy(item.name);
    
    if (matchedProducts.length > 0) {
      const bestMatch = matchedProducts[0];
      const price = await getCurrentPrice(bestMatch.id) || item.rate;
      
      results.matchedItems.push({
        ...item,
        productId: bestMatch.id,
        matchedName: bestMatch.name,
        matchScore: bestMatch.matchScore,
        unit: item.unit || bestMatch.default_unit,
        rate: price || item.rate
      });
      
      results.matchedCount++;
    } else {
      results.unmatchedItems.push(item);
    }
  }
  
  results.matchRate = items.length > 0 ? 
    Math.round((results.matchedCount / items.length) * 100) : 0;
    
  return results;
}

module.exports = {
  findProductsByNameFuzzy,
  getCurrentPrice,
  matchItemsToProducts
};
