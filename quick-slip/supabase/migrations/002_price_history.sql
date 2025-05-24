-- Create new tables for the improved price management system

-- Table for current prices (optimized for fast retrieval)
CREATE TABLE IF NOT EXISTS current_prices (
  product_id int REFERENCES products(id) PRIMARY KEY,
  minimum_price numeric NOT NULL,
  fair_price numeric NOT NULL,
  last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  -- Add constraint to ensure minimum_price <= fair_price
  CONSTRAINT min_price_less_than_fair CHECK (minimum_price <= fair_price)
);

-- Table for historical price tracking
CREATE TABLE IF NOT EXISTS price_history (
  id serial PRIMARY KEY,
  product_id int REFERENCES products(id),
  minimum_price numeric NOT NULL,
  fair_price numeric NOT NULL,
  effective_from timestamp with time zone NOT NULL,
  effective_to timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by text, -- For audit purposes
  -- Add constraint to ensure minimum_price <= fair_price
  CONSTRAINT min_price_less_than_fair_history CHECK (minimum_price <= fair_price)
);

-- Index for faster queries on product_id and date ranges
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date_range ON price_history(effective_from, effective_to);

-- Function to automatically update price_history when prices change
CREATE OR REPLACE FUNCTION update_price_history()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an update of an existing price
  IF (TG_OP = 'UPDATE') THEN
    -- Close the current period for this product by setting effective_to
    UPDATE price_history
    SET effective_to = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id AND effective_to IS NULL;
  END IF;
  
  -- Insert the new price record into history
  INSERT INTO price_history (product_id, minimum_price, fair_price, effective_from)
  VALUES (NEW.product_id, NEW.minimum_price, NEW.fair_price, CURRENT_TIMESTAMP);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain price history when current prices are updated
CREATE TRIGGER trg_current_prices_history
AFTER INSERT OR UPDATE ON current_prices
FOR EACH ROW
EXECUTE FUNCTION update_price_history();

-- Migration function to populate current_prices from existing price_board data
CREATE OR REPLACE FUNCTION migrate_price_board_data()
RETURNS void AS $$
DECLARE
  product record;
  latest_price record;
BEGIN
  -- For each product
  FOR product IN SELECT id FROM products LOOP
    -- Find the latest price from price_board
    SELECT pb.* 
    INTO latest_price
    FROM price_board pb
    WHERE pb.product_id = product.id
    ORDER BY pb.effective_date DESC
    LIMIT 1;
    
    -- If a price exists, add it to current_prices (convert single price to both min and fair)
    IF FOUND THEN
      INSERT INTO current_prices (product_id, minimum_price, fair_price, last_updated)
      VALUES (latest_price.product_id, latest_price.price, latest_price.price, latest_price.effective_date)
      ON CONFLICT (product_id) DO UPDATE 
      SET minimum_price = EXCLUDED.minimum_price,
          fair_price = EXCLUDED.fair_price,
          last_updated = EXCLUDED.last_updated;
      
      -- Also add to price_history (convert single price to both min and fair)
      INSERT INTO price_history (product_id, minimum_price, fair_price, effective_from)
      VALUES (latest_price.product_id, latest_price.price, latest_price.price, latest_price.effective_date);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_price_board_data();

-- Create view for easy retrieval of products with current prices
CREATE OR REPLACE VIEW product_prices AS
SELECT 
  p.id,
  p.name,
  p.default_unit,
  p.aliases,
  cp.minimum_price,
  cp.fair_price,
  cp.last_updated
FROM 
  products p
LEFT JOIN 
  current_prices cp ON p.id = cp.product_id;
