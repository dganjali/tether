# Toronto Shelter Analytics - Authentication Setup

This guide will help you set up the authentication system for the Toronto Shelter Analytics application.

## Prerequisites

1. **Node.js** (version 14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **Python** (for the ML model)

## Setup Instructions

### 1. Install MongoDB

#### Option A: Local MongoDB Installation
```bash
# On macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# On Ubuntu/Debian
sudo apt-get install mongodb

# On Windows
# Download and install from https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Get your connection string

### 2. Environment Variables

Copy the example environment files and configure them:

```bash
# Backend environment variables
cd backend
cp .env.example .env
# Edit .env with your actual values

# Frontend environment variables (optional)
cd ../frontend
cp .env.example .env
# Edit .env if you need to change the API URL
```

**Backend .env file (backend/.env):**
```bash
MONGODB_URI=mongodb://localhost:27017/shelter_system
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
PORT=3001
```

**Frontend .env file (frontend/.env):**
```bash
REACT_APP_API_URL=http://localhost:3001
```

**Important Security Notes:**
- Change the `JWT_SECRET` to a strong, unique secret key
- For production, use environment variables instead of hardcoded values
- Consider using MongoDB Atlas for production deployments

### 3. Install Dependencies

```bash
# Install root dependencies
npm run install-all

# Or install separately:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 4. Start the Application

```bash
# Start both backend and frontend
npm start

# Or start separately:
# Backend (Terminal 1)
cd backend && npm start

# Frontend (Terminal 2)
cd frontend && npm start
```

## Application Structure

### Authentication Flow
1. **Home Page** (`/`) - Landing page with sign-in/sign-up options
2. **Sign Up** (`/signup`) - Create new account
3. **Sign In** (`/signin`) - Login with existing account
4. **Dashboard** (`/dashboard`) - Protected route, requires authentication

### Backend API Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Authenticate user
- `GET /api/auth/me` - Get current user info (protected)
- `POST /api/auth/logout` - Logout (client-side token removal)

### Database Schema
```javascript
User {
  username: String (unique, required, 3-30 chars)
  password: String (required, min 6 chars, hashed)
  createdAt: Date (auto-generated)
}
```

## Security Features

1. **Password Hashing** - Using bcryptjs with salt rounds
2. **JWT Authentication** - Stateless token-based authentication
3. **Protected Routes** - Frontend route protection
4. **Input Validation** - Server-side validation for all inputs
5. **Error Handling** - Comprehensive error messages

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB if not running
brew services start mongodb/brew/mongodb-community
```

### Port Conflicts
If port 3001 is in use, change the PORT in `backend/.env`:
```
PORT=3002
```

### CORS Issues
The backend is configured with CORS enabled. If you encounter CORS issues, check the CORS configuration in `backend/server.js`.

## Production Deployment

For production deployment:

1. **Environment Variables**: Use proper environment variable management
2. **JWT Secret**: Use a strong, randomly generated secret
3. **MongoDB**: Use MongoDB Atlas or a managed MongoDB service
4. **HTTPS**: Enable HTTPS for all communications
5. **Rate Limiting**: Implement rate limiting for auth endpoints
6. **Logging**: Add proper logging for security events

## Additional Libraries Used

### Backend
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT token generation/verification
- `bcryptjs` - Password hashing
- `dotenv` - Environment variable management

### Frontend
- `react-router-dom` - Client-side routing
- `axios` - HTTP client for API calls

## Testing the Authentication

1. Start the application
2. Visit `http://localhost:3000`
3. Click "Sign Up" to create an account
4. Try signing in with the created account
5. Access the dashboard (protected route)
6. Test logout functionality

The authentication system is now fully integrated with your existing shelter analytics application! 