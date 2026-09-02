# Production Secrets Setup Guide
**Secure Environment Configuration for Deployment**

---

## ⚠️ CRITICAL SECURITY WARNING

**NEVER commit actual secrets to git!**
- Store production secrets only in deployment platform environment variables
- Use `.env.production.example` as a template only
- Rotate secrets every 90 days
- Use different secrets for dev/staging/production

---

## Step 1: Generate JWT Secrets

Run these commands locally to generate secure random secrets:

### Generate JWT_SECRET (128 characters)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example Output:**
```
1b76afe07191391058178039e1dde3a49e4fc10ef547024a91ff45f7d5abcd65f0a509cacf0a2bed0214f0297b021145f96a1bc5aa7fce55499689d77d607bd2
```

### Generate REFRESH_TOKEN_SECRET (128 characters, DIFFERENT from JWT_SECRET)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example Output:**
```
e3e0316ddde50a753fc59d2114b20b926928b574b44d11e6a4965efdba71db1e2aa4af9746791eabe41877b4066f0202a611206f273b78746ffb730fc2961a27
```

**⚠️ IMPORTANT:**
- Copy these secrets immediately to a secure password manager
- Never reuse these example secrets
- Generate fresh secrets for each environment

---

## Step 2: MongoDB Atlas Production Setup

### Create Production Cluster

1. **Go to MongoDB Atlas:**
   - Visit: https://cloud.mongodb.com
   - Login or create account

2. **Create New Cluster:**
   - Click "Build a Database"
   - Choose "M0 Free Tier" (or paid tier for production)
   - Region: Choose closest to your server location
   - Cluster Name: `fti-welcome-hub-prod`

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `prod_fti_user`
   - Password: **Generate strong password** (save to password manager)
   - Database User Privileges: `Read and write to any database`
   - Click "Add User"

4. **Configure Network Access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Option 1 (Recommended): Add your deployment server's IP
   - Option 2 (Quick): Allow access from anywhere (0.0.0.0/0) - requires strong password
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Driver: Node.js, Version: 4.1 or later
   - Copy connection string:
   ```
   mongodb+srv://prod_fti_user:<password>@fti-welcome-hub-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Customize Connection String:**
   ```
   mongodb+srv://prod_fti_user:YOUR_SECURE_PASSWORD@fti-welcome-hub-prod.xxxxx.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority
   ```
   - Replace `<password>` with actual password
   - Add database name: `fti_welcome_hub`

7. **Enable Backup:**
   - Go to cluster settings
   - Enable "Continuous Backup" (paid feature)
   - Or use "Basic Backup" (free tier)

---

## Step 3: Cloudinary Production Setup

### Create Production Account

1. **Sign Up/Login:**
   - Visit: https://cloudinary.com
   - Create account or login

2. **Create Production Environment:**
   - Dashboard → Settings → "Create new cloud"
   - Or use existing cloud for production

3. **Get Credentials:**
   - Go to Dashboard
   - Copy these values:
     - **Cloud name:** e.g., `fti-welcome-hub`
     - **API Key:** e.g., `123456789012345`
     - **API Secret:** Click to reveal, copy to password manager

4. **Configure Upload Presets (Optional but Recommended):**
   - Go to Settings → Upload
   - Create preset: `fti_profiles`
   - Folder: `profiles`
   - Allowed formats: jpg, png, webp
   - Max file size: 5MB

5. **Set Up Folders:**
   - Create folders manually or let app create them:
     - `/profiles` - Employee/intern photos
     - `/announcements` - Announcement covers
     - `/batches` - Intern batch group photos
     - `/knowledge` - Knowledge article images

---

## Step 4: Environment Variables for Deployment Platforms

### For Render (Backend)

1. Go to your service settings
2. Navigate to "Environment" tab
3. Add these key-value pairs:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend.vercel.app
MONGO_URI=mongodb+srv://prod_fti_user:PASSWORD@cluster.mongodb.net/fti_welcome_hub
JWT_SECRET=<your-generated-128-char-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<your-different-128-char-secret>
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECURE=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

4. Click "Save Changes"
5. Service will auto-redeploy

### For Vercel (Frontend)

1. Go to project settings
2. Navigate to "Environment Variables"
3. Add:

```env
VITE_API_URL=https://your-backend.onrender.com/api/v1
```

4. Click "Save"
5. Redeploy to apply changes

### For Railway (Alternative Backend)

1. Go to project variables
2. Click "New Variable"
3. Add all server environment variables (same as Render above)
4. Service will auto-redeploy

---

## Step 5: Verify Configuration

### Test Connection Locally First

1. **Create temporary `.env.production.local`:**
   ```bash
   cp server/.env.production.example server/.env.production.local
   ```

2. **Fill in all values** with production credentials

3. **Test connection:**
   ```bash
   cd server
   NODE_ENV=production node -e "require('dotenv').config({path:'.env.production.local'}); require('./src/config/database');"
   ```

4. **Should see:** "MongoDB Connected: ..."

5. **Delete test file:**
   ```bash
   rm .env.production.local
   ```

---

## Step 6: Security Checklist

Before going live, verify:

- [ ] JWT secrets are 64+ characters (128 recommended)
- [ ] JWT_SECRET ≠ REFRESH_TOKEN_SECRET
- [ ] MongoDB password is strong (16+ chars, mixed case, numbers, symbols)
- [ ] Cloudinary credentials are production-specific
- [ ] CLIENT_URL matches exact production domain (no trailing slash)
- [ ] COOKIE_SECURE=true (requires HTTPS)
- [ ] No secrets in git repository
- [ ] No secrets in CI/CD logs
- [ ] MongoDB IP whitelist configured
- [ ] Cloudinary upload presets configured
- [ ] All secrets stored in password manager
- [ ] 2FA enabled on MongoDB Atlas
- [ ] 2FA enabled on Cloudinary
- [ ] Backup schedule configured

---

## Step 7: Secret Rotation Schedule

### When to Rotate Secrets

**Immediately:**
- Secrets accidentally committed to git
- Team member leaves with access
- Suspected breach or exposure

**Regularly (Every 90 days):**
- JWT_SECRET and REFRESH_TOKEN_SECRET
- Cloudinary API Secret
- MongoDB password

**Annually:**
- Review all service access keys
- Audit team member access

### How to Rotate JWT Secrets

1. **Generate new secrets** (Step 1)
2. **Update environment variables** in deployment platform
3. **Redeploy application**
4. **All users will need to re-login** (expected behavior)

### How to Rotate MongoDB Password

1. **Create new database user** with different password
2. **Update MONGO_URI** with new credentials
3. **Redeploy application**
4. **Delete old database user** after verification

---

## Secret Storage Best Practices

### Recommended Tools

1. **Password Manager:**
   - 1Password Teams
   - LastPass Enterprise
   - Bitwarden

2. **Secret Management (Enterprise):**
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault

### DO ✅
- Store secrets in environment variables
- Use deployment platform's secret management
- Encrypt secrets at rest
- Use different secrets per environment
- Document secret rotation dates
- Require 2FA for access

### DON'T ❌
- Commit secrets to git
- Share secrets via email/Slack
- Reuse secrets across environments
- Use weak/predictable secrets
- Store secrets in code comments
- Share secrets with unauthorized personnel

---

## Emergency Response

### If Secrets Are Compromised

1. **Immediately rotate all secrets:**
   - Generate new JWT secrets
   - Change MongoDB password
   - Regenerate Cloudinary API key

2. **Revoke access:**
   - Invalidate all user sessions (deploy new JWT secret)
   - Update IP whitelist in MongoDB
   - Review access logs

3. **Investigate:**
   - Check git history for exposed secrets
   - Review server logs for unauthorized access
   - Scan for suspicious database activity

4. **Notify:**
   - Inform team members
   - Update incident log
   - Consider user notification if data breach

---

## Quick Reference Commands

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate random password (for MongoDB)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Test MongoDB connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db" --eval "db.runCommand({ping:1})"

# Check environment variables (server)
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET ? 'JWT_SECRET loaded' : 'JWT_SECRET missing')"
```

---

## Support Resources

- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Cloudinary:** https://cloudinary.com/documentation
- **JWT Best Practices:** https://tools.ietf.org/html/rfc8725
- **Node.js Security:** https://nodejs.org/en/docs/guides/security/

---

**Document Version:** 1.0  
**Last Updated:** September 1, 2026  
**Next Review:** October 1, 2026
