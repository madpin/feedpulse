# Dokploy Deployment Quick Start

## 🚀 Quick Deployment Steps

### 0. GitHub Actions Setup (Automatic Image Building)

Your repository now uses GitHub Actions to automatically build Docker images!

- [ ] Push your code to GitHub (includes `.github/workflows/build-and-push.yml`)
- [ ] GitHub Actions automatically builds and pushes images to GHCR
- [ ] Wait for build to complete (~5-10 minutes first time)
- [ ] Check Actions tab in GitHub to see build status

> ⚡ **Benefit:** Deployments are much faster since images are pre-built!

**See `GITHUB-ACTIONS-SETUP.md` for detailed CI/CD documentation.**

### 1. Prepare Your Repository
- [ ] Commit all files to your repository
- [ ] Push to your main/production branch
- [ ] Wait for GitHub Actions to build images (check Actions tab)

### 2. In Dokploy Dashboard

#### Create New Application
1. Click **"+ New Application"**
2. Select **"Docker Compose"**
3. Fill in:
   - **Name:** `feedpulse`
   - **Git Repository:** `<your-repo-url>`
   - **Branch:** `main`
   - **Compose File:** `docker-compose.prod.yml`

#### Configure Environment Variables
Click on **"Environment Variables"** and add:

```env
# GitHub Container Registry (for pre-built images)
GITHUB_REPOSITORY=yourusername/feedpulse
IMAGE_TAG=latest

# Domain Configuration
DOMAIN=your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Database
POSTGRES_USER=feedpulse
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=feedpulse

# Security
JWT_SECRET=<generate-32-char-secret>
JWT_REFRESH_SECRET=<generate-32-char-secret>

# APIs
OPENAI_API_KEY=<your-openai-key>
CORS_ORIGIN=https://your-domain.com
```

**Generate secrets using:**
```bash
# For JWT secrets
openssl rand -base64 32

# For PostgreSQL password
openssl rand -base64 24
```

#### Configure Domains
1. Go to **"Domains"** tab
2. Add two domains:
   - **Frontend:** `your-domain.com` (or `feedpulse.your-domain.com`)
   - **Backend:** `api.your-domain.com` (or `api.feedpulse.your-domain.com`)
3. Enable **SSL/TLS** (Let's Encrypt) for both

### 3. Authenticate with GitHub Container Registry (if images are private)

If your GHCR packages are private, authenticate before deploying:

```bash
# In Dokploy terminal or SSH to server
docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_GITHUB_PAT
```

> 💡 **Make packages public:** Go to GitHub repo → Packages → Package settings → Change visibility to Public

### 4. Deploy
1. Click **"Deploy"** button
2. Dokploy pulls pre-built images (~1-2 minutes, much faster!)
3. Monitor deployment logs for any errors

### 5. Post-Deployment

#### Run Database Migrations
```bash
# In Dokploy terminal or SSH to server:
docker exec feedpulse-backend npm run db:migrate

# Optional: Seed database
docker exec feedpulse-backend npm run db:seed
```

#### Verify Deployment
```bash
# Check health endpoint
curl https://api.your-domain.com/health

# Check frontend
curl https://your-domain.com
```

---

## 🔧 Essential Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `GITHUB_REPOSITORY` | ✅ | `username/feedpulse` | Your GitHub repo (format: username/repo) |
| `IMAGE_TAG` | ❌ | `latest` | Docker image tag (default: latest) |
| `DOMAIN` | ✅ | `feedpulse.com` | Your main domain |
| `NEXT_PUBLIC_API_URL` | ✅ | `https://api.feedpulse.com` | Backend API URL |
| `POSTGRES_PASSWORD` | ✅ | `random-secure-pwd` | Database password |
| `JWT_SECRET` | ✅ | `32-char-random-string` | JWT signing secret |
| `JWT_REFRESH_SECRET` | ✅ | `32-char-random-string` | Refresh token secret |
| `OPENAI_API_KEY` | ✅ | `sk-...` | OpenAI API key |
| `CORS_ORIGIN` | ✅ | `https://feedpulse.com` | Frontend domain |

---

## 📊 Monitoring

### Check Service Status
In Dokploy:
- Go to your application
- Check **"Containers"** tab
- All services should show green (healthy)

### View Logs
- **Backend:** Click on `feedpulse-backend` container → Logs
- **Frontend:** Click on `feedpulse-frontend` container → Logs
- **Database:** Click on `postgres` container → Logs

---

## 🐛 Common Issues

### ❌ Frontend shows "Failed to fetch"
**Fix:** Check that `NEXT_PUBLIC_API_URL` matches your backend domain

### ❌ CORS errors in browser
**Fix:** Ensure `CORS_ORIGIN` matches your frontend domain exactly (including https://)

### ❌ 502 Bad Gateway
**Fix:** 
1. Check if backend is running: Go to Containers tab
2. Check backend logs for errors
3. Verify port 3838 is exposed

### ❌ Database connection refused
**Fix:**
1. Verify PostgreSQL container is running
2. Check `POSTGRES_PASSWORD` is set correctly
3. Wait for database to be fully initialized (check healthcheck)

---

## 🔄 Updates & Redeployment

### Automatic Deployments
1. In Dokploy, enable **"Auto Deploy"**
2. Select branch to watch (e.g., `main`)
3. Every push will trigger automatic deployment

### Manual Deployment
1. Go to your application in Dokploy
2. Click **"Deploy"** button
3. Select the commit/tag to deploy

---

## 💾 Backups

### Manual Database Backup
```bash
docker exec feedpulse-db pg_dump -U feedpulse feedpulse > backup_$(date +%Y%m%d).sql
```

### Restore from Backup
```bash
docker exec -i feedpulse-db psql -U feedpulse feedpulse < backup_20240101.sql
```

### Automated Backups
Set up in Dokploy:
1. Go to **"Backups"** tab
2. Configure schedule (e.g., daily at 2 AM)
3. Choose backup destination

---

## 📈 Scaling Tips

1. **Increase resources:** In Dokploy, go to Resources tab
2. **Add more backend instances:** Duplicate backend service in compose file
3. **Use managed database:** Consider Dokploy's managed PostgreSQL for better performance
4. **CDN:** Add Cloudflare or similar CDN in front of your frontend

---

## 🔐 Security Checklist

- [ ] Strong passwords for all secrets
- [ ] SSL/TLS enabled for all domains
- [ ] CORS properly configured
- [ ] Rate limiting enabled (already in code)
- [ ] Regular backups scheduled
- [ ] Environment variables not committed to git
- [ ] Latest security updates applied

---

## 📚 Next Steps

After successful deployment:

1. **Set up monitoring:** Configure alerts in Dokploy
2. **Configure analytics:** Add application monitoring (e.g., Sentry)
3. **Enable backups:** Set up automated database backups
4. **Documentation:** Update your README with production URLs
5. **Testing:** Test all features in production environment

---

## 🆘 Getting Help

- Check full deployment guide: `DOKPLOY-DEPLOYMENT.md`
- Dokploy docs: https://docs.dokploy.com
- View application logs in Dokploy dashboard
- Check health endpoint: `https://api.your-domain.com/health`

