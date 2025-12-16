# FeedPulse Versioning Strategy

## Overview

This document outlines the versioning strategy for FeedPulse Docker images and deployments.

---

## 🏷️ Image Tagging Strategy

### Automatic Tags

GitHub Actions automatically creates multiple tags for each build:

#### 1. Branch-Based Tags

**Main Branch:**
```
ghcr.io/username/feedpulse/backend:main
ghcr.io/username/feedpulse/backend:latest
ghcr.io/username/feedpulse/backend:main-abc1234  # SHA suffix
```

**Develop Branch:**
```
ghcr.io/username/feedpulse/backend:develop
ghcr.io/username/feedpulse/backend:develop-abc1234
```

**Feature Branches:**
```
ghcr.io/username/feedpulse/backend:feature-new-api
```

#### 2. Semantic Version Tags

When you push a git tag:

```bash
git tag v1.2.3
git push origin v1.2.3
```

Creates these image tags:
```
ghcr.io/username/feedpulse/backend:1.2.3     # Full version
ghcr.io/username/feedpulse/backend:1.2       # Minor version
ghcr.io/username/feedpulse/backend:1         # Major version
ghcr.io/username/feedpulse/backend:latest    # Latest release
```

#### 3. Pull Request Tags

For PRs:
```
ghcr.io/username/feedpulse/backend:pr-123
```

---

## 📋 Recommended Workflow

### Development Workflow

```
feature branch → develop → main → tagged release
```

#### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and push
git push origin feature/new-feature
```

**Result:** Builds image tagged as `feature-new-feature` (if workflow configured)

#### 2. Integration Testing

```bash
# Merge to develop
git checkout develop
git merge feature/new-feature
git push origin develop
```

**Result:** Builds image tagged as `develop`

**Dokploy Environment Variable:**
```env
IMAGE_TAG=develop
```

#### 3. Production Release

```bash
# Merge to main
git checkout main
git merge develop
git push origin main
```

**Result:** Builds images tagged as `main` and `latest`

**Dokploy Environment Variable:**
```env
IMAGE_TAG=latest
# or
IMAGE_TAG=main
```

#### 4. Version Release

```bash
# Create and push version tag
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

**Result:** Builds images tagged as `1.2.3`, `1.2`, `1`, and `latest`

**Dokploy Environment Variable:**
```env
IMAGE_TAG=1.2.3
```

---

## 🎯 Environment-Specific Deployments

### Development Environment

```env
GITHUB_REPOSITORY=username/feedpulse
IMAGE_TAG=develop
```

**Use Case:** Testing latest features before production

### Staging Environment

```env
GITHUB_REPOSITORY=username/feedpulse
IMAGE_TAG=main
```

**Use Case:** Pre-production testing with main branch

### Production Environment

```env
GITHUB_REPOSITORY=username/feedpulse
IMAGE_TAG=1.2.3
```

**Use Case:** Stable, versioned releases in production

---

## 📊 Semantic Versioning Guidelines

Follow [Semantic Versioning 2.0.0](https://semver.org/):

### Version Format: MAJOR.MINOR.PATCH

**Example:** `v1.2.3`

#### MAJOR (1.x.x)

Increment for breaking changes:
- Database schema changes requiring migrations
- API endpoint removals or changes
- Major feature overhauls
- Breaking configuration changes

**Example:**
```bash
# v1.5.2 → v2.0.0
git tag -a v2.0.0 -m "Breaking: New authentication system"
```

#### MINOR (x.2.x)

Increment for new features (backwards compatible):
- New API endpoints
- New features
- Significant improvements
- Non-breaking enhancements

**Example:**
```bash
# v1.5.2 → v1.6.0
git tag -a v1.6.0 -m "feat: Add feed analytics dashboard"
```

#### PATCH (x.x.3)

Increment for bug fixes and minor changes:
- Bug fixes
- Security patches
- Performance improvements
- Documentation updates

**Example:**
```bash
# v1.5.2 → v1.5.3
git tag -a v1.5.3 -m "fix: Resolve RSS parsing error"
```

---

## 🔄 Deployment Strategies

### Strategy 1: Latest (Simple)

**Best for:** Small teams, rapid development

```env
IMAGE_TAG=latest
```

**Pros:**
- Always running latest code
- Simple to manage
- Auto-updates on deploy

**Cons:**
- Less control over versions
- Harder to rollback
- Can deploy untested code

### Strategy 2: Semantic Versions (Recommended)

**Best for:** Production, teams, stable deployments

```env
IMAGE_TAG=1.2.3
```

**Pros:**
- Full control over deployed version
- Easy rollbacks
- Clear versioning history
- Predictable deployments

**Cons:**
- Requires manual version updates
- More deployment steps

### Strategy 3: Git SHA Tags

**Best for:** Advanced debugging, specific commits

```env
IMAGE_TAG=main-abc1234
```

**Pros:**
- Deploy exact commit
- Perfect for debugging
- Traceable to code

**Cons:**
- Complex tag management
- Not human-readable

---

## 📝 Version Release Checklist

Before releasing a new version:

- [ ] All tests passing
- [ ] Code reviewed and merged to `main`
- [ ] CHANGELOG.md updated
- [ ] Database migrations tested
- [ ] Staging environment tested
- [ ] Documentation updated
- [ ] Version number decided (MAJOR.MINOR.PATCH)

**Release Process:**

```bash
# 1. Ensure you're on main and up to date
git checkout main
git pull origin main

# 2. Create annotated tag
git tag -a v1.2.3 -m "Release v1.2.3: Description of changes"

# 3. Push tag
git push origin v1.2.3

# 4. Wait for GitHub Actions to build (~5-10 min)
# Check: https://github.com/username/feedpulse/actions

# 5. Update Dokploy environment variable
# In Dokploy: IMAGE_TAG=1.2.3

# 6. Deploy in Dokploy
```

---

## ↩️ Rollback Procedures

### Quick Rollback to Previous Version

**Step 1:** Identify the version to rollback to

```bash
# View available tags
docker run --rm gcr.io/go-containerregistry/crane ls ghcr.io/username/feedpulse/backend | sort -V
```

**Step 2:** Update IMAGE_TAG in Dokploy

```env
IMAGE_TAG=1.2.2  # Previous working version
```

**Step 3:** Redeploy in Dokploy

### Emergency Rollback (Direct Docker)

If Dokploy is having issues:

```bash
# SSH to server
ssh user@your-dokploy-server

# Update backend service
docker service update \
  --image ghcr.io/username/feedpulse/backend:1.2.2 \
  feedpulse-backend

# Update frontend service
docker service update \
  --image ghcr.io/username/feedpulse/frontend:1.2.2 \
  feedpulse-frontend

# Or use docker-compose
cd /path/to/feedpulse
export IMAGE_TAG=1.2.2
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### Database Rollback

If the new version included database migrations:

```bash
# Rollback migrations
docker exec feedpulse-backend npm run db:rollback

# Or manually
docker exec -it feedpulse-db psql -U feedpulse feedpulse
# Run rollback SQL manually
```

---

## 📊 Version History Tracking

### Keep a CHANGELOG

Create `CHANGELOG.md`:

```markdown
# Changelog

## [1.2.3] - 2024-12-16

### Added
- New feed analytics dashboard
- Export feed data to CSV

### Fixed
- RSS parsing error for malformed feeds
- Memory leak in feed worker

### Changed
- Improved feed update performance

## [1.2.2] - 2024-12-10
...
```

### Git Tags List

```bash
# List all version tags
git tag -l "v*"

# Show tag details
git show v1.2.3

# Find commits between versions
git log v1.2.2..v1.2.3 --oneline
```

---

## 🔍 Image Inspection

### View Available Tags

```bash
# Using crane (Google's container tool)
docker run --rm gcr.io/go-containerregistry/crane ls ghcr.io/username/feedpulse/backend

# Using GitHub API
curl -H "Authorization: token YOUR_PAT" \
  https://api.github.com/user/packages/container/feedpulse%2Fbackend/versions
```

### Image Metadata

```bash
# Inspect image
docker inspect ghcr.io/username/feedpulse/backend:1.2.3

# View labels
docker inspect ghcr.io/username/feedpulse/backend:1.2.3 \
  --format='{{json .Config.Labels}}' | jq
```

---

## 🎯 Best Practices

1. **Always use semantic versioning in production**
   - `IMAGE_TAG=1.2.3` not `IMAGE_TAG=latest`

2. **Tag meaningful releases**
   - Every production deployment should have a version tag
   - Use annotated tags with descriptions

3. **Test before tagging**
   - Deploy to staging with `main` tag first
   - Only create version tag after successful testing

4. **Document changes**
   - Update CHANGELOG.md with every release
   - Include migration notes if applicable

5. **Keep version history**
   - Don't delete old image tags
   - Keep at least 10 previous versions for rollbacks

6. **Automate where possible**
   - Use GitHub Actions for builds (already done!)
   - Consider automated changelog generation
   - Set up automated testing before builds

7. **Monitor deployments**
   - Check health endpoints after version updates
   - Monitor logs for errors
   - Have rollback plan ready

---

## 📈 Advanced: Automated Versioning

### Option 1: Conventional Commits + Semantic Release

Install semantic-release to automate versioning:

```bash
npm install --save-dev semantic-release
```

**Benefits:**
- Automatic version bumps based on commit messages
- Auto-generated changelogs
- Automatic git tagging

### Option 2: Version Bump Scripts

Create `scripts/bump-version.sh`:

```bash
#!/bin/bash
# Bump version and create git tag

TYPE=$1  # major, minor, or patch

if [ -z "$TYPE" ]; then
  echo "Usage: ./scripts/bump-version.sh [major|minor|patch]"
  exit 1
fi

# Get current version from package.json
CURRENT=$(jq -r .version package.json)

# Calculate new version
NEW=$(npx semver $CURRENT -i $TYPE)

# Update package.json
jq ".version = \"$NEW\"" package.json > package.json.tmp
mv package.json.tmp package.json

# Commit and tag
git add package.json
git commit -m "chore: bump version to $NEW"
git tag -a "v$NEW" -m "Release v$NEW"

echo "Version bumped to $NEW"
echo "Push with: git push origin main && git push origin v$NEW"
```

---

## 🆘 Troubleshooting

### Wrong Version Deployed

**Solution:** Update `IMAGE_TAG` in Dokploy and redeploy

### Can't Pull Specific Version

**Solution:** Verify tag exists:
```bash
docker pull ghcr.io/username/feedpulse/backend:1.2.3
```

### Version Mismatch Between Services

**Solution:** Always deploy backend and frontend with same version tag

---

## ✅ Quick Reference

| Task | Command |
|------|---------|
| Create version tag | `git tag -a v1.2.3 -m "Release 1.2.3"` |
| Push tag | `git push origin v1.2.3` |
| List tags | `git tag -l "v*"` |
| Delete tag | `git tag -d v1.2.3 && git push origin :refs/tags/v1.2.3` |
| View available images | `crane ls ghcr.io/username/feedpulse/backend` |
| Deploy specific version | Set `IMAGE_TAG=1.2.3` in Dokploy |
| Rollback | Set `IMAGE_TAG=1.2.2` and redeploy |

---

**Remember:** Good versioning practices lead to stable, reliable deployments! 🚀

