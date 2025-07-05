# Render Deployment Checklist

## Pre-Deployment Checklist

### ✅ Environment Variables
- [ ] `MONGODB_URI` is set in Render environment variables
- [ ] `JWT_SECRET` is set in Render environment variables
- [ ] `NODE_ENV` is set to `production`
- [ ] `PORT` is set to `10000` (optional, Render sets this automatically)

### ✅ Build Configuration
- [ ] Root `package.json` has correct `start` script: `node backend/server.js`
- [ ] Root `package.json` has correct `build` script: `./build.sh`
- [ ] `build.sh` is executable (`chmod +x build.sh`)
- [ ] All dependencies are listed in respective `package.json` files

### ✅ File Structure
- [ ] `backend/server.js` exists and is the main server file
- [ ] `frontend/build/` directory will be created during build
- [ ] `data/` directory with required CSV and JSON files exists
- [ ] `model/` directory with Python prediction scripts exists

## Deployment Steps

### 1. Create Render Service
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service settings:
   - **Name:** `shelter-analytics`
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

### 2. Set Environment Variables
In your Render service settings, add:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shelter_system
JWT_SECRET=your_generated_secret_here
NODE_ENV=production
PORT=10000
```

### 3. Deploy and Monitor
1. Click "Create Web Service"
2. Monitor build logs for errors
3. Check runtime logs for issues
4. Test the health endpoint: `https://your-service.onrender.com/api/health`

## Troubleshooting Common Issues

### "No endpoint found" Error

**Possible Causes:**
1. **Missing environment variables** - Check Render environment settings
2. **Build failure** - Check build logs in Render dashboard
3. **Server not starting** - Check runtime logs
4. **Wrong port configuration** - Verify PORT environment variable
5. **Frontend not built** - Check if `frontend/build/` exists

**Debug Steps:**
1. Check Render logs for build errors
2. Test health endpoint: `https://your-service.onrender.com/api/health`
3. Check if server is running: Look for "🚀 Server running on port" in logs
4. Verify environment variables are set correctly

### Build Failures

**Common Issues:**
- Missing dependencies in `package.json`
- Python not available for ML requirements
- File permissions issues with `build.sh`
- Memory limits on free tier

**Solutions:**
- Check all `package.json` files have required dependencies
- Make `build.sh` executable: `chmod +x build.sh`
- Consider upgrading to paid plan if hitting memory limits

### Runtime Errors

**Common Issues:**
- MongoDB connection failures
- Missing data files
- Python script execution errors
- CORS issues

**Solutions:**
- Verify MongoDB Atlas connection string
- Check if data files exist in `data/` directory
- Ensure Python dependencies are installed
- Check CORS configuration in server.js

## Testing Your Deployment

### 1. Health Check
```bash
curl https://your-service.onrender.com/api/health
```

### 2. API Endpoints
```bash
# Test main API
curl https://your-service.onrender.com/api

# Test predictions
curl https://your-service.onrender.com/api/predictions

# Test shelter locations
curl https://your-service.onrender.com/api/shelter-locations
```

### 3. Frontend
- Visit your service URL in browser
- Test sign-up/sign-in functionality
- Test dashboard and map features

## Monitoring

### Render Dashboard
- Check "Logs" tab for build and runtime errors
- Monitor "Metrics" tab for performance
- Check "Environment" tab for variable settings

### Health Monitoring
- Set up health check endpoint monitoring
- Monitor API response times
- Check for 404/500 errors

## Rollback Plan

If deployment fails:
1. Check previous deployment logs
2. Revert to working commit if needed
3. Fix issues locally first
4. Test with smaller changes
5. Consider using Render's rollback feature 