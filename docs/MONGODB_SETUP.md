# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (no credit card required)
3. Verify your email address

## Step 2: Create a New Cluster

1. After logging in, click **"Create"** or **"Build a Database"**
2. Choose **M0 (FREE)** tier
3. Select a cloud provider and region (choose closest to your location)
   - Provider: AWS, Google Cloud, or Azure
   - Region: Choose one near Thailand (e.g., Singapore, Mumbai)
4. Cluster Name: `fti-welcome-hub` (or keep default)
5. Click **"Create Cluster"** (takes 3-5 minutes)

## Step 3: Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `fti_admin` (or your choice)
5. Password: Click **"Autogenerate Secure Password"** and SAVE IT
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Whitelist Your IP Address

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, restrict to specific IPs
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** (Clusters)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://fti_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your .env File

1. Open `server/.env` file
2. Replace the MONGO_URI value with your connection string
3. Replace `<password>` with your actual password
4. Add database name at the end:
   ```
   MONGO_URI=mongodb+srv://fti_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority
   ```

## Example Configuration

```env
MONGO_URI=mongodb+srv://fti_admin:MySecurePassword123@cluster0.abc123.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority
```

## Verify Connection

After updating `.env`, start your server:

```bash
npm run dev --prefix server
```

You should see:
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
📊 Database: fti_welcome_hub
```

## Troubleshooting

### "Authentication failed"
- Check username and password in connection string
- Ensure database user has proper permissions

### "IP not whitelisted"
- Add your IP address in Network Access
- Or allow access from anywhere (0.0.0.0/0)

### "Connection timeout"
- Check your internet connection
- Verify firewall isn't blocking MongoDB Atlas (port 27017)

### "Invalid connection string"
- Ensure no spaces in the string
- Password must be URL-encoded if it contains special characters
  - Use: https://www.urlencoder.org/

## For Local Development Alternative

If you prefer local MongoDB:

1. Install MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use connection string: `mongodb://127.0.0.1:27017/fti_welcome_hub`

---

**Next Steps:**
After MongoDB is connected, proceed to test the server with Task 1.8.
