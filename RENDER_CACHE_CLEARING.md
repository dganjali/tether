# Render Cache Clearing Guide

## 🧹 How to Clear Cache on Render

### Method 1: Manual Deploy with Cache Clear (Recommended)

1. **Go to Render Dashboard**
   - Navigate to your service in the Render dashboard
   - Click on your service name

2. **Manual Deploy**
   - Click the "Manual Deploy" button
   - Select "Clear build cache & deploy"
   - This will completely clear all cached build artifacts

3. **Wait for Deployment**
   - Monitor the deployment logs
   - This may take longer than usual since it's a fresh build

### Method 2: Environment Variable Approach

Add this environment variable to your Render service:

```
CLEAR_CACHE=true
```

Then in your `build.sh`, add this at the beginning:

```bash
#!/bin/bash

# Clear cache if environment variable is set
if [ "$CLEAR_CACHE" = "true" ]; then
    echo "🧹 Clearing build cache..."
    rm -rf node_modules
    rm -rf frontend/node_modules
    rm -f package-lock.json
    rm -f frontend/package-lock.json
    rm -rf frontend/build
    rm -rf backend/dist
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
fi
```

### Method 3: Local Cache Clearing

Run the provided script locally:

```bash
chmod +x clear-cache.sh
./clear-cache.sh
```

Then commit and push your changes.

### Method 4: Force New Deployment

1. **Make a small change** to trigger a new deployment
2. **Update a comment** or add a space in any file
3. **Commit and push** the change
4. **Render will automatically** start a fresh deployment

## 🔧 Common Cache Issues

### Frontend Build Cache
- **Issue**: Old React components not updating
- **Solution**: Clear build cache in Render dashboard

### Node Modules Cache
- **Issue**: Dependency conflicts
- **Solution**: Delete node_modules and reinstall

### Python Cache
- **Issue**: Python scripts not updating
- **Solution**: Clear __pycache__ directories

### Database Cache
- **Issue**: Old data persisting
- **Solution**: Check MongoDB connection and clear collections if needed

## 📋 Pre-Deployment Checklist

Before deploying to Render:

- [ ] Run `npm run build` locally to test
- [ ] Check for any console errors
- [ ] Verify all environment variables are set
- [ ] Test the application locally
- [ ] Clear local cache if needed

## 🚀 Post-Deployment Verification

After deployment:

- [ ] Check the deployment logs for errors
- [ ] Test the live application
- [ ] Verify all features work correctly
- [ ] Check browser console for any errors
- [ ] Test authentication flow

## 🆘 If Issues Persist

1. **Check Render Logs**: Look for specific error messages
2. **Verify Environment Variables**: Ensure all required vars are set
3. **Test Locally**: Make sure it works on your machine
4. **Contact Support**: If the issue persists, contact Render support

## 📝 Quick Commands

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules frontend/node_modules

# Clear build artifacts
rm -rf frontend/build

# Reinstall dependencies
npm install && cd frontend && npm install && cd ..

# Run the cache clearing script
./clear-cache.sh
```

## 🔄 Automatic Cache Clearing

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "clear-cache": "./clear-cache.sh",
    "predeploy": "npm run clear-cache"
  }
}
```

This will automatically clear cache before each deployment. 