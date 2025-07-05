# Render Deployment Guide - Single Service

This guide will help you deploy the Toronto Shelter Analytics application as a single service on Render.

## Prerequisites

1. **Render Account** - Sign up at [render.com](https://render.com)
2. **MongoDB Atlas** - Set up a MongoDB Atlas cluster for production
3. **GitHub Repository** - Your code should be in a GitHub repository

## Deployment Strategy

We'll deploy the entire application as a single **Web Service** on Render:
- Backend API server
- React frontend (served as static files)
- All routes handled by the same service

## Step 1: Create Web Service on Render

### 1.1 Create Service

1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Basic Settings:**
- **Name:** `shelter-analytics` (or your preferred name)
- **Environment:** `Node`
- **Region:** Choose closest to your users
- **Branch:** `main` (or your default branch)

**Build & Deploy Settings:**
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Root Directory:** Leave empty (root of repository)

**Alternative Build Commands (if the above doesn't work):**
- **Build Command:** `./build.sh`
- **Start Command:** `npm start`
- **Root Directory:** Leave empty (root of repository)

### 1.2 Environment Variables

Add these environment variables in Render:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shelter_system
JWT_SECRET=your_very_strong_secret_key_here
NODE_ENV=production
PORT=10000
```

**Important Notes:**
- Replace `MONGODB_URI` with your MongoDB Atlas connection string
- Generate a strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Render will automatically set the PORT environment variable

## Step 2: Build Commands

### 2.1 Root Package.json Commands

The application uses these commands from the root `package.json`:

```json
{
  "scripts": {
    "start": "node backend/server.js",
    "build": "npm install && cd backend && npm install && cd ../frontend && npm install && npm run build",
    "render-build": "npm install && cd backend && npm install && cd ../frontend && npm install && npm run build",
    "dev": "concurrently \"npm run backend\" \"npm run frontend\""
  }
}
```

**Build Process:**
1. `npm install` - Installs root dependencies
2. `cd backend && npm install` - Installs backend dependencies
3. `cd ../frontend && npm install` - Installs frontend dependencies
4. `npm run build` - Builds the React frontend
5. `npm start` - Starts the Node.js server

### 2.2 Server Configuration

The backend server (`backend/server.js`) is configured to:
- Serve API routes under `/api/*`
- Serve static React files from `frontend/build`
- Handle all other routes by serving `index.html` (for React Router)

## Step 3: MongoDB Atlas Setup

### 3.1 Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Set up database access (username/password)
4. Set up network access (allow all IPs: 0.0.0.0/0)
5. Get your connection string

### 3.2 Connection String Format

Your MongoDB Atlas connection string should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/shelter_system?retryWrites=true&w=majority
```

## Step 4: Deploy and Test

### 4.1 Deploy Service

1. Click "Create Web Service" in Render
2. Wait for the build to complete
3. Check the logs for any errors
4. Visit your service URL when deployment is successful

### 4.2 Test Your Application

1. Visit your service URL (provided by Render)
2. Test the sign-up functionality
3. Test the sign-in functionality
4. Verify the dashboard loads correctly
5. Test all API endpoints

## File Structure for Deployment

```
/
├── package.json          # Root package.json with build/start commands
├── backend/
│   ├── server.js         # Main server file
│   ├── package.json      # Backend dependencies
│   ├── routes/           # API routes
│   ├── models/           # MongoDB models
│   └── middleware/       # Auth middleware
├── frontend/
│   ├── package.json      # Frontend dependencies
│   ├── src/              # React source code
│   └── build/            # Built React files (created during build)
└── model/                # Python ML model files
```

## Troubleshooting

### Common Issues

**1. Build Failures**
- Check that all dependencies are in package.json files
- Verify Node.js version compatibility
- Check build logs in Render dashboard

**2. MongoDB Connection Issues**
- Check MongoDB Atlas network access settings
- Verify connection string format
- Check environment variables in Render

**3. Frontend Not Loading**
- Check that the build completed successfully
- Verify static file serving in server.js
- Check server logs for errors

**4. API Routes Not Working**
- Verify that API routes are defined before the catch-all route
- Check CORS configuration
- Test API endpoints directly

### Debug Commands

**Check Build Logs:**
- Go to your service in Render
- Click on "Logs" tab
- Look for build errors

**Check Runtime Logs:**
- Go to your service in Render
- Click on "Logs" tab
- Look for runtime errors

**Test API Endpoints:**
```bash
# Test API health
curl https://your-service-name.onrender.com/api

# Test auth endpoint
curl https://your-service-name.onrender.com/api/auth/me
```

## Environment Variables Summary

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shelter_system
JWT_SECRET=your_very_strong_secret_key_here
NODE_ENV=production
PORT=10000
```

## Cost Considerations

- **Free Tier:** 750 hours/month on Render's free tier
- **MongoDB Atlas:** Free tier includes 512MB storage
- **Single Service:** More cost-effective than multiple services

## Security Notes

1. **JWT Secret:** Use a strong, randomly generated secret
2. **MongoDB:** Use strong passwords and restrict network access
3. **Environment Variables:** Never commit secrets to your repository
4. **HTTPS:** Render automatically provides HTTPS for all services

## Advantages of Single Service Deployment

1. **Simpler Configuration:** Only one service to manage
2. **Cost Effective:** Uses less resources
3. **No CORS Issues:** Frontend and backend on same domain
4. **Easier Debugging:** All logs in one place
5. **Faster Deployments:** Single build process

Your application should now be successfully deployed as a single service on Render! 🚀 