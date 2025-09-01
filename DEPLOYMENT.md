# Discord Tracker Pro - Deployment Guide

## 🌐 Making Your Site Accessible to All Internet Users

This guide will help you deploy Discord Tracker Pro so it's accessible to all users on the internet.

## 🚀 Quick Start Options

### Option 1: PM2 Production Deployment (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Deploy to production
npm run deploy:prod
```

### Option 2: Docker Deployment
```bash
# Deploy with Docker Compose
npm run deploy:docker
```

### Option 3: Manual Deployment
```bash
# Install dependencies
npm ci --only=production

# Start production server
NODE_ENV=production node server.js
```

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Discord Application configured
- Domain name (optional but recommended)

## 🔧 Configuration

### 1. Environment Variables
Update `config.env` with your production settings:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DISCORD_CALLBACK_URL=https://yourdomain.com/auth/discord/callback
MONGODB_URI=your_mongodb_connection_string
```

### 2. Discord Application Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to OAuth2 settings
4. Add redirect URI: `https://yourdomain.com/auth/discord/callback`
5. Save changes

## 🌍 Making Your Site Internet Accessible

### Method 1: Cloud Hosting (Recommended)

#### Render.com (Free Tier Available)
1. Connect your GitHub repository
2. Set build command: `npm ci --only=production`
3. Set start command: `npm start`
4. Add environment variables from `config.env`
5. Deploy

#### Heroku
1. Install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set NODE_ENV=production`
4. Deploy: `git push heroku main`

#### Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Method 2: VPS/Server Deployment

#### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start production server
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Using Docker
```bash
# Build and run
docker-compose up --build -d

# Check status
docker-compose ps
```

### Method 3: Local Network Access

#### For Development/Testing
```bash
# Start server on all interfaces
HOST=0.0.0.0 npm start
```

Your site will be accessible at:
- Local: `http://localhost:3000`
- Network: `http://YOUR_LOCAL_IP:3000`

## 🔒 Security Considerations

### 1. HTTPS Setup
- Use Let's Encrypt for free SSL certificates
- Configure nginx as reverse proxy (see `nginx.conf`)
- Set secure cookies in production

### 2. Rate Limiting
- API endpoints: 10 requests/second
- Auth endpoints: 5 requests/minute
- Configured in nginx

### 3. Environment Variables
- Never commit sensitive data to Git
- Use `.env` files for local development
- Use platform environment variables for production

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Check server health
curl http://yourdomain.com/health

# PM2 monitoring
pm2 monit discord-tracker-pro

# View logs
pm2 logs discord-tracker-pro
```

### Performance Monitoring
- Monitor MongoDB connections
- Check API response times
- Monitor external API usage

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

#### 2. MongoDB Connection Issues
- Check connection string
- Verify network access
- Check firewall settings

#### 3. Discord OAuth Errors
- Verify callback URL matches exactly
- Check client ID and secret
- Ensure application is public

#### 4. External API Failures
- Check rate limits
- Verify API endpoints
- Check network connectivity

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development DEBUG=* npm start
```

## 📈 Scaling Considerations

### For High Traffic
1. Use load balancer
2. Implement Redis for session storage
3. Use MongoDB Atlas for database
4. Implement CDN for static assets

### Performance Optimization
1. Enable gzip compression
2. Use PM2 cluster mode
3. Implement caching strategies
4. Monitor and optimize database queries

## 🔄 Updates & Maintenance

### Regular Maintenance
```bash
# Update dependencies
npm update

# Restart services
pm2 restart discord-tracker-pro

# Check for security updates
npm audit
```

### Backup Strategy
1. Database backups (MongoDB)
2. Configuration backups
3. Log rotation
4. Disaster recovery plan

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs discord-tracker-pro`
2. Verify configuration
3. Test endpoints individually
4. Check external service status

## 🎯 Success Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection established
- [ ] Discord OAuth working
- [ ] API endpoints responding
- [ ] Site accessible from internet
- [ ] HTTPS configured (if using domain)
- [ ] Monitoring setup
- [ ] Backup strategy implemented

## 🚀 Next Steps

After successful deployment:
1. Test all functionality
2. Monitor performance
3. Set up alerts
4. Document procedures
5. Plan scaling strategy

---

**Note**: This deployment guide assumes you have basic knowledge of Node.js, MongoDB, and server administration. For production use, consider consulting with a DevOps professional.
