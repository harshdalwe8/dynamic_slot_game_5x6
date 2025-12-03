# Dynamic Multi-Theme 5x6 Slot Game System

## Overview
This project is a Dynamic Multi-Theme 5x6 Slot Game System designed to be JSON-driven, utilizing Node.js with Express for the backend, PostgreSQL for data storage, and React for the frontend. The system is built to run seamlessly on both web platforms and within Android/iOS WebView.

## Backend Setup

### Prerequisites
- Node.js (version 14 or higher)
- PostgreSQL (version 12 or higher)
- TypeScript (version 4 or higher)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd dynamic-slot-game-system/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the database connection in `src/config/db.ts`:
   - Update the connection string with your PostgreSQL credentials.

4. Run database migrations:
   ```
   npx prisma migrate deploy
   ```

5. Seed the database (optional):
   ```
   npx prisma db seed
   ```

6. Start the backend server:
   ```
   npm run start
   ```

### API Endpoints
- `POST /api/spin`: Initiates a spin on the slot machine.
- `GET /api/themes`: Retrieves available themes for the slot game.
- Additional endpoints can be found in `src/routes/slotRoutes.ts`.

## Frontend Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation
1. Navigate to the frontend directory:
   ```
   cd dynamic-slot-game-system/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend application:
   ```
   npm start
   ```

### Running on Mobile
To run the application inside an Android/iOS WebView, ensure that the frontend is built and served correctly. You can use tools like Cordova or React Native WebView to wrap the application.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
- Thanks to the contributors and the open-source community for their support and resources.