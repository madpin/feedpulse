# GitHub Actions CI/CD Setup

## Overview

Your FeedPulse application now uses GitHub Actions to automatically build and push Docker images to GitHub Container Registry (GHCR). This provides:

- ✅ Faster deployments (pre-built images)
- ✅ Consistent builds across environments
- ✅ Version tagging and rollback capability
- ✅ Multi-platform support (amd64/arm64)
- ✅ Build caching for faster CI runs

---

## 🔧 Initial Setup

### 1. Enable GitHub Container Registry

GHCR is enabled by default on GitHub, but you need to configure package visibility:

1. After your first push, GitHub Actions will build and push images
2. Go to your GitHub repository
3. Click on **"Packages"** in the right sidebar
4. You'll see `backend` and `frontend` packages
5. Click on each package → **"Package settings"**
6. Under **"Danger Zone"**, change visibility to **Public** (or keep Private if preferred)

### 2. Configure Repository Secrets (Optional)

If you want to pass build-time variables, add these secrets:

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Add any optional secrets:
   - `NEXT_PUBLIC_API_URL` - Your production API URL (optional)

---

## 📦 How It Works

### Automatic Builds

The workflow (`.github/workflows/build-and-push.yml`) automatically triggers on:

1. **Push to `main` branch** → Builds and tags as `latest`
2. **Push to `develop` branch** → Builds and tags as `develop`
3. **Pull Request** → Builds but doesn't push (validation only)
4. **Git Tags** (e.g., `v1.0.0`) → Builds and tags as version
5. **Manual trigger** → Via GitHub Actions UI

### Image Tagging Strategy

For each build, multiple tags are created:

| Trigger | Tags Created |
|---------|--------------|
| Push to `main` | `latest`, `main`, `main-<sha>` |
| Push to `develop` | `develop`, `develop-<sha>` |
| Tag `v1.2.3` | `1.2.3`, `1.2`, `latest` |
| Pull Request #42 | `pr-42` |

**Examples:**
```
ghcr.io/yourusername/feedpulse/backend:latest
ghcr.io/yourusername/feedpulse/backend:main
ghcr.io/yourusername/feedpulse/backend:main-abc1234
ghcr.io/yourusername/feedpulse/backend:1.2.3
ghcr.io/yourusername/feedpulse/frontend:latest
```

---

## 🚀 Using Pre-Built Images in Dokploy

### Update Your Environment Variables

In Dokploy, add these environment variables:

```env
# Required: Your GitHub repository in format username/repo
GITHUB_REPOSITORY=yourusername/feedpulse

# Optional: Specific version to deploy (default: latest)
IMAGE_TAG=latest

# Or use a specific version
# IMAGE_TAG=1.2.3
# IMAGE_TAG=main-abc1234
```

### Authentication for Private Images

If your GHCR packages are private:

1. Create a GitHub Personal Access Token (PAT):
   - Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Click **"Generate new token (classic)"**
   - Give it a name: `Dokploy GHCR Access`
   - Select scope: `read:packages`
   - Generate and copy the token

2. In Dokploy, before deploying:
   ```bash
   # SSH into Dokploy server or use Dokploy terminal
   docker login ghcr.io -u YOUR_GITHUB_USERNAME -p YOUR_PAT_TOKEN
   ```

3. Or add to docker-compose (not recommended for production):
   ```yaml
   # Add to each service that uses GHCR images
   services:
     backend:
       image: ghcr.io/${GITHUB_REPOSITORY}/backend:${IMAGE_TAG:-latest}
       pull_policy: always
   ```

---

## 🔄 Deployment Workflow

### Standard Deployment

1. **Make changes** to your code
2. **Commit and push** to `main` branch:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

3. **GitHub Actions automatically**:
   - Builds backend Docker image
   - Builds frontend Docker image
   - Pushes to GHCR with tags

4. **In Dokploy**:
   - Click "Deploy" or enable auto-deploy
   - Dokploy pulls latest images
   - Restarts services with new images

### Version-Tagged Deployment

For production releases with version control:

1. **Tag your release**:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **GitHub Actions builds** and tags as `1.0.0` and `latest`

3. **In Dokploy**, set environment variable:
   ```env
   IMAGE_TAG=1.0.0
   ```

4. **Deploy** in Dokploy

---

## 📋 Workflow Features

### Multi-Platform Builds

Images are built for both:
- `linux/amd64` (Intel/AMD processors)
- `linux/arm64` (ARM processors, Apple Silicon)

### Build Caching

GitHub Actions caches layers between builds for speed:
- First build: ~5-10 minutes
- Subsequent builds: ~2-5 minutes (with cache)

### Parallel Builds

Backend and frontend build simultaneously for faster CI/CD.

---

## 🔍 Monitoring Builds

### View Build Status

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. See all workflow runs
4. Click on any run to see detailed logs

### Build Badges

Add to your README.md:

```markdown
![Build Status](https://github.com/yourusername/feedpulse/actions/workflows/build-and-push.yml/badge.svg)
```

---

## 🛠️ Advanced Usage

### Manual Workflow Trigger

Trigger a build manually without pushing code:

1. Go to repository → **Actions**
2. Select **"Build and Push Docker Images"**
3. Click **"Run workflow"**
4. Select branch
5. Click **"Run workflow"**

### Building Specific Branches

Want to build a feature branch?

1. Update workflow to include your branch:
   ```yaml
   on:
     push:
       branches:
         - main
         - develop
         - feature/my-feature  # Add your branch
   ```

2. Push to that branch
3. Images will be tagged as `feature-my-feature`

### Custom Build Args

To pass build-time variables to Docker:

1. Add secret in GitHub:
   - Repository → Settings → Secrets → New secret

2. Update workflow:
   ```yaml
   - name: Build and push Backend Docker image
     uses: docker/build-push-action@v5
     with:
       build-args: |
         MY_BUILD_ARG=${{ secrets.MY_BUILD_ARG }}
   ```

---

## 🔐 Security Best Practices

1. **Package Visibility**
   - Use Private packages for production
   - Use Public packages for open-source projects

2. **Access Tokens**
   - Use fine-grained PATs with minimum permissions
   - Rotate tokens regularly
   - Never commit tokens to repository

3. **Image Scanning**
   - GitHub automatically scans images for vulnerabilities
   - Check **"Security"** tab in your repository

4. **Secrets Management**
   - Use GitHub Secrets for sensitive data
   - Never hardcode secrets in workflows

---

## 🧪 Testing Workflow Locally

Test workflow before pushing:

```bash
# Install act (GitHub Actions runner)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act push
```

---

## 📊 Rollback Strategy

### Rollback to Previous Version

1. **Identify version** to rollback to:
   ```bash
   # View available tags
   docker run --rm gcr.io/go-containerregistry/crane ls ghcr.io/yourusername/feedpulse/backend
   ```

2. **Update IMAGE_TAG** in Dokploy:
   ```env
   IMAGE_TAG=1.0.0  # Previous working version
   ```

3. **Redeploy** in Dokploy

### Emergency Rollback

If latest build is broken:

```bash
# In Dokploy terminal
docker service update --image ghcr.io/yourusername/feedpulse/backend:1.0.0 feedpulse-backend
docker service update --image ghcr.io/yourusername/feedpulse/frontend:1.0.0 feedpulse-frontend
```

---

## 📈 Optimization Tips

1. **Layer Caching**
   - Order Dockerfile commands from least to most frequently changed
   - Already optimized in your Dockerfiles

2. **Multi-Stage Builds**
   - Already implemented (builder + runner stages)
   - Reduces final image size

3. **Build Matrix**
   - If you need to test multiple Node versions:
   ```yaml
   strategy:
     matrix:
       node-version: [18, 20]
   ```

---

## 🐛 Troubleshooting

### Build Fails with "Permission Denied"

**Solution:** Check that `GITHUB_TOKEN` has `packages: write` permission (should be automatic)

### Can't Pull Image in Dokploy

**Solution:**
1. Check package visibility (Public vs Private)
2. If Private, ensure you're logged in: `docker login ghcr.io`
3. Verify `GITHUB_REPOSITORY` environment variable is correct

### Old Image Keeps Running

**Solution:** 
1. Set `pull_policy: always` in docker-compose
2. Or manually pull: `docker pull ghcr.io/yourusername/feedpulse/backend:latest`

### Build is Slow

**Solution:**
1. GitHub Actions cache might be cold
2. Subsequent builds will be faster
3. Consider self-hosted runners for very large builds

---

## 📚 Resources

- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## ✅ Checklist

- [ ] Workflow file committed to `.github/workflows/`
- [ ] First successful build completed
- [ ] Package visibility configured
- [ ] `GITHUB_REPOSITORY` set in Dokploy
- [ ] Images pulling successfully in Dokploy
- [ ] Deployment tested with latest images
- [ ] Rollback strategy documented
- [ ] Team members know how to trigger builds

---

**You're all set!** Every push to `main` will now automatically build and publish your Docker images. 🚀

