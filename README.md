# Simple Slip Backend

A voice-first backend for tier-3 kirana shops, built with Node.js, Express, and Supabase.

## 📋 Overview

Simple Slip is designed for small grocery and kirana shop owners who need a simple way to create sales slips without typing. The application uses voice input to create sales slips quickly, making it accessible for shop owners with varying levels of technical expertise.

## ✨ Features

- 🎤 **Voice-First Input**: Create slips by speaking the items, quantities, and prices
- 📄 **Quick Slip Creation**: Create sales slips with minimal effort
- 💰 **Enhanced Price Management**: Keep track of product prices with minimum and fair pricing, plus historical price tracking
- 📱 **WhatsApp Integration**: Receive daily sales summaries via WhatsApp
- 🌐 **Multi-Language Support**: Works with Hindi, English, and regional Indian languages
- 📊 **Daily Summaries**: Get an overview of your daily sales

## 🔧 Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **Simplified Architecture**: Streamlined codebase for easier maintenance
- **Voice Processing**: Ready for Google Speech-to-Text integration
- **Messaging**: Ready for Twilio WhatsApp integration

## 🗄️ Database Schema

The application uses the following Supabase tables:

### products
- `id`: Unique identifier for the product
- `name`: Name of the product
- `default_unit`: Default unit of measurement (kg, g, piece, etc.)
- `aliases`: Array of alternative names for the product

### slips
- `id`: UUID for the slip
- `slip_no`: Auto-generated sequential number
- `slip_date`: Date of the transaction
- `shop_id`: ID of the shop
- `customer_name`: Name of the customer
- `gst_required`: Whether GST is applicable
- `subtotal`: Sum of all items before discount
- `discount`: Discount amount
- `total`: Final amount after discount

### slip_items
- `id`: Unique identifier for the slip item
- `slip_id`: Reference to the parent slip
- `product_id`: Reference to the product
- `qty`: Quantity purchased
- `unit`: Unit of measurement
- `rate`: Price per unit
- `line_total`: Total for this line item (qty * rate)

### current_prices
- `product_id`: Reference to the product
- `minimum_price`: Minimum acceptable price for the product
- `fair_price`: Recommended fair price for the product (must be >= minimum_price)
- `effective_date`: Date from which the price is effective

### price_history
- `id`: Unique identifier for the price history record
- `product_id`: Reference to the product
- `minimum_price`: Previous minimum price for the product
- `fair_price`: Previous fair price for the product
- `effective_from`: Start date of this price
- `effective_to`: End date of this price (NULL for current prices)

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Steps

1. **Clone the repository:**
```bash
git clone <repository-url>
cd simple-slip-backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment variables:**
```bash
cp .env.example .env
```

4. **Update the .env file with your credentials:**
```
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

5. **Start the development server:**
```bash
npm run dev
```

6. **For production:**
```bash
npm start
```

## 📚 Code Structure

The codebase follows an MVC-like architecture for better organization and maintainability:

```
simple-slip-backend/
├── config/
│   └── index.js             # Centralized configuration management
├── controllers/             # Business logic for routes
│   ├── authController.js    # Authentication logic
│   ├── pricesController.js  # Product price management
│   ├── slipsController.js   # Sales slip operations
│   ├── voiceController.js   # Voice processing
│   └── whatsappController.js # WhatsApp integration
├── database/
│   └── supabase.js          # Supabase client configuration
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/                  # API route definitions
│   ├── auth.js              # Authentication routes
│   ├── prices.js            # Product and price routes
│   ├── slips.js             # Sales slip routes
│   ├── voice.js             # Voice processing routes
│   └── whatsapp.js          # WhatsApp integration routes
├── services/
│   └── pdfService.js        # PDF generation service
├── utils/                   # Utility functions
│   ├── errorHandler.js      # Error handling utilities
│   └── validator.js         # Request validation utilities
├── public/                  # Static files
│   └── index.html           # Landing page
├── server.js                # Main application entry point
└── package.json             # Dependencies and scripts
```

## 💾 Data Import Script

The project includes a utility script for bulk importing products and their initial prices from a CSV file into the Supabase database.

- **Location**: `scripts/importProducts.js`
- **Input CSV File**: Expects a CSV file at `data/products_with_prices.csv` (configurable in the script).

### Purpose

This script is designed to populate the `products` and `price_board` tables. It's particularly useful for initial data setup or when migrating from another system.

### Key Features & Behavior

- Reads product data (name, brand, category, sale price) from the specified CSV file.
- Infers a `default_unit` for each product based on its title and category (e.g., 'kg', 'g', 'pc').
- Processes products in batches to manage load on the Supabase API and database.
- Performs a batch check for existing products (based on name, unit, and brand) before attempting to insert, to minimize duplicates.
- Inserts new products into the `products` table.
- Inserts the corresponding sale price for each new product into the `price_board` table with the current date as the `effective_date`.
- Provides a console summary of the import process, including total rows read, new products added, and new price entries added.

### How to Run

Navigate to the project's root directory and execute:

```bash
node scripts/importProducts.js
```

### Important Considerations

- **Configuration**: The path to the input CSV file (`CSV_FILE_PATH`), batch size (`BATCH_SIZE`), and delay between batches (`DELAY_BETWEEN_BATCHES_MS`) are configurable at the top of the `importProducts.js` script.
- **Data Integrity & Re-runs**: 
    - If you need to re-run the import after a partial success or to refresh all data, it's highly recommended to first clear the existing data from the target tables to avoid potential duplicate entries or inconsistencies. You can do this using the following SQL commands in your Supabase SQL editor:
      ```sql
      TRUNCATE TABLE products RESTART IDENTITY CASCADE;
      TRUNCATE TABLE price_board RESTART IDENTITY CASCADE;
      ```
    - **Duplicate Check Filter Note**: The current duplicate check mechanism uses `encodeURIComponent` for product names, units, and brands. While this handles many special characters, characters like parentheses `()` or commas `,` within these fields might not be perfectly escaped for the Supabase filter string, potentially leading to a `PGRST100` parsing error for that batch's check. If this occurs, the script currently proceeds by assuming products in that specific batch are new. For more robust duplicate prevention in such cases, the filter construction in `processBatch` within `importProducts.js` can be enhanced by ensuring values are double-quoted (e.g., `name.eq."${encodedValue}"`). This fix was discussed but deferred for now.
- **Error Handling**: The script includes basic error logging. If issues occur, check the console output for details.

### Key Files Explained

#### Configuration

- **config/index.js**: Centralizes all application configuration. It loads environment variables and provides validation for required values. All environment variables should be accessed through this module rather than directly from process.env.

#### Controllers

Controllers handle the business logic for each feature area:

- **authController.js**: Handles user registration, login, and token generation
- **slipsController.js**: Manages creating, retrieving, and formatting sales slips
- **pricesController.js**: Handles product catalog and price management
- **voiceController.js**: Processes voice input (currently mock implementation)
- **whatsappController.js**: Handles WhatsApp messaging (currently mock implementation)

#### Routes

Routes define the API endpoints and connect them to the appropriate controller functions:

- **auth.js**: Authentication endpoints (/api/auth/*)
- **slips.js**: Sales slip endpoints (/api/slips/*)
- **prices.js**: Product and price endpoints (/api/prices/*)
- **voice.js**: Voice processing endpoints (/api/voice/*)
- **whatsapp.js**: WhatsApp integration endpoints (/api/whatsapp/*)

#### Middleware

- **auth.js**: Validates JWT tokens and protects routes from unauthorized access

#### Utilities

- **errorHandler.js**: Provides consistent error handling throughout the application
  - `catchAsync`: Wraps async controller functions to avoid try/catch boilerplate
  - `AppError`: Creates standardized API errors with status codes
  - `globalErrorHandler`: Express middleware for formatting error responses
  
- **validator.js**: Validates request data
  - `validateBody`: Ensures required fields are in the request body
  - `validateId`: Validates ID parameters in routes
  - `validateQuery`: Ensures required query parameters are present

#### Database

- **supabase.js**: Initializes and exports the Supabase client for database operations

#### Services

- **pdfService.js**: Generates PDF receipts for slips

## Design Patterns Used

1. **MVC Architecture**: The codebase follows a Model-View-Controller pattern
   - Models: Supabase tables
   - Views: JSON responses and PDF generation
   - Controllers: Business logic in controller files

2. **Middleware Pattern**: Authentication and validation as Express middleware

3. **Factory Pattern**: Error handling utilities create standardized errors

4. **Repository Pattern**: Database operations are centralized in controller functions

5. **Configuration Management**: Centralized config with validation

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with phone and password
- `POST /api/auth/simple-login` - Simplified login for testing

### Slips
- `GET /api/slips` - Get all slips (with pagination)
- `POST /api/slips` - Create a new slip
- `GET /api/slips/:id` - Get details of a specific slip
- `GET /api/slips/summary/today` - Get today's sales summary
- `GET /api/slips/:id/pdf` - Download slip as PDF

### Products & Prices
- `GET /api/prices` - Get all products with current prices
- `PUT /api/prices/:productId` - Update a product's price
- `POST /api/prices/product` - Add a new product
- `GET /api/prices/search?q=query` - Search for products

### Voice Processing
- `POST /api/voice/process` - Process voice input
- `GET /api/voice/languages` - Get supported languages

### WhatsApp
- `POST /api/whatsapp/webhook` - Webhook for incoming messages
- `POST /api/whatsapp/send` - Send a WhatsApp message
- `POST /api/whatsapp/daily-summary` - Send daily summary report

## 🧪 Testing

### Testing Supabase Connection
Run the test script to verify the connection to your Supabase database:

```bash
node test-supabase.js
```

### Testing API Endpoints
Run the API test script to verify all endpoints are working:

```bash
node test-api.js
```

## 📝 Example Requests

### Create a Slip

```javascript
// POST /api/slips
{
  "customerName": "राज कुमार",
  "items": [
    {
      "product_id": 1,
      "qty": 2,
      "unit": "kg",
      "rate": 40
    },
    {
      "product_id": 2,
      "qty": 1,
      "unit": "kg", 
      "rate": 120
    }
  ],
  "discount": 10,
  "gstRequired": false
}
```

### Login

```javascript
// POST /api/auth/login
{
  "phone": "9876543210",
  "password": "yourpassword"
}
```

### Process Voice Input

```javascript
// POST /api/voice/process
{
  "audioData": "base64-encoded-audio-data",
  "language": "hi",
  "shopId": 1
}
```

## Error Handling

The application uses a consistent error handling approach:

1. **Operational Errors**: Predictable errors like invalid input, missing records
   - These return specific error messages to the client
   - Example: 404 Not Found when a slip doesn't exist

2. **Programming Errors**: Unexpected errors like database connection issues
   - These return generic messages in production but detailed errors in development
   - All errors are logged for debugging

3. **Error Format**: All errors follow this format:
   ```json
   {
     "success": false,
     "status": "error",
     "message": "Error description"
   }
   ```

## 🔄 Future Enhancements

- [ ] Google Speech-to-Text integration
- [ ] Twilio WhatsApp integration
- [ ] Offline sync capabilities

## Development Notes

### Adding New Features

To add a new feature to the application:

1. Create a controller in `/controllers` with the business logic
2. Create routes in `/routes` that use the controller functions
3. Add the routes to `server.js`
4. Update tests if necessary

### Understanding the Authentication Flow

1. User provides credentials (phone/password)
2. Server validates credentials against Supabase
3. JWT token is generated with user details
4. Token is returned to client
5. Client includes token in Authorization header for subsequent requests
6. `auth.js` middleware validates token for protected routes

## 📜 License

MIT
