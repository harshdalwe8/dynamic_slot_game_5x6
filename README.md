# Dynamic Multi-Theme 5x6 Slot Game System

## Overview
This project is a Dynamic Multi-Theme 5x6 Slot Game System designed to be JSON-driven, utilizing Node.js with Express for the backend, PostgreSQL for data storage, and React for the frontend. The system is built to run seamlessly on both web platforms and within Android/iOS WebView.

## Features
- **Dynamic Themes**: Supports multiple themes that can be easily managed and switched.
- **5x6 Slot Grid**: A visually engaging slot game interface with a 5x6 grid layout.
- **User Management**: Handles user accounts, wallets, and transaction histories.
- **Game Controls**: Provides intuitive controls for betting and spinning the slot.
- **API Integration**: RESTful API for backend communication, allowing for smooth gameplay and data management.

## Project Structure
- **backend/**: Contains the server-side code, including controllers, models, routes, and services.
- **frontend/**: Contains the client-side code, including React components, contexts, and services.
- **database/**: Contains SQL migration and seeder files for database setup.

## Setup Instructions

### Backend
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Set up the PostgreSQL database and configure the connection in `src/config/db.ts`.
4. Run migrations to create the necessary tables:
   ```
   npx prisma migrate deploy
   ```
5. Start the backend server:
   ```
   npm start
   ```

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Start the frontend application:
   ```
   npm start
   ```

## Deployment
- Ensure that the backend and frontend are properly configured for production.
- Use a process manager like PM2 for the backend.
- Build the frontend for production:
  ```
  npm run build
  ```

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.