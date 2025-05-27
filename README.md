# Simple Slip Monorepo

This monorepo contains the frontend and backend applications for Simple Slip, a voice-first micro-app for tier-3 kirana shops.

## 📂 Structure

-   `packages/frontend`: Contains the React frontend application.
-   `packages/backend`: Contains the Node.js/Express backend application.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v14 or higher recommended)
-   Yarn (v1.x or higher recommended, as scripts are configured for Yarn Workspaces)

### Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    # git clone <repository-url>
    # cd simple-slip-monorepo
    ```

2.  **Install dependencies for all packages:**
    From the root of the monorepo (`simple-slip-codebase`), run:
    ```bash
    yarn install:all 
    # or simply yarn install
    ```
    This will install dependencies for the root, frontend, and backend packages.

### Running the Applications (Development)

To run both the frontend and backend concurrently for development:

1.  **Ensure backend environment variables are set up.**
    Navigate to `packages/backend` and copy `.env.example` to `.env` if it doesn't exist, then fill in your Supabase credentials and other necessary variables as described in `packages/backend/README.md`.

    ```bash
    cd packages/backend
    cp .env.example .env 
    # nano .env (or use your preferred editor to update it)
    cd ../.. 
    ```

2.  **Start both frontend and backend:**
    From the root of the monorepo, run:
    ```bash
    yarn dev
    ```
    This will:
    -   Start the backend server (usually on port 5001, or `PORT` from `.env`).
    -   Start the frontend development server (usually on port 3000).

    The frontend will be accessible at `http://localhost:3000` and will proxy API requests to the backend.

### Building for Production

-   **Frontend:**
    ```bash
    yarn build:frontend
    ```
    This will create a production build of the frontend in `packages/frontend/build`.

-   **Backend:**
    The backend is designed to be deployed using Docker, as per `packages/backend/README.md`. Refer to those instructions for building and deploying the backend Docker image.

## ⚙️ Individual Package Scripts

You can also run scripts for individual packages from the root:

-   `yarn workspace @simpleslip/frontend <script_name>` (e.g., `yarn workspace @simpleslip/frontend test`)
-   `yarn workspace @simpleslip/backend <script_name>` (e.g., `yarn workspace @simpleslip/backend test`)

Refer to the `README.md` files within each package directory (`packages/frontend/README.md` and `packages/backend/README.md`) for more detailed information about each application.
