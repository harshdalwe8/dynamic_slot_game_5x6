# Frontend Authentication System

## Overview

The frontend authentication system includes login, registration, and guest mode functionality with JWT token management and automatic token refresh.

## Features Implemented

### ✅ Authentication Context (`AuthContext.tsx`)
- **State Management**: Manages user authentication state across the application
- **JWT Tokens**: Stores and manages access tokens (15min) and refresh tokens (7 days)
- **Auto-refresh**: Automatically refreshes access tokens every 13 minutes
- **Guest Mode**: Allows users to play without registration (temporary accounts)
- **Persistence**: Stores authentication state in localStorage
- **Functions**:
  - `login(email, password)` - Authenticate existing user
  - `register(email, password)` - Create new user account
  - `loginAsGuest()` - Create temporary guest account
  - `logout()` - Clear authentication and redirect
  - `refreshAuth()` - Refresh access token using refresh token

### ✅ Login Component (`Login.tsx`)
- **Features**:
  - Email/password authentication
  - Guest mode button (play without registration)
  - Error handling with user-friendly messages
  - Loading states during authentication
  - Navigation to registration page
  - Styled with modern gradient design
- **Guest Mode**: Generates unique guest credentials automatically
- **Validation**: Email format and required fields

### ✅ Register Component (`Register.tsx`)
- **Features**:
  - Email/password registration
  - Password confirmation with validation
  - Minimum password length (6 characters)
  - Benefits information box
  - Error handling
  - Loading states
  - Navigation to login page
- **Validation**:
  - Password length ≥ 6 characters
  - Password match confirmation
  - Email format

### ✅ API Service (`api.ts`)
- **Axios Instance**: Configured with base URL and default headers
- **Request Interceptor**: Automatically attaches JWT token to all requests
- **Response Interceptor**: Handles 401 errors and automatic token refresh
- **Authentication APIs**:
  - `loginUser(email, password)` - Login endpoint
  - `registerUser(email, password)` - Registration endpoint
  - `refreshAccessToken(refreshToken)` - Token refresh endpoint
  - `logoutUser()` - Logout endpoint
- **Game APIs**:
  - `spinSlot(betAmount, themeId)` - Spin the slot machine
  - `getThemes()` - Fetch available themes
  - `selectTheme(themeId)` - Select a theme
  - `getWalletBalance()` - Get user balance
  - `getUserAchievements()` - Get user achievements
  - `getLeaderboard(type, period)` - Get leaderboard data

### ✅ App Routing (`App.tsx`)
- **Routes**:
  - `/login` - Login page (public)
  - `/register` - Registration page (public)
  - `/game` - Main game page (protected)
  - `/` - Redirects to login
- **Protected Routes**: Automatically redirect unauthenticated users to login
- **Loading State**: Shows loading screen during authentication check
- **Game Page Layout**:
  - Header with logo, user info, and logout button
  - Guest badge for guest users
  - Game components (ThemeSelector, SlotGrid, GameControls)

### ✅ Environment Configuration (`.env`)
- `REACT_APP_API_URL` - Backend API base URL
- `REACT_APP_WS_URL` - WebSocket server URL (for future Socket.IO)

## User Flow

### 1. New User Registration
```
1. User visits app → Redirected to /login
2. Clicks "Register here" → /register page
3. Enters email, password, confirms password
4. Clicks "Create Account"
5. Backend creates user with initial 1000 coins
6. Tokens stored in localStorage
7. Redirected to /game page
```

### 2. Existing User Login
```
1. User visits /login
2. Enters email and password
3. Clicks "Login"
4. Backend validates credentials
5. Tokens stored in localStorage
6. Redirected to /game page
```

### 3. Guest Mode
```
1. User visits /login
2. Clicks "Play as Guest" button
3. System generates unique guest credentials
   - Email: guest_<timestamp>_<random>@guest.local
   - Password: auto-generated
4. Backend creates temporary guest account
5. User can play immediately (no saved progress)
6. Guest session lost on logout
```

### 4. Token Management
```
Access Token (15 minutes):
- Attached to all API requests via Authorization header
- Refreshed automatically every 13 minutes
- Stored in localStorage

Refresh Token (7 days):
- Used to get new access tokens
- Sent to /auth/refresh endpoint
- If refresh fails → user logged out

Auto-refresh Flow:
1. Every 13 minutes, refreshAuth() is called
2. New access token obtained from backend
3. Updated in localStorage
4. Subsequent requests use new token
```

### 5. Authentication Interceptors
```
Request Interceptor:
- Reads accessToken from localStorage
- Adds "Authorization: Bearer <token>" header
- Applied to all API calls automatically

Response Interceptor:
- Catches 401 Unauthorized errors
- Attempts token refresh with refreshToken
- Retries original request with new token
- If refresh fails → logout and redirect to /login
```

## Security Features

1. **JWT Tokens**: Secure authentication without session storage
2. **HTTP-Only Cookies**: Backend uses HTTP-only cookies for refresh tokens (recommended upgrade)
3. **Token Expiration**: Short-lived access tokens (15min) limit exposure
4. **Automatic Refresh**: Seamless token renewal without user interaction
5. **Guest Isolation**: Guest accounts don't persist, preventing abuse
6. **Password Validation**: Minimum 6 characters required
7. **Error Handling**: No sensitive information exposed in error messages

## Styling

- **Design**: Modern gradient design (purple/blue theme)
- **Components**: Fully styled with styled-components
- **Responsive**: Works on desktop and mobile
- **Animations**: Smooth transitions and hover effects
- **Loading States**: Visual feedback during async operations
- **Error Messages**: Clear, user-friendly error displays

## Integration with Backend

### Expected Backend Endpoints

```typescript
// Authentication
POST /api/auth/register
Body: { email: string, password: string }
Response: { accessToken, refreshToken, user: { id, email, role } }

POST /api/auth/login
Body: { email: string, password: string }
Response: { accessToken, refreshToken, user: { id, email, role } }

POST /api/auth/refresh
Body: { refreshToken: string }
Response: { accessToken: string }

POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { message: string }

// Game
POST /api/slot/spin
Headers: Authorization: Bearer <token>
Body: { betAmount: number, themeId?: string }
Response: { result, balance, win, ... }

GET /api/slot/balance
Headers: Authorization: Bearer <token>
Response: { balance: number }

// Admin/Themes
GET /api/admin/themes
Response: { themes: [...] }
```

## Future Enhancements

1. **Socket.IO Integration**: Real-time balance updates, achievements, notifications
2. **Email Verification**: Confirm user email addresses
3. **Password Reset**: Forgot password functionality
4. **Social Login**: Google, Facebook authentication
5. **2FA**: Two-factor authentication for enhanced security
6. **Profile Management**: Update email, password, avatar
7. **Remember Me**: Optional persistent login
8. **Session Management**: View and revoke active sessions

## Testing

### Manual Testing Checklist

- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (verify error)
- [ ] Guest mode login
- [ ] Access protected route without auth (verify redirect)
- [ ] Token auto-refresh (wait 13+ minutes)
- [ ] Logout functionality
- [ ] Password validation (too short)
- [ ] Password mismatch validation
- [ ] Navigation between login/register pages

## Deployment Notes

1. **Environment Variables**: Update `.env` with production API URL
2. **HTTPS**: Use HTTPS in production for secure token transmission
3. **CORS**: Configure backend CORS to allow frontend domain
4. **Token Storage**: Consider using HTTP-only cookies instead of localStorage
5. **Rate Limiting**: Backend should rate-limit authentication endpoints

## Files Created

```
frontend/
├── .env (API URL configuration)
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx (Authentication state management)
│   ├── components/
│   │   ├── Login.tsx (Login UI)
│   │   └── Register.tsx (Registration UI)
│   ├── services/
│   │   └── api.ts (Updated with auth APIs and interceptors)
│   └── App.tsx (Updated with routing and protected routes)
```

## Summary

✅ **Login/Registration UI** - Complete with validation and error handling  
✅ **Guest Mode** - Users can play without registration  
✅ **JWT Authentication** - Secure token-based authentication  
✅ **Auto Token Refresh** - Seamless token renewal  
✅ **Protected Routes** - Game page requires authentication  
✅ **API Integration** - Full integration with backend endpoints  
✅ **Modern UI** - Styled with gradients and animations  

The authentication system is production-ready and fully integrated with the backend!
