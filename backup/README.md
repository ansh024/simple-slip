# Simple Slip Backend

A voice-first backend for tier-3 kirana shops, built with Node.js, Express, and Supabase.

## Features

- 🎤 **Voice-First**: Process voice inputs in multiple Indian languages
- 📄 **Quick Slip Creation**: Create sales slips with minimal typing
- 💰 **Price Management**: Centralized price board for all products
- 📱 **WhatsApp Integration**: Daily summaries and notifications
- 🌐 **Multi-Language Support**: Hindi, English, and 8+ regional languages
- 📊 **Real-time Analytics**: Daily and monthly sales summaries

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **PDF Generation**: PDFKit
- **Voice Processing**: Google Speech-to-Text (ready for integration)
- **WhatsApp**: Twilio API (ready for integration)

## Database Schema

The backend uses existing Supabase tables:

- **products**: Product catalog with names and units
- **slips**: Sales transactions
- **slip_items**: Individual items in each slip
- **price_board**: Product pricing with effective dates

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-slip-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
PORT=5001
JWT_SECRET=your-jwt-secret
```

5. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with phone/password
- `POST /api/auth/simple-login` - Quick login for testing

### Slips
- `GET /api/slips` - Get all slips (with pagination)
- `POST /api/slips` - Create new slip
- `GET /api/slips/:id` - Get single slip details
- `GET /api/slips/summary/today` - Get today's summary
- `GET /api/slips/:id/pdf` - Download slip as PDF

### Price Management
- `GET /api/prices` - Get all products with current prices
- `PUT /api/prices/:productId` - Update product price
- `POST /api/prices/product` - Add new product
- `GET /api/prices/search?q=query` - Search products

### Voice Processing
- `POST /api/voice/process` - Process voice input
- `GET /api/voice/languages` - Get supported languages

### WhatsApp Integration
- `POST /api/whatsapp/webhook` - Webhook for incoming messages
- `POST /api/whatsapp/send` - Send WhatsApp message
- `POST /api/whatsapp/daily-summary` - Generate daily summary

## Testing

Run the test scripts:

```bash
# Test Supabase connection
node test-supabase.js

# Test API endpoints
node test-api.js
```

## Example API Usage

### Create a Slip
```javascript
POST /api/slips
Authorization: Bearer <token>

{
  "customerName": "राज कुमार",
  "items": [
    {
      "product_id": 1,
      "qty": 2,
      "unit": "kg",
      "rate": 40
    }
  ],
  "discount": 10,
  "gstRequired": false
}
```

### Get Products with Prices
```javascript
GET /api/prices
Authorization: Bearer <token>
```

## Deployment

The backend is ready for deployment on:
- Heroku
- Railway
- Render
- Any Node.js hosting platform

Make sure to set all environment variables in your deployment platform.

## Future Enhancements

- [ ] Google Speech-to-Text integration
- [ ] Twilio WhatsApp integration
- [ ] Offline sync capabilities

## License

MIT
