# 🚀 Quick Start Guide

## Prerequisites

- ✅ Node.js 18+ ([Download](https://nodejs.org))
- ✅ MySQL 8.0+ ([Download](https://dev.mysql.com/downloads/mysql/))
- ✅ AWS S3 Account (for resume uploads)

---

## Installation (5 Minutes)

### Step 1: Extract & Navigate
```bash
unzip rexjobs-nodejs.zip
cd rexjobs-nodejs
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

**Required Settings in .env:**
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rexjobs

# Session (CHANGE THIS!)
SESSION_SECRET=your-super-secret-random-string-here
```

### Step 4: Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE rexjobs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 5: Run Migrations
```bash
npm run migrate:latest
```

This creates all 30 tables automatically!

### Step 6: Start Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

### Step 7: Visit Application
Open browser: **http://localhost:3000**

---

## Default Login (Create First User)

1. Click "Sign Up"
2. Create an account
3. Check database for user:
```sql
SELECT * FROM tbluser LIMIT 1;
```

4. Make yourself admin:
```sql
UPDATE tbluser 
SET isadmin = 1, issuperadmin = 1 
WHERE userid = 1;
```

5. Login with your credentials

---

## Quick Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run all migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# View migration status
npx knex migrate:status
```

---

## Project Structure

```
rexjobs-nodejs/
├── config/              # Configuration files
├── controllers/         # Route controllers
├── database/
│   └── migrations/      # 6 migration files (30 tables)
├── middleware/          # Auth, validation
├── routes/              # Express routes
├── views/               # EJS templates
├── public/              # Static files (CSS, JS, images)
├── server.js            # Main app file
├── knexfile.js          # Database config
└── .env                 # Your configuration
```

---

## Testing

### Test Homepage
```
Visit: http://localhost:3000
```

### Test Login
```
Visit: http://localhost:3000/account/login
```

### Test Dashboard
```
Login first, then: http://localhost:3000/dashboard
```

---

## AWS S3 Setup (Optional)

For resume uploads to work:

1. Create S3 bucket: `quikjob` (or your choice)
2. Set bucket region: `eu-north-1` (or your choice)
3. Add to `.env`:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=quikjob
```

**Without S3:** Application works, but resume upload will fail.

---

## Email Setup (Optional)

For emails (password reset, etc.):

```env
SMTP_HOST=mail.rexjobs.in
SMTP_PORT=587
SMTP_USER=info@rexjobs.in
SMTP_PASSWORD=your_password
SMTP_FROM=info@rexjobs.in
```

**Without Email:** Application works, but password reset won't send emails.

---

## Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -h localhost
```

### Migration Errors
```bash
# Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# Check .env has correct credentials
cat .env | grep DB_
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001

# Or kill process on port 3000
lsof -ti:3000 | xargs kill
```

### Cannot find module
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start server.js --name rexjobs

# Auto-start on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Environment Variables
```bash
# Set production mode
NODE_ENV=production

# Change session secret (IMPORTANT!)
SESSION_SECRET=super-random-string-change-this
```

---

## Features Included

✅ Homepage with job listings  
✅ Career/Browse jobs page  
✅ Job details page  
✅ Job application with resume upload  
✅ User authentication (login/signup)  
✅ Admin dashboard  
✅ Newsletter subscription  
✅ Visitor tracking  
✅ All 30 database tables  
✅ AWS S3 integration  
✅ Session management  
✅ Error logging  
✅ Activity logging  

---

## Support

- **Documentation**: See README.md
- **Issues**: Check error logs in ErrorLog table
- **Help**: Create an issue on GitHub

---

## Next Steps

1. **Customize Views** - Edit EJS templates in `views/`
2. **Add Features** - Create new controllers/routes
3. **Style Update** - Modify `public/css/style.css`
4. **Add Email Service** - Implement nodemailer
5. **Deploy** - Use PM2 + Nginx

---

**That's it! You're ready to go! 🎉**

Visit http://localhost:3000 to see your job portal in action!
