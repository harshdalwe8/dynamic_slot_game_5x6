# Dynamic Multi-Theme 5x6 Slot Game System

## Overview
This project is a Dynamic Multi-Theme 5x6 Slot Game System that is JSON-driven. It utilizes Node.js with Express for the backend, PostgreSQL for data storage, and React for the frontend. The application is designed to run seamlessly on both web and inside Android/iOS WebView.

## Frontend Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Navigate to the frontend directory:
   ```
   cd dynamic-slot-game-system/frontend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm start
```
This will launch the application in your default web browser at `http://localhost:3000`.

### Building for Production
To create a production build of the application, run:
```
npm run build
```
The production build will be available in the `build` directory.

## Folder Structure
- **public/**: Contains static files, including the main HTML file.
- **src/**: Contains all the React components, contexts, hooks, services, and styles.
  - **components/**: Contains reusable components such as `SlotGrid`, `ThemeSelector`, and `GameControls`.
  - **contexts/**: Contains context providers for managing global state.
  - **hooks/**: Contains custom hooks for encapsulating logic.
  - **services/**: Contains API service functions for backend communication.
  - **styles/**: Contains theme styles for the slot game.

## Features
- Dynamic theme selection for a personalized gaming experience.
- Responsive design for optimal performance on both web and mobile platforms.
- Integration with a PostgreSQL database for persistent data storage.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.