const fs = require('fs');
const csv = require('csv-parser');
const { supabase } = require('../database/supabase'); // Adjust path if your supabase client is elsewhere

// --- Configuration ---
// IMPORTANT: Place your 'BigBasket Products.csv' file in the 'scripts' directory or update path here
const CSV_FILE_PATH = require('path').join(__dirname, 'BigBasket Products.csv'); 
const BATCH_SIZE = 50; // How many products to process and insert at a time
const DELAY_BETWEEN_BATCHES_MS = 1500; // Delay in milliseconds

// --- Helper Functions ---

/**
 * Attempts to infer the unit from the product title or defaults to 'pc'.
 * @param {string} productTitle - The title of the product.
 * @param {string} category - The category of the product (optional fallback).
 * @returns {string} The inferred unit (e.g., 'kg', 'g', 'ml', 'l', 'pc').
 */
const inferUnit = (productTitle, category = '') => {
  if (!productTitle) return 'pc';
  const title = productTitle.toLowerCase();

  // More comprehensive regex for units, including variations and optional space
  const unitRegex = /(\d+\.?\d*)\s*(kg|kilogram|kilo|g|gram|ml|milliliter|l|ltr|litre|pc|pcs|piece|dozen|mtr|meter|pack|pkt|sachet|box|btl|bottle|can|tin|jar|set|pair|bundle|roll|sheet)(?:s)?\b/i;
  const match = title.match(unitRegex);

  if (match && match[2]) {
    let unit = match[2].toLowerCase();
    if (['kilogram', 'kilo'].includes(unit)) return 'kg';
    if (unit === 'gram') return 'g';
    if (unit === 'milliliter') return 'ml';
    if (['ltr', 'litre'].includes(unit)) return 'l';
    if (['pcs', 'piece'].includes(unit)) return 'pc';
    if (['pkt', 'sachet'].includes(unit)) return 'pkt';
    if (unit === 'bottle') return 'btl';
    // Add more mappings as needed
    return unit; // Return the matched unit if it's one of the common ones
  }

  // Fallback based on category (very basic, expand as needed)
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('oil') || lowerCategory.includes('juice') || lowerCategory.includes('beverages')) return 'l';
  if (lowerCategory.includes('rice') || lowerCategory.includes('atta') || lowerCategory.includes('dal') || lowerCategory.includes('fruits & vegetables')) return 'kg';
  if (lowerCategory.includes('spices') || lowerCategory.includes('masala')) return 'g';
  
  return 'pc'; // Default unit
};

/**
 * Main function to import products from CSV to Supabase.
 */
async function importProducts() {
  console.log('Starting product import...');
  let productsBuffer = [];
  let processedRows = 0;
  let newProductsCount = 0;
  let newPricesCount = 0;
  let batch = []; // Holds rows from CSV for current batch
  let streamPaused = false;

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`ERROR: CSV file not found. Expected at: ${CSV_FILE_PATH}`);
    console.log('Please ensure \'BigBasket Products.csv\' is in the same directory as this script (the /scripts directory).');
    return;
  }

  const fileStream = fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', async (row) => {
      processedRows++;
      const productName = row['product'] ? row['product'].trim() : null;
      let salePrice = parseFloat(row['sale_price']);
      if (isNaN(salePrice)) salePrice = 0; 

      const brand = row['brand'] ? row['brand'].trim() : 'Unknown';
      const category = row['category'] ? row['category'].trim() : '';
      const defaultUnit = inferUnit(productName, category);

      if (!productName) {
        return;
      }
      
      batch.push({
        name: productName,
        _unit: defaultUnit,
        _brand: brand,
        _price: salePrice // Ensure _price is part of the batch item
      });

      if (batch.length >= BATCH_SIZE) {
        fileStream.pause(); 
        streamPaused = true;
        
        const currentBatchToProcess = [...batch];
        batch = []; 
        
        try {
            const { newProds, newPrices } = await processBatch(currentBatchToProcess);
            newProductsCount += newProds;
            newPricesCount += newPrices;
        } catch (e) {
            console.error('Error during processBatch call in on("data") handler:', e);
        }
        
        if (DELAY_BETWEEN_BATCHES_MS > 0) {
          console.log(`Pausing for ${DELAY_BETWEEN_BATCHES_MS / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
        }
        
        if (fileStream.isPaused()) {
           fileStream.resume(); 
        }
        streamPaused = false;
      }
    })
    .on('end', async () => {
      console.log('CSV file successfully processed. All rows read.');
      if (streamPaused) {
        // A small delay to ensure any final stream activities clear up if it was paused right before 'end'
        await new Promise(resolve => setTimeout(resolve, 200)); 
      }
      
      if (batch.length > 0) { 
        try {
            const { newProds, newPrices } = await processBatch(batch);
            newProductsCount += newProds;
            newPricesCount += newPrices;
        } catch (e) {
            console.error('Error during final processBatch call in on("end") handler:', e);
        }
      }

      console.log('\n--- Import Summary ---');
      console.log('Product import finished.');
      console.log(`Total rows read from CSV: ${processedRows}`);
      console.log(`New products added: ${newProductsCount}`);
      console.log(`New price entries added: ${newPricesCount}`);
      console.log('------------------------------------');
    })
    .on('error', (error) => {
      console.error('Error reading or processing CSV:', error);
    });
}

/**
 * Processes a batch of products: inserts them and their prices.
 * @param {Array<Object>} batch - An array of product data objects.
 */
async function processBatch(batchToProcess) {
  console.log(`Processing batch of ${batchToProcess.length} products...`);
  let newProductsInsertedCount = 0;
  let newPriceEntriesCount = 0;

  const productsToAttemptInsert = [];
  const price_board_entries = [];
  const productsToInsertPricesFor = new Map(); 

  const uniqueProductKeysInBatch = new Set();
  const uniqueProductsInBatch = batchToProcess.filter(p => {
    const key = `${p.name}-${p._unit}-${p._brand}`;
    if (!uniqueProductKeysInBatch.has(key)) {
      uniqueProductKeysInBatch.add(key);
      return true;
    }
    return false;
  });

  const existingProductsDbMap = new Map();

  if (uniqueProductsInBatch.length > 0) {
    const orFilterConditions = uniqueProductsInBatch.map(p => {
      const nameVal = p.name;
      const unitVal = p._unit;
      const brandVal = p._brand;
      return `and(name.eq.${encodeURIComponent(nameVal)},default_unit.eq.${encodeURIComponent(unitVal)},brand.eq.${encodeURIComponent(brandVal)})`;
    }).join(',');

    try {
      const { data: foundProducts, error: batchCheckError } = await supabase
        .from('products')
        .select('id, name, default_unit, brand')
        .or(orFilterConditions);

      if (batchCheckError) {
        console.error(`Error batch checking for existing products:`, batchCheckError.message || batchCheckError);
        if (batchCheckError.details) console.error('Details:', batchCheckError.details);
        if (batchCheckError.hint) console.error('Hint:', batchCheckError.hint);
        if (batchCheckError.code) console.error('Code:', batchCheckError.code);
      } else if (foundProducts) {
        for (const ep of foundProducts) {
          existingProductsDbMap.set(`${ep.name}-${ep.default_unit}-${ep.brand}`, ep.id);
        }
      }
    } catch (e) {
      console.error(`Exception during batch product check:`, e);
    }
  }

  for (const p of uniqueProductsInBatch) {
    const key = `${p.name}-${p._unit}-${p._brand}`;
    if (existingProductsDbMap.has(key)) {
      // Product exists. Skipping product insert.
    } else {
      productsToAttemptInsert.push({
        name: p.name,
        default_unit: p._unit,
        brand: p._brand,
      });
      if (typeof p._price === 'number' && !isNaN(p._price) && p._price > 0) { // Also check if price > 0
        productsToInsertPricesFor.set(key, p._price);
      }
    }
  }

  if (productsToAttemptInsert.length > 0) {
    const { data: insertedProductsData, error: productInsertError } = await supabase
      .from('products')
      .insert(productsToAttemptInsert)
      .select('id, name, default_unit, brand'); // Important: select the inserted data

    if (productInsertError) {
      console.error('Error inserting products batch:', productInsertError.message);
      if (productInsertError.details) console.error('Details:', productInsertError.details);
      if (productInsertError.hint) console.error('Hint:', productInsertError.hint);
      if (productInsertError.code) console.error('Code:', productInsertError.code);
    } else if (insertedProductsData && insertedProductsData.length > 0) {
      newProductsInsertedCount = insertedProductsData.length;
      console.log(`  BATCH REPORT: ${newProductsInsertedCount} new products inserted.`);
      insertedProductsData.forEach(newProd => {
        const key = `${newProd.name}-${newProd.default_unit}-${newProd.brand}`;
        if (productsToInsertPricesFor.has(key)) {
          const price = productsToInsertPricesFor.get(key);
          price_board_entries.push({
            product_id: newProd.id,
            price: price,
            effective_date: new Date()
          });
        }
      });
    } else if (insertedProductsData) { // Insert succeeded but returned empty or null (should not happen with .select() if rows inserted)
       console.log('  BATCH REPORT: Product insert call succeeded but returned no data (0 products effectively inserted).');
    }
  } else {
     console.log('  BATCH REPORT: 0 new products to insert in this batch (all were duplicates or invalid).');
  }

  if (price_board_entries.length > 0) {
    const { error: priceError } = await supabase
      .from('price_board')
      .insert(price_board_entries);

    if (priceError) {
      console.error('Error inserting prices batch:', priceError.message);
    } else {
      newPriceEntriesCount = price_board_entries.length;
      console.log(`  BATCH REPORT: ${newPriceEntriesCount} new price entries added.`);
    }
  }
  return { newProds: newProductsInsertedCount, newPrices: newPriceEntriesCount };
}

// --- Run the Import ---
if (require.main === module) {
  importProducts().catch(err => {
    console.error('Unhandled error during import process:', err);
    process.exit(1);
  });
}

module.exports = { importProducts, inferUnit };
