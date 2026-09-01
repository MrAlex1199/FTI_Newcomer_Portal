# Deployment Guide
**FTI Welcome Hub - Production Deployment**

## 📋 Pre-Deployment Checklist

### 1. Security
- [ ] Update `JWT_SECRET` and `REFRESH_TOKEN_SECRET` to secure random values
- [ ] Update sharp package to v0.35.4+ (security vulnerability)
- [ ] Review and update CORS `CLIENT_URL` to production domain
- [ ] Verify Cloudinary credentials are production keys
- [ ] Enable HTTPS enforcement
- [ ] Review rate limiting settings
- [ ] Run `npm audit` and fix vulnerabilities

### 2. Environment Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB Atlas cluster
- [ ] Set up Cloudinary production environment
- [ ] Configure production API URL in client

### 3. Database
- [ ] Create production MongoDB Atlas cluster
- [ ] Whitelist production server IP addresses
- [ ] Set up database backups (MongoDB Atlas automated backups)
- [ ] Run database seed (optional - for demo data)
- [ ] Verify all indexes are created

### 4. Testing
- [ ] Run full test suite
- [ ] Test all authentication flows
- [ ] Verify role-based access control
- [ ] Test file uploads
- [ ] Check API response times
- [ ] Verify error handling

## 🚀 Deployment Options

### Option A: Vercel (Frontend) + Render (Backend)

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Build client:**
```bash
cd client
npm run build
```

3. **Deploy to Vercel:**
```bash
vercel
```

4. **Configure Environment Variables in Vercel:**
   - `VITE_API_URL` = Your production API URL (e.g., `https://your-api.onrender.com/api/v1`)

5. **Set up custom domain (optional):**
```bash
vercel domains add yourdomain.com
```

#### Backend Deployment (Render)

1. **Create new Web Service on Render:**
   - Connect your GitHub/GitLab repository
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Configure Environment Variables:**
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-vercel-app.vercel.app

MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/fti_welcome_hub
JWT_SECRET=<generate-secure-64-char-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<generate-different-secure-64-char-string>
REFRESH_TOKEN_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

3. **Deploy:**
   - Render will automatically deploy on git push to main branch

### Option B: AWS (EC2 + S3) or Azure

See detailed cloud provider guides:
- [AWS Deployment](DEPLOYMENT_AWS.md) - Coming soon
- [Azure Deployment](DEPLOYMENT_AZURE.md) - Coming soon

### Option C: Docker + Container Hosting

See [Docker Deployment](DEPLOYMENT_DOCKER.md) - Coming soon

## 🔐 Generating Secure Secrets

### JWT Secrets
Use Node.js to generate secure random strings:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use online tools:
- https://randomkeygen.com/ (use Fort Knox Passwords)

## 🗄️ MongoDB Atlas Setup

### 1. Create Production Cluster
1. Log in to MongoDB Atlas
2. Create new cluster (M2 or higher for production)
3. Select your region (closest to your users)
4. Enable backups (automated daily backups)

### 2. Database Security
1. **Network Access:**
   - Add IP addresses of your production servers
   - Or use `0.0.0.0/0` (less secure, but works with dynamic IPs)

2. **Database User:**
   - Create dedicated production user
   - Use strong password
   - Grant `readWrite` role only

3. **Get Connection String:**
```
mongodb+srv://<username>:<password>@cluster.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority
```

## ☁️ Cloudinary Setup

### 1. Production Environment
1. Create separate Cloudinary account for production
2. Get credentials from dashboard
3. Set up folder structure:
   - `/profiles` - Profile images
   - `/announcements` - Announcement covers
   - `/batches` - Intern batch photos

### 2. Configure in Environment
```env
CLOUDINARY_CLOUD_NAME=your_production_cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_secret_key
```

## 🔧 Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Check health endpoint
curl https://your-api-domain.com/api/health

# Expected response
{"success":true,"message":"Server is running","timestamp":"...","environment":"production"}
```

### 2. Create Admin Account
```bash
# Option 1: Run seed script (creates 5 default accounts)
npm run seed

# Option 2: Create via API (recommended for production)
POST /api/v1/admin/users
{
  "username": "admin",
  "email": "admin@functioninter.co.th",
  "password": "SecurePassword123!",
  "role": "admin"
}
```

### 3. Test Complete User Journey
1. Login as admin
2. Create announcement
3. Create employee
4. Search functionality
5. View organization chart
6. Upload profile image
7. Submit feedback
8. Logout

### 4. Monitor Application
- Set up error tracking (e.g., Sentry)
- Monitor API response times
- Check database performance
- Review logs regularly

## 📊 Performance Optimization

### 1. Enable Compression
Already configured in server with Helmet.

### 2. CDN for Static Assets
Vercel automatically provides CDN for frontend.

### 3. Database Indexes
All indexes are already defined in models. Verify with:
```bash
# Check indexes
db.employees.getIndexes()
db.announcements.getIndexes()
```

### 4. Caching Strategy
Consider adding Redis for:
- Company information
- Department list
- Published policies (rarely change)

## 🚨 Troubleshooting

### Issue: MongoDB Connection Failed
**Solution:**
1. Check connection string format
2. Verify IP whitelist in MongoDB Atlas
3. Ensure database user has correct permissions
4. Test connection with MongoDB Compass

### Issue: Cloudinary Upload Fails
**Solution:**
1. Verify credentials in `.env`
2. Check file size (< 5MB)
3. Verify file type (JPG, PNG, WebP only)
4. Check Cloudinary dashboard quota

### Issue: 401 Unauthorized Errors
**Solution:**
1. Verify `JWT_SECRET` matches between deployments
2. Check cookie settings (secure, sameSite)
3. Ensure `CLIENT_URL` in server matches actual frontend URL
4. Verify CORS configuration

### Issue: Frontend Can't Connect to Backend
**Solution:**
1. Check `VITE_API_URL` in frontend `.env`
2. Verify CORS `CLIENT_URL` in backend
3. Check network/firewall settings
4. Test API directly with curl

## 🔄 Continuous Deployment

### GitHub Actions
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Deploy to Vercel
        run: |
          cd client
          npm install
          npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

## 📝 Maintenance

### Regular Tasks
- [ ] Weekly: Review audit logs
- [ ] Weekly: Check error reports
- [ ] Monthly: Update dependencies (`npm update`)
- [ ] Monthly: Review and clean up old data
- [ ] Quarterly: Security audit (`npm audit`)
- [ ] Quarterly: Performance review

### Backup Strategy
- MongoDB Atlas: Automated daily backups (retained 7 days)
- Cloudinary: Images backed up automatically
- Database exports: Manual monthly exports recommended

## 📞 Support

For deployment issues:
1. Check logs in Render/Vercel dashboard
2. Review error tracking (Sentry)
3. Contact DevOps team
4. Check MongoDB Atlas monitoring

---

**Last Updated:** September 1, 2026  
**Version:** 1.0
