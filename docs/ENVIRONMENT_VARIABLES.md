# Environment Variables Reference
**Complete guide to configuring FTI Welcome Hub**

---

## Overview

The FTI Welcome Hub uses environment variables for configuration to keep sensitive data secure and enable easy deployment across different environments (development, staging, production).

---

## Quick Start

### Development Setup

1. **Server:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB Atlas and Cloudinary credentials
   ```

2. **Client:**
   ```bash
   cd client
   cp .env.example .env
   # Default settings work for local development
   ```

3. **Start both:**
   ```bash
   # From project root
   npm run dev
   ```

---

## Server Environment Variables

Location: `server/.env`

### Application Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment mode: `development`, `staging`, `production` |
| `PORT` | Yes | `5000` | Port number for the server |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Frontend URL for CORS (must match exactly) |

**Example:**
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Production:**
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://fti-welcome-hub.vercel.app
```

---

### Database Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |

**Development (Local):**
```env
MONGO_URI=mongodb://127.0.0.1:27017/fti_welcome_hub
```

**Development/Production (MongoDB Atlas):**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fti_welcome_hub?retryWrites=true&w=majority
```

**How to get:**
1. Create cluster at https://cloud.mongodb.com
2. Click "Connect" → "Connect your application"
3. Copy connection string
4. Replace `<username>`, `<password>`, and database name

---

### JWT Security Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret for signing JWT access tokens |
| `JWT_EXPIRES_IN` | No | `15m` | Access token expiration (e.g., 15m, 1h, 2d) |
| `REFRESH_TOKEN_SECRET` | Yes | - | Secret for signing refresh tokens (MUST be different from JWT_SECRET) |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `7d` | Refresh token expiration |

**⚠️ CRITICAL SECURITY:**
- **NEVER** use default/example secrets in production
- **ALWAYS** generate new secrets for each environment
- Secrets should be 64+ characters (128 recommended)

**Generate Secure Secrets:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET (run again for different value)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Development Example:**
```env
JWT_SECRET=dev_secret_only_for_testing_not_for_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=dev_refresh_secret_different_from_above
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Production Example:**
```env
JWT_SECRET=a1b2c3d4e5f6...128-character-random-hex-string
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=z9y8x7w6v5u4...different-128-character-string
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

### Cookie Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COOKIE_SECURE` | No | `false` (dev), `true` (prod) | Require HTTPS for cookies |
| `COOKIE_SAME_SITE` | No | `strict` | Cookie SameSite policy: `strict`, `lax`, `none` |

**Development (HTTP):**
```env
# COOKIE_SECURE=false (default for development)
```

**Production (HTTPS):**
```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
```

---

### Cloudinary Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | API key from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Yes | API secret from Cloudinary dashboard |

**How to get:**
1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy Cloud name, API Key, and API Secret

**Example:**
```env
CLOUDINARY_CLOUD_NAME=fti-welcome-hub
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

**⚠️ Security Note:**
- Use separate Cloudinary accounts for dev/prod
- Or create different "environments" in Cloudinary dashboard

---

### File Upload Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UPLOAD_DIR` | No | `uploads` | Temporary upload directory |
| `MAX_FILE_SIZE` | No | `5242880` | Max file size in bytes (5MB default) |

**Example:**
```env
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

**To change max upload size:**
```env
# 10MB
MAX_FILE_SIZE=10485760

# 2MB
MAX_FILE_SIZE=2097152
```

---

### Rate Limiting (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Time window in milliseconds (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | No | `5` | Max auth attempts per window |

**Example (more restrictive for production):**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
AUTH_RATE_LIMIT_MAX_REQUESTS=3
```

---

### Logging (Optional)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | Logging level: `error`, `warn`, `info`, `debug` |

**Example:**
```env
# Development: See all logs
LOG_LEVEL=debug

# Production: Only errors and warnings
LOG_LEVEL=warn
```

---

## Client Environment Variables

Location: `client/.env`

### API Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `http://localhost:5000/api/v1` | Backend API URL (must include /api/v1) |

**⚠️ Important:**
- **MUST** start with `VITE_` to be accessible in client code
- **MUST** include `/api/v1` path
- **MUST** match server's CORS configuration

**Development:**
```env
VITE_API_URL=http://localhost:5000/api/v1
```

**Production:**
```env
VITE_API_URL=https://fti-welcome-hub-api.onrender.com/api/v1
```

---

## Environment-Specific Configurations

### Development Environment

**server/.env:**
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://dev_user:password@cluster.mongodb.net/fti_welcome_hub_dev
JWT_SECRET=dev_secret_can_be_simple
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=dev_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=fti-dev
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=dev_secret
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

**client/.env:**
```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

### Production Environment

**server/.env (or platform environment variables):**
```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://fti-welcome-hub.vercel.app
MONGO_URI=mongodb+srv://prod_user:secure_password@prod-cluster.mongodb.net/fti_welcome_hub
JWT_SECRET=<128-character-random-hex-from-crypto>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<different-128-character-random-hex>
REFRESH_TOKEN_EXPIRES_IN=7d
COOKIE_SECURE=true
CLOUDINARY_CLOUD_NAME=fti-production
CLOUDINARY_API_KEY=987654321
CLOUDINARY_API_SECRET=prod_api_secret_secure
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

**client/.env (or platform environment variables):**
```env
VITE_API_URL=https://fti-welcome-hub-api.onrender.com/api/v1
```

---

## Deployment Platform Configuration

### Vercel (Frontend)

1. Go to Project Settings → Environment Variables
2. Add variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api/v1`
3. Redeploy

**CLI:**
```bash
vercel env add VITE_API_URL
# Enter: https://your-backend.onrender.com/api/v1
```

---

### Render (Backend)

1. Go to Service → Environment
2. Add all server environment variables
3. Service auto-redeploys

**From Dashboard:**
- Click "Add Environment Variable"
- Paste all variables from `.env.production.example`

---

### Railway (Backend Alternative)

1. Go to Project → Variables
2. Click "New Variable"
3. Add all server environment variables
4. Service auto-redeploys

**CLI:**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=5000
# ... add all variables
```

---

### Netlify (Frontend Alternative)

1. Go to Site Settings → Build & Deploy → Environment
2. Add variables:
   - `VITE_API_URL`: Backend URL
3. Trigger redeploy

---

## Validation & Troubleshooting

### Check if Variables are Loaded

**Server:**
```bash
cd server
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Loaded ✓' : 'Missing ✗')"
```

**Client:**
```bash
cd client
node -e "require('dotenv').config(); console.log('VITE_API_URL:', process.env.VITE_API_URL)"
```

---

### Common Issues

#### Server can't connect to MongoDB
```
Error: MongooseServerSelectionError
```
**Solutions:**
- Check `MONGO_URI` format
- Verify username/password are URL-encoded
- Check IP whitelist in MongoDB Atlas
- Test connection: `mongosh "your_connection_string"`

#### Client can't reach API
```
Error: Network Error / CORS Error
```
**Solutions:**
- Verify `VITE_API_URL` includes `/api/v1`
- Check server `CLIENT_URL` matches client domain exactly
- Ensure server is running and accessible
- Test API: `curl http://localhost:5000/api/health`

#### JWT Token Issues
```
Error: jwt must be provided / jwt malformed
```
**Solutions:**
- Verify `JWT_SECRET` is set
- Check cookies are enabled in browser
- Ensure `COOKIE_SECURE=false` for HTTP (dev)
- Clear browser cookies and re-login

#### File Upload Fails
```
Error: Invalid API key
```
**Solutions:**
- Verify all Cloudinary variables are set
- Check API key is correct (no spaces)
- Ensure cloud name matches your account

---

## Security Best Practices

### ✅ DO
- Use `.env.example` files (committed to git)
- Use `.env` files (gitignored, never commit)
- Generate new secrets for each environment
- Use 64+ character secrets (128 recommended)
- Store production secrets in deployment platform
- Rotate secrets every 90 days
- Use HTTPS in production (`COOKIE_SECURE=true`)
- Use different MongoDB/Cloudinary accounts for dev/prod

### ❌ DON'T
- Commit `.env` files to git
- Share secrets via email/Slack
- Reuse secrets across environments
- Use simple/predictable secrets
- Hardcode secrets in source code
- Use development secrets in production
- Use HTTP in production

---

## Quick Reference

### Generate Secrets
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Test MongoDB Connection
```bash
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db" --eval "db.runCommand({ping:1})"
```

### Test API Endpoint
```bash
curl http://localhost:5000/api/health
```

### Check Environment
```bash
# Server
cd server && node -e "require('dotenv').config(); console.log(process.env.NODE_ENV)"

# Client
cd client && npm run build && cat dist/index.html | grep VITE_API_URL
```

---

## Additional Resources

- [Production Secrets Setup](./PRODUCTION_SECRETS_SETUP.md)
- [MongoDB Atlas Setup](./MONGODB_SETUP.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Audit](./SECURITY_AUDIT.md)

---

**Document Version:** 1.0  
**Last Updated:** September 1, 2026
