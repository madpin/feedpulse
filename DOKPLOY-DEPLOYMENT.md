# Deploying FeedPulse to Dokploy

This guide walks you through deploying FeedPulse (backend + frontend) to Dokploy.

## Prerequisites

1. Dokploy instance set up and running
2. Domain name configured (e.g., `feedpulse.yourdomain.com`)
3. GitHub/GitLab repository connected to Dokploy
4. SSL/TLS certificates (Dokploy handles this automatically with Let's Encrypt)

## Deployment Options

### Option 1: Docker Compose Deployment (Recommended)

This is the simplest approach as Dokploy has native support for Docker Compose.

#### Steps:

1. **Create a New Application in Dokploy**
   - Log into your Dokploy dashboard
   - Click "Create Application"
   - Select "Docker Compose"
   - Connect your Git repository

2. **Configure the Application**
   - **Repository:** Your Git repo URL
   - **Branch:** `main` or your production branch
   - **Docker Compose File:** `docker-compose.prod.yml`
   - **Build Path:** `/` (root of your repo)

3. **Set Environment Variables**
   
   In Dokploy's environment variables section, add:

   ```env
   # Domain Configuration
   DOMAIN=feedpulse.yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.feedpulse.yourdomain.com
   
   # Database Configuration
   POSTGRES_USER=feedpulse
   POSTGRES_PASSWORD=<GENERATE-SECURE-PASSWORD>
   POSTGRES_DB=feedpulse
   
   # JWT Configuration
   JWT_SECRET=<GENERATE-SECURE-SECRET-32-CHARS>
   JWT_REFRESH_SECRET=<GENERATE-SECURE-SECRET-32-CHARS>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   
   # OpenAI Configuration
   OPENAI_API_KEY=<YOUR-OPENAI-API-KEY>
   OPENAI_BASE_URL=https://api.openai.com/v1
   LLM_MODEL=gpt-4o-mini
   EMBEDDING_MODEL=text-embedding-3-small
   
   # Feed Processing Configuration
   FEED_UPDATE_INTERVAL_HOURS=1
   USE_READABILITY_DEFAULT=true
   MAX_CONCURRENT_FEED_UPDATES=5
   
   # CORS Configuration
   CORS_ORIGIN=https://feedpulse.yourdomain.com
   
   # Logging
   LOG_LEVEL=info
   ```

4. **Configure Domains**
   
   In Dokploy, set up two domains:
   - **Frontend:** `feedpulse.yourdomain.com` → port 3737
   - **Backend API:** `api.feedpulse.yourdomain.com` → port 3838

5. **Deploy**
   - Click "Deploy" in Dokploy
   - Wait for the build and deployment to complete
   - Monitor logs for any issues

6. **Run Database Migrations**
   
   After first deployment, you need to run migrations:
   
   ```bash
   # SSH into your Dokploy server or use Dokploy's terminal
   docker exec -it feedpulse-backend npm run db:migrate
   ```

   Optional: Seed the database with initial data:
   ```bash
   docker exec -it feedpulse-backend npm run db:seed
   ```

---

### Option 2: Separate Services Deployment

If you prefer to deploy backend and frontend as separate applications in Dokploy:

#### Backend Service:

1. **Create Backend Application**
   - Type: Docker
   - Dockerfile: `backend/Dockerfile`
   - Port: 3838

2. **Backend Environment Variables**
   ```env
   DATABASE_URL=postgresql://feedpulse:<PASSWORD>@postgres:5432/feedpulse
   REDIS_URL=redis://redis:6379
   BACKEND_PORT=3838
   BACKEND_HOST=0.0.0.0
   NODE_ENV=production
   JWT_SECRET=<SECRET>
   JWT_REFRESH_SECRET=<SECRET>
   OPENAI_API_KEY=<KEY>
   CORS_ORIGIN=https://feedpulse.yourdomain.com
   ```

3. **Create PostgreSQL Database**
   - In Dokploy, create a PostgreSQL service (with pgvector support)
   - Or use the managed database option if available

4. **Create Redis Instance**
   - In Dokploy, create a Redis service
   - Note the connection URL

#### Frontend Service:

1. **Create Frontend Application**
   - Type: Docker
   - Dockerfile: `frontend/Dockerfile`
   - Port: 3737

2. **Frontend Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=https://api.feedpulse.yourdomain.com
   PORT=3737
   NODE_ENV=production
   ```

3. **Build Arguments** (if needed)
   - Add `NEXT_PUBLIC_API_URL` as a build argument

---

## Post-Deployment Steps

### 1. Verify Health Checks

Check that services are healthy:
```bash
curl https://api.feedpulse.yourdomain.com/health
```

### 2. Monitor Logs

In Dokploy dashboard:
- Check backend logs for any errors
- Check frontend logs
- Monitor PostgreSQL and Redis

### 3. Set Up Monitoring (Optional)

Configure alerts in Dokploy for:
- Service downtime
- High memory/CPU usage
- Database connection issues

### 4. Configure Backups

**Database Backups:**
```bash
# Create a backup script in Dokploy
docker exec feedpulse-db pg_dump -U feedpulse feedpulse > backup_$(date +%Y%m%d).sql
```

Set up automated backups in Dokploy or use cron jobs.

---

## Troubleshooting

### Issue: Frontend can't connect to backend

**Solution:** Check CORS_ORIGIN and NEXT_PUBLIC_API_URL match your domain

### Issue: Database connection fails

**Solution:** 
- Verify DATABASE_URL is correct
- Check that PostgreSQL service is running
- Ensure network connectivity between services

### Issue: Build fails

**Solution:**
- Check Dockerfile paths
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Issue: 502 Bad Gateway

**Solution:**
- Check if backend is running: `docker ps`
- Verify port configuration matches
- Check backend logs

---

## Scaling Considerations

### Horizontal Scaling

For production, consider:
1. **Multiple backend instances** behind a load balancer
2. **CDN** for frontend static assets
3. **Managed PostgreSQL** with read replicas
4. **Redis Cluster** for high availability

### Performance Optimization

1. **Enable caching** in your backend routes
2. **Database indexing** for frequently queried fields
3. **Connection pooling** for PostgreSQL
4. **Rate limiting** (already configured in your backend)

---

## Security Checklist

- [ ] Use strong passwords for POSTGRES_PASSWORD
- [ ] Generate secure random strings for JWT secrets (minimum 32 characters)
- [ ] Enable SSL/TLS for all domains (Dokploy does this automatically)
- [ ] Set appropriate CORS_ORIGIN (not wildcard `*`)
- [ ] Regularly update dependencies
- [ ] Set up automated backups
- [ ] Monitor logs for suspicious activity
- [ ] Use environment variables for all secrets (never commit)

---

## Useful Commands

### View running containers
```bash
docker ps
```

### View backend logs
```bash
docker logs -f feedpulse-backend
```

### View frontend logs
```bash
docker logs -f feedpulse-frontend
```

### Restart a service
```bash
docker restart feedpulse-backend
```

### Access database shell
```bash
docker exec -it feedpulse-db psql -U feedpulse -d feedpulse
```

### Run migrations manually
```bash
docker exec -it feedpulse-backend npm run db:migrate
```

---

## CI/CD Setup

### Automatic Deployments

Dokploy can automatically deploy on git push:

1. In Dokploy, enable "Auto Deploy" for your application
2. Set the branch to monitor (e.g., `main`)
3. Optionally add a webhook from GitHub/GitLab

### Deployment Workflow

1. Push changes to your repository
2. Dokploy detects the change
3. Pulls latest code
4. Builds Docker images
5. Runs health checks
6. Switches to new version with zero downtime

---

## Support & Resources

- [Dokploy Documentation](https://docs.dokploy.com)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- Check your application logs in Dokploy dashboard

