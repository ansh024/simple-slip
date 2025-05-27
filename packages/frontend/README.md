# Simple Slip Frontend

A modern, mobile-friendly frontend for the Simple Slip application - a voice-first micro-app for tier-3 kirana shops. This frontend works alongside the Simple Slip backend to provide a seamless experience for small retailers.

## Features

- **Smart Product Search**: Intelligent product autocomplete with synonyms/aliases support and auto-fill of unit/price data
- **Responsive Grid Layout**: Percentage-based column widths that adapt perfectly to any screen size
- **Quick Slip Creation**: Create sales slips quickly with voice input and dynamic slip number display
- **Price Board**: Centralized price management with dual pricing model (minimum and fair price), auto-save functionality, and intuitive table layout
- **Books**: Clean, connected table-like interface for viewing transaction history with date filtering, sorting options, and optimized layout for maximum readability and efficiency
- **Day Summary**: Daily sales reports with WhatsApp integration with optimized 2x2 grid layout
- **Enhanced Multi-language Support**: Comprehensive translation system using i18next that supports English, Hindi, Punjabi, and Gujarati with easy language switching. All UI elements, form fields, validation messages and product information are fully translatable.
- **Responsive Design**: Works well on mobile devices with grid-based layouts
- **Improved UI Components**: Custom-styled interactive buttons with hover effects and visual feedback
- **Keyboard Shortcuts**: Enter key support for quick item addition without mouse interaction
- **Context-Aware Header**: Intelligent header that adapts to the current page - showing save button only on slip creation screens and not on detail views
- **Enhanced Error Handling**: Comprehensive error handling with fallback mechanisms for all API calls
- **Network Resilience**: Auto-retry mechanism for network errors with localStorage caching and offline mock data support
- **Graceful Degradation**: Application continues to function even when backend services have issues
- **Optimized Layout**: Side-by-side arrangement of totals and voice input button for better space utilization
- **Simplified Architecture**: Streamlined application with focus on core functionality
- **Cleaner UI**: Removed unnecessary buttons and controls based on the context of each page
- **User Feedback System**: Toast notifications for actions like saving, deleting, and error handling
- **Improved Analytics**: Product linkage for better sales reporting and trend analysis
- **Optimized Input Forms**: Intuitive field sizing with emphasis on the most important data entry points

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Simple Slip backend server running on port 5001

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### backend deployment 
backend is deployed on GCP here :
Service [simple-slip-backend] revision [simple-slip-backend-00003-dxs] has been deployed and is serving 100 percent of traffic.
Service URL: https://simple-slip-backend-734895643464.asia-south2.run.app

### Running the Application

Start the development server:
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Price Board Feature

The Price Board provides a comprehensive solution for centralized price management in Simple Slip. This feature has been enhanced with several key improvements:

### Key Features

- **Dual Pricing Model**: Support for both minimum price and fair price, allowing store owners to maintain price floors while having flexibility for different customer segments
- **Auto-Save Functionality**: Changes are automatically saved when you tab out or click away from an input field - no save button needed
- **Optimized UI**: Clean, easy-to-read table with proper column spacing and alignment
- **Responsive Design**: Works well on both desktop and mobile devices
- **Real-time Validation**: Ensures minimum price never exceeds fair price
- **Search Capability**: Quickly find products by name or aliases
- **Visual Indicators**: Green dot shows which prices have been updated
- **Toast Notifications**: User-friendly feedback for save operations and validation errors
- **Multi-language Support**: Fully translated in all supported languages

### Implementation Details

The Price Board uses React with styled-components for the UI and connects to the backend API for price storage. The component implements:

- Debounced price updates to prevent excessive API calls
- Smart field handling that works whether you enter minimum price or fair price first
- Automatic field value synchronization when appropriate
- Proper error handling with toast notifications for improved user feedback

## Books Feature

The Books page provides a clean, connected table-like interface for viewing transaction history:

### Key Features

- **Table-like Interface**: Connected row system with consistent borders and rounded corners
- **Space-Efficient Layout**: 40% reduced vertical spacing for more slips per screen
- **Sorting Options**: Sort slips by newest or oldest with intuitive "Sort By:" label
- **Date Filtering**: Filter slips by date range with clear labeling
- **Optimized Layout**: Horizontal alignment of customer name, date, and time in a single line
- **Compact Actions Row**: Aligned amount, items count, and delete button for better usability
- **Delete Functionality**: Ability to delete slips with a confirmation dialog
- **Toast Notifications**: User-friendly feedback for actions like deleting slips
- **Responsive Design**: Works well on both desktop and mobile devices
- **Clean Navigation**: Streamlined navigation with removal of Drafts tab
- **Refresh Button**: One-click refresh of slip data

### Implementation Details

The Slips Book component uses React with styled-components for the UI and:

- Implements client-side filtering and sorting for responsive user experience
- Handles date formatting safely with proper error handling
- Uses a modal confirmation dialog to prevent accidental deletions
- Displays toast notifications for operation feedback
- Ensures consistent layout with proper spacing between UI elements

## Multi-language Support

Simple Slip has been designed with a comprehensive internationalization system to support multiple languages for tier-3 kirana shop owners. The app currently supports:

- English
- Hindi (हिन्दी)
- Punjabi (ਪੰਜਾਬੀ)
- Gujarati (ગુજરાતી)

### Implementation Details

The multi-language system uses the following technologies:

- **i18next**: A powerful internationalization framework for JavaScript
- **react-i18next**: React bindings for i18next
- **i18next-browser-languagedetector**: Auto-detects the user's preferred language

### Structure

- `/src/i18n/index.js`: Main configuration file for i18next
- `/src/i18n/locales/`: Contains translation files for each supported language
  - `en.json`: English translations
  - `hi.json`: Hindi translations
  - `pa.json`: Punjabi translations
  - `gu.json`: Gujarati translations

### Adding New Languages

To add support for additional languages:

1. Create a new translation file in `/src/i18n/locales/` (e.g., `mr.json` for Marathi)
2. Add the language option in the `languageOptions` array in `Home.js`
3. Add the resource to the `resources` object in `/src/i18n/index.js`

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
