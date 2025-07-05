# Required Environment Variables for Render Deployment

## Essential Environment Variables

Add these environment variables in your Render service settings:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shelter_system
JWT_SECRET=your_very_strong_secret_key_here
NODE_ENV=production
PORT=10000
```

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Click on your service
3. Go to "Environment" tab
4. Add each variable:
   - **Key:** `MONGODB_URI`
   - **Value:** Your MongoDB Atlas connection string
   - **Key:** `JWT_SECRET`
   - **Value:** A strong random string (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - **Key:** `NODE_ENV`
   - **Value:** `production`
   - **Key:** `PORT`
   - **Value:** `10000`

## Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a cluster
3. Set up database access (username/password)
4. Set up network access (allow all IPs: 0.0.0.0/0)
5. Get your connection string

Your connection string should look like:
```
mongodb+srv://username:password@cluster.mongodb.net/shelter_system?retryWrites=true&w=majority
```

## Troubleshooting

- If `MONGODB_URI` is missing, the server will start but database functionality will be disabled
- If `JWT_SECRET` is missing, authentication will not work properly
- Render automatically sets `PORT`, but you can override it
- Make sure `NODE_ENV=production` for proper error handling 