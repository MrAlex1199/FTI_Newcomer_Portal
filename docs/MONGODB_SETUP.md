# MongoDB Atlas Setup Guide
**Complete guide for Development and Production MongoDB configuration**

---

## Overview

This guide covers MongoDB Atlas setup for both development and production environments. MongoDB Atlas is a fully-managed cloud database service with automated backups, monitoring, and scaling.

**Environments:**
- **Development:** Free M0 tier (512MB storage, shared cluster)
- **Production:** M2+ tier (recommended M10 for production, ~$57/month)

---

## Part 1: Development Setup (Free Tier)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (no credit card required)
3. Verify your email address
4. **Enable 2FA** (Settings → Account Security) for security

### Step 2: Create Development Cluster

1. After logging in, click **"Create"** or **"Build a Database"**
2. Choose **M0 (FREE)** tier
   - 512MB storage
   - Shared RAM and vCPU
   - Perfect for development
3. Select a cloud provider and region
   - **Provider:** AWS (recommended for Thailand)
   - **Region:** Singapore (ap-southeast-1) - closest to Thailand
   - Alternative: Mumbai (ap-south-1)
4. Cluster Name: `fti-welcome-hub-dev`
5. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 3: Create Database User

1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. **Username:** `dev_fti_user`
5. **Password:** Click **"Autogenerate Secure Password"**
   - **SAVE THIS PASSWORD** in a secure password manager
   - Example: `dK7m2Pq9Xc4vB8nR`
6. **Database User Privileges:** Select **"Read and write to any database"**
7. **Temporary User:** Toggle OFF (we want permanent access)
8. Click **"Add User"**

**Security Note:** Never commit passwords to git. Use environment variables.

### Step 4: Configure Network Access

1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**

**For Development:**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This allows connections from any IP
   - Convenient for development
   - Security relies on username/password
4. Comment: "Development - Allow all IPs"
5. Click **"Confirm"**

**⚠️ Production Note:** Never use 0.0.0.0/0 in production. See Part 2 for production network setup.

### Step 5: Get Connection String

1. Go back to **"Database"** (Clusters)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. **Driver:** Node.js
5. **Version:** 5.5 or later
6. Copy the connection string:
   ```
   mongodb+srv://dev_fti_user:<password>@fti-welcome-hub-dev.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **Important:** Note the cluster identifier (e.g., `abc123.mongodb.net`)

### Step 6: Configure Environment Variables

1. Open `server/.env` file (create from `.env.example` if needed)
2. Update the MONGO_URI value:
   - Replace `<password>` with your actual password
   - Add database name: `/fti_welcome_hub` before the `?`
   
**Example:**
```env
MONGO_URI=mongodb+srv://dev_fti_user:dK7m2Pq9Xc4vB8nR@fti-welcome-hub-dev.abc123.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority
```

**⚠️ Special Characters:** If password contains `@`, `:`, `/`, `?`, `#`, `[`, `]`, use URL encoding:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- Use encoder: https://www.urlencoder.org/

### Step 7: Verify Connection

Start your server:
```bash
cd server
npm start
```

**Expected output:**
```
🚀 ════════════════════════════════════════════════════════
   FTI Welcome Hub Server is running
   Environment: development
   Port: 5000
🚀 ════════════════════════════════════════════════════════
✅ MongoDB Connected: fti-welcome-hub-dev-shard-00-00.abc123.mongodb.net
📊 Database: fti_welcome_hub
```

**Success!** ✅ Your development database is now connected.

---

## Part 2: Production Setup (Paid Tier)

### Prerequisites
- Credit card for paid tier
- Production deployment plan (Render, Railway, AWS, etc.)
- Security review completed

### Step 1: Create Production Cluster

1. In MongoDB Atlas dashboard, click **"Create"** → **"Build a Database"**
2. Choose **M10 Dedicated** tier
   - **Recommended for Production**
   - 10GB storage
   - Dedicated RAM and vCPU
   - Automated backups included
   - Cost: ~$57/month (AWS Singapore)

**Configuration:**
- **Cloud Provider:** AWS (or match your deployment platform)
- **Region:** Singapore (ap-southeast-1) for Thailand
- **Cluster Tier:** M10 (or higher based on traffic)
- **Cluster Name:** `fti-welcome-hub-prod`
- **MongoDB Version:** 7.0 (latest stable)
- **Backup:** Continuous Cloud Backup (enabled by default)
- **Additional Settings:**
  - Enable **Point-in-Time Restore** (recommended)
  - Enable **Queryable Backup** (optional, for analytics)

3. Click **"Create Cluster"** (takes 7-10 minutes)

### Step 2: Create Production Database User

**Security Best Practice:** Use separate credentials for production

1. Go to **"Database Access"**
2. Click **"Add New Database User"**
3. **Username:** `prod_fti_user`
4. **Password:** Generate strong 32+ character password
   ```bash
   # Generate secure password
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
5. **Database User Privileges:**
   - Select **"Built-in Role"**
   - Choose **"Read and write to any database"**
   - **DO NOT** grant `atlasAdmin` or `backup` roles (principle of least privilege)
6. **Restrict to Specific Clusters:** Select only `fti-welcome-hub-prod`
7. Click **"Add User"**
8. **SAVE PASSWORD** in team password manager immediately

### Step 3: Configure Production Network Access

**Critical Security:** DO NOT use 0.0.0.0/0 in production

#### Option A: Whitelist Deployment Server IPs (Recommended)

**For Render:**
1. Get Render egress IPs from: https://render.com/docs/static-outbound-ip-addresses
2. Add each IP individually in MongoDB Network Access
3. Comment: "Render production server - [Region]"

**For Railway:**
1. Railway provides static IPs on Pro plan
2. Or use Railway's proxy service
3. Whitelist those IPs

**For AWS/Azure:**
1. Use NAT Gateway with Elastic IP
2. Whitelist the Elastic IP

#### Option B: Temporary 0.0.0.0/0 (Not Recommended)
If you cannot get static IPs:
1. **Temporarily** allow 0.0.0.0/0
2. **Ensure strong password** (32+ characters)
3. **Enable** Additional Security Measures below
4. **Plan migration** to Option A

**Add IP Address:**
1. Click **"Add IP Address"**
2. Enter production server IP (or range)
3. Comment: "Production Server - [Platform Name]"
4. Click **"Confirm"**
5. Repeat for each IP/range

### Step 4: Enable Security Features

#### A. Enable Database Auditing
1. Go to Cluster → **"..."** → **"Edit Configuration"**
2. Scroll to **"Additional Settings"**
3. Enable **"Database Auditing"**
4. Configure audit filters (track all operations initially)

#### B. Enable Encryption at Rest
1. In cluster settings
2. Verify **"Encryption at Rest"** is enabled (default for M10+)
3. Optionally: Use your own encryption keys (BYOK)

#### C. Configure Alerts
1. Go to **"Alerts"** in left sidebar
2. Create alerts for:
   - High connection count
   - Disk usage > 75%
   - Replica set elections
   - Authentication failures
3. Set notification email to team alias

### Step 5: Get Production Connection String

1. Go to **"Database"** → Click **"Connect"** on production cluster
2. Choose **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy connection string:
   ```
   mongodb+srv://prod_fti_user:<password>@fti-welcome-hub-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=fti-welcome-hub-prod
   ```

### Step 6: Configure Production Environment

**DO NOT store connection string in .env file in production!**

Instead, use your deployment platform's environment variable system:

#### For Render:
1. Go to service → **Environment**
2. Add variable:
   - Key: `MONGO_URI`
   - Value: `mongodb+srv://prod_fti_user:YOUR_SECURE_PASSWORD@fti-welcome-hub-prod.xxxxx.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority`
3. Click **Save Changes**

#### For Railway:
1. Go to project → **Variables**
2. Click **New Variable**
3. Add `MONGO_URI` with connection string
4. Service auto-redeploys

#### For Vercel (if using Serverless Functions):
1. Go to project → **Settings** → **Environment Variables**
2. Add `MONGO_URI`
3. Scope: Production
4. Redeploy

### Step 7: Configure Backup Strategy

**Automated Backups (Included in M10+):**
1. Go to cluster → **Backup** tab
2. Verify **Continuous Cloud Backup** is enabled
3. **Snapshot Schedule:**
   - Keep: 2 daily snapshots
   - Keep: 7 weekly snapshots
   - Keep: 12 monthly snapshots
4. **Point-in-Time Restore:** Enabled (allows restore to any point in last 24h)

**Manual Backup Before Major Changes:**
1. Go to **Backup** tab
2. Click **"Take Snapshot Now"**
3. Label: "Pre-deployment [date]" or "Before migration"
4. Expiration: 30 days (or longer for important milestones)

### Step 8: Set Up Monitoring

1. Go to **"Metrics"** in cluster view
2. Key metrics to watch:
   - **Connections:** Should stay < 100 for typical load
   - **Network:** Monitor ingress/egress
   - **Op Execution Time:** Query performance
   - **Disk IOPS:** Disk activity

3. Configure **Performance Advisor**:
   - Provides index recommendations
   - Identifies slow queries
   - Auto-enabled for M10+

### Step 9: Create Indexes for Production

Before launch, create necessary indexes:

```javascript
// Connect to MongoDB Atlas using mongosh or Compass
// Or run via your application's seed script

// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Employees collection
db.employees.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ departmentId: 1 });
db.employees.createIndex({ firstName: "text", lastName: "text", position: "text" });

// Interns collection
db.interns.createIndex({ email: 1 }, { unique: true });
db.interns.createIndex({ batchId: 1, departmentId: 1 });
db.interns.createIndex({ firstName: "text", lastName: "text", university: "text" });

// Announcements collection
db.announcements.createIndex({ publishAt: -1, status: 1 });
db.announcements.createIndex({ title: "text", summary: "text" });
db.announcements.createIndex({ isPinned: -1, publishAt: -1 });

// More indexes will be created by your Mongoose schemas
```

### Step 10: Test Production Connection

**From local machine with production credentials:**

```bash
# Test connection (don't commit this file!)
echo "MONGO_URI=mongodb+srv://prod_fti_user:PASSWORD@fti-welcome-hub-prod.xxxxx.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority" > .env.prod.test

# Test
NODE_ENV=production node -e "
require('dotenv').config({ path: '.env.prod.test' });
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => { console.log('✅ Production connection successful!'); process.exit(0); })
  .catch(err => { console.error('❌ Connection failed:', err.message); process.exit(1); });
"

# Delete test file
rm .env.prod.test
```

**Expected output:**
```
✅ Production connection successful!
```

### Step 11: Data Migration (if migrating from dev)

If you need to copy data from development to production:

**Option A: mongodump/mongorestore**
```bash
# Dump from development
mongodump --uri="mongodb+srv://dev_fti_user:PASS@dev-cluster.mongodb.net/fti_welcome_hub" --out=./dump

# Restore to production
mongorestore --uri="mongodb+srv://prod_fti_user:PASS@prod-cluster.mongodb.net/fti_welcome_hub" --dir=./dump/fti_welcome_hub

# Clean up
rm -rf ./dump
```

**Option B: Atlas Live Migration**
1. Go to Production cluster → **"..."** → **"Migrate Data to this Cluster"**
2. Follow wizard to migrate from another Atlas cluster
3. Zero downtime migration available

---

## Part 3: Post-Deployment Maintenance

### Daily Tasks
- [ ] Check **Alerts** for any issues
- [ ] Monitor **Metrics** dashboard for anomalies
- [ ] Review connection count trends

### Weekly Tasks
- [ ] Review **Performance Advisor** recommendations
- [ ] Check **slow query** logs
- [ ] Verify **backups** are completing successfully
- [ ] Review disk usage trends

### Monthly Tasks
- [ ] Test **backup restore** procedure
- [ ] Review and optimize indexes
- [ ] Update database user passwords (quarterly)
- [ ] Review access logs for unauthorized attempts
- [ ] Check for MongoDB version updates

### Quarterly Tasks
- [ ] Full security audit
- [ ] Review and adjust cluster tier if needed
- [ ] Disaster recovery drill
- [ ] Update team documentation

---

## Troubleshooting

### Common Issues

#### "Authentication failed"
**Cause:** Wrong username or password
**Solution:**
1. Verify credentials in environment variables
2. Check for special characters needing URL encoding
3. Verify user exists in Database Access
4. Check user has correct permissions

#### "IP not whitelisted"
**Cause:** Connection IP not in Network Access list
**Solution:**
1. Get your current IP: `curl ifconfig.me`
2. Add IP in Network Access
3. For deployment platforms, use static IPs or allow 0.0.0.0/0 temporarily

#### "Connection timeout"
**Cause:** Network/firewall blocking
**Solution:**
1. Check internet connection
2. Verify firewall allows MongoDB port (27017, 27018, 27019)
3. Try different network
4. Check Atlas status page: https://status.mongodb.com/

#### "Too many connections"
**Cause:** Connection pool exhausted
**Solution:**
1. Check for connection leaks in code
2. Increase maxPoolSize in connection options:
   ```javascript
   mongoose.connect(uri, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000
   })
   ```
3. Consider upgrading cluster tier

#### "Slow queries"
**Cause:** Missing indexes or inefficient queries
**Solution:**
1. Check Performance Advisor in Atlas
2. Add recommended indexes
3. Use `.explain()` to analyze queries
4. Add compound indexes for common query patterns

#### "Database user not authorized"
**Cause:** User lacks permissions for operation
**Solution:**
1. Go to Database Access
2. Edit user privileges
3. Grant "readWrite" or specific role
4. Wait 1-2 minutes for propagation

### Password Reset

If you need to reset database user password:

1. Go to **Database Access**
2. Click **"Edit"** on the user
3. Click **"Edit Password"**
4. Generate new secure password
5. Update environment variables in deployment platform
6. Redeploy application

### Emergency Recovery

**If database is corrupted or data deleted:**

1. Go to **Backup** tab
2. Click **"Restore"**
3. Choose restore method:
   - **Point-in-Time:** Restore to specific time
   - **Snapshot:** Restore from specific snapshot
4. Select target cluster (create new cluster recommended)
5. Verify data after restore
6. Update connection string to new cluster

---

## Cost Optimization Tips

### Development
- Use **M0 Free tier** (up to 3 clusters per project)
- Delete unused test clusters
- Share development cluster across team

### Production
- **Start with M10**, scale up based on metrics
- **Enable auto-scaling** for storage
- **Use AWS same region** as your server (reduce data transfer costs)
- **Archive old data** to reduce storage costs
- **Monitor** Data Explorer for unused collections

### Cost Estimation

| Tier | RAM | Storage | Cost/Month | Use Case |
|------|-----|---------|------------|----------|
| M0 | Shared | 512MB | Free | Development |
| M2 | Shared | 2GB | ~$9 | Small staging |
| M10 | 2GB | 10GB | ~$57 | Small production |
| M20 | 4GB | 20GB | ~$130 | Medium production |
| M30 | 8GB | 40GB | ~$280 | Large production |

**Current setup:** M0 (dev) + M10 (prod) = ~$57/month

---

## Security Checklist

Before going live, verify:

- [ ] Production cluster uses M10+ tier
- [ ] Separate database users for dev/prod
- [ ] Strong passwords (32+ characters)
- [ ] Network Access restricted to specific IPs (not 0.0.0.0/0)
- [ ] Encryption at Rest enabled
- [ ] Database Auditing enabled
- [ ] Alerts configured
- [ ] Automated backups enabled
- [ ] Point-in-Time Restore enabled
- [ ] 2FA enabled on MongoDB Atlas account
- [ ] Database connection string not in git
- [ ] Connection string stored in secure environment variables
- [ ] Team members have appropriate access levels only

---

## Additional Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Connection String Reference](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Security Checklist](https://www.mongodb.com/docs/atlas/security-checklist/)
- [Performance Best Practices](https://www.mongodb.com/docs/atlas/performance-best-practices/)
- [Backup and Restore](https://www.mongodb.com/docs/atlas/backup-restore-cluster/)
- [MongoDB University](https://university.mongodb.com/) - Free courses

---

## Support

**MongoDB Atlas Support:**
- Free tier: Community forums only
- M10+ (paid): Email support within 24-48 hours
- M40+ (paid): Priority support

**Community:**
- MongoDB Community Forums: https://www.mongodb.com/community/forums/
- Stack Overflow: Tag `mongodb-atlas`

---

**Document Version:** 2.0  
**Last Updated:** September 1, 2026  
**Next Review:** October 1, 2026
