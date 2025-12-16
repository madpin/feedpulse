# FeedPulse CI/CD with GitHub Actions

## 🚀 Quick Start

Your FeedPulse application now has automated CI/CD! Here's what happens:

1. **Push code to GitHub** → GitHub Actions automatically builds Docker images
2. **Images pushed to GHCR** → Stored in GitHub Container Registry
3. **Deploy in Dokploy** → Pull pre-built images (fast deployment!)

---

## 📦 What Was Set Up

### 1. GitHub Actions Workflow

**File:** `.github/workflows/build-and-push.yml`

Automatically:
- ✅ Builds backend and frontend Docker images
- ✅ Pushes to GitHub Container Registry (GHCR)
- ✅ Creates multiple tags (latest, branch name, SHA, versions)
- ✅ Supports multi-platform (amd64/arm64)
- ✅ Caches layers for faster builds

### 2. Updated Docker Compose

**File:** `docker-compose.prod.yml`

Now uses pre-built images instead of building locally:
```yaml
backend:
  image: ghcr.io/${GITHUB_REPOSITORY}/backend:${IMAGE_TAG:-latest}

frontend:
  image: ghcr.io/${GITHUB_REPOSITORY}/frontend:${IMAGE_TAG:-latest}
```

---

## ⚡ First Time Setup

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add GitHub Actions CI/CD"
git push origin main
```

### Step 2: Wait for Build

1. Go to your GitHub repo → **Actions** tab
2. Watch the "Build and Push Docker Images" workflow
3. Wait ~5-10 minutes for first build
4. Subsequent builds: ~2-5 minutes (cached)

### Step 3: Configure Package Visibility

After first build:
1. Go to GitHub repo → **Packages** (right sidebar)
2. Click on `backend` and `frontend` packages
3. **Package settings** → Change visibility:
   - **Public** (easier, no auth needed)
   - **Private** (requires Docker login)

### Step 4: Deploy in Dokploy

Add these environment variables in Dokploy:

```env
GITHUB_REPOSITORY=yourusername/feedpulse
IMAGE_TAG=latest
```

Then click **Deploy**!

---

## 🏷️ How Tagging Works

### Push to `main`

```bash
git push origin main
```

**Creates tags:**
- `latest`
- `main`
- `main-abc1234` (SHA)

### Create Version Release

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

**Creates tags:**
- `1.0.0`
- `1.0`
- `1`
- `latest`

### Deploy Specific Version

In Dokploy, update:
```env
IMAGE_TAG=1.0.0
```

---

## 🔄 Typical Workflow

### Development

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main
```

**GitHub Actions:**
- Builds images automatically
- Pushes to GHCR with `latest` tag

**Dokploy:**
- Click "Deploy"
- Pulls latest image
- Updates in ~1-2 minutes ⚡

### Production Release

```bash
# Test in staging first
# Then create version tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

**In Dokploy:**
```env
IMAGE_TAG=1.2.3
```

**Deploy** → Production runs version 1.2.3

---

## 🔐 Authentication (for Private Images)

If your packages are private:

```bash
# Create GitHub Personal Access Token (PAT)
# GitHub → Settings → Developer settings → Personal access tokens
# Scope: read:packages

# In Dokploy terminal/SSH
docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_PAT
```

---

## ↩️ Quick Rollback

Need to rollback?

1. **In Dokploy**, update environment variable:
   ```env
   IMAGE_TAG=1.2.2  # Previous version
   ```

2. **Redeploy** → Back to working version in minutes!

---

## 📊 Benefits vs Building Locally

| Aspect | Before (Local Build) | After (Pre-built Images) |
|--------|---------------------|--------------------------|
| **Deployment Speed** | 10-15 minutes | 1-2 minutes ⚡ |
| **Build Location** | Dokploy server | GitHub Actions |
| **Consistency** | May vary | Guaranteed same |
| **Rollback** | Difficult | Easy (change tag) |
| **Versioning** | Manual | Automatic |
| **Multi-platform** | Single | amd64 + arm64 |

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `README-CICD.md` | This file - quick reference |
| `GITHUB-ACTIONS-SETUP.md` | Complete CI/CD guide |
| `VERSIONING-STRATEGY.md` | Version management guide |
| `DOKPLOY-QUICKSTART.md` | Deployment quick start |
| `DOKPLOY-DEPLOYMENT.md` | Full deployment guide |

---

## 🎯 Environment Variable Reference

### Required in Dokploy

```env
# Your GitHub repo (format: username/reponame)
GITHUB_REPOSITORY=yourusername/feedpulse

# Image tag to deploy (default: latest)
IMAGE_TAG=latest

# Plus all your existing variables
DOMAIN=your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
POSTGRES_PASSWORD=...
JWT_SECRET=...
# etc.
```

---

## 🔍 Monitoring Builds

### View Build Status

**GitHub:**
- Repo → **Actions** tab
- See all builds and their status

**Badge in README:**
```markdown
![Build](https://github.com/yourusername/feedpulse/actions/workflows/build-and-push.yml/badge.svg)
```

### View Available Images

```bash
# List all tags
docker run --rm gcr.io/go-containerregistry/crane ls ghcr.io/yourusername/feedpulse/backend
```

---

## 🛠️ Manual Workflow Trigger

Need to rebuild without pushing code?

1. GitHub repo → **Actions**
2. Select "Build and Push Docker Images"
3. Click **"Run workflow"**
4. Select branch
5. Click **"Run workflow"**

---

## 🐛 Troubleshooting

### Build Failing

**Check:**
1. GitHub Actions logs
2. Dockerfile syntax
3. Dependencies in package.json

### Can't Pull Image

**Solutions:**
1. Check package is Public (or you're logged in)
2. Verify `GITHUB_REPOSITORY` is correct
3. Check image tag exists

### Old Image Deployed

**Solutions:**
1. Update `IMAGE_TAG` variable
2. Or add to docker-compose:
   ```yaml
   pull_policy: always
   ```

---

## ✅ Quick Commands

```bash
# Generate secrets
./scripts/generate-secrets.sh

# Push and trigger build
git push origin main

# Create version release
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# List available image tags
docker run --rm gcr.io/go-containerregistry/crane ls \
  ghcr.io/yourusername/feedpulse/backend

# Pull specific version
docker pull ghcr.io/yourusername/feedpulse/backend:1.0.0
```

---

## 🎉 You're Done!

Your CI/CD pipeline is ready! Just push code and let GitHub Actions handle the rest.

**Next Steps:**
1. Push your first change
2. Watch it build in GitHub Actions
3. Deploy in Dokploy
4. Enjoy fast deployments! 🚀

---

**Questions?** Check the detailed guides:
- `GITHUB-ACTIONS-SETUP.md` - Complete CI/CD documentation
- `VERSIONING-STRATEGY.md` - Version management
- `DOKPLOY-DEPLOYMENT.md` - Deployment details

