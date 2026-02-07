# 🎯 START HERE - RexJobs Node.js

## Welcome! 👋

You have successfully downloaded the complete RexJobs Node.js job portal!

---

## ⚡ Quick Start (Copy & Paste)

Open your terminal and run these commands:

```bash
# Step 1: Extract (if not already done)
unzip rexjobs-nodejs.zip
cd rexjobs-nodejs

# Step 2: Install dependencies
npm install

# Step 3: Configure
cp .env.example .env

# Edit .env file - AT MINIMUM set these:
# DB_HOST=localhost
# DB_USER=root  
# DB_PASSWORD=your_mysql_password
# DB_NAME=rexjobs
# SESSION_SECRET=change-this-to-something-random

# Step 4: Create database
mysql -u root -p -e "CREATE DATABASE rexjobs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Step 5: Run migrations (creates all 30 tables)
npm run migrate:latest

# Step 6: Start server
npm run dev

# Step 7: Open browser
# Visit: http://localhost:3000
```

---

## 📖 Documentation Files

Read these in order:

1. **START_HERE.md** ← You are here!
2. **QUICKSTART.md** - 5-minute setup guide
3. **INSTALLATION_CHECKLIST.md** - Complete checklist
4. **README.md** - Full documentation
5. **PACKAGE_SUMMARY.md** - What's included

---

## 🎯 What to Do First

### 1. Install Node.js (if not installed)
- Download: https://nodejs.org
- Version required: 18+
- Check: `node -v`

### 2. Install MySQL (if not installed)
- Download: https://dev.mysql.com/downloads/mysql/
- Version required: 8.0+
- Check: `mysql --version`

### 3. Run the Installation
```bash
npm install
```

### 4. Configure .env
```bash
nano .env
```

Minimum required:
```env
DB_PASSWORD=your_mysql_password
SESSION_SECRET=random-string-here
```

### 5. Create Database & Run Migrations
```bash
mysql -u root -p -e "CREATE DATABASE rexjobs;"
npm run migrate:latest
```

### 6. Start Server
```bash
npm run dev
```

---

## ✅ Verify Installation

Open browser: http://localhost:3000

You should see:
- ✅ Homepage with hero section
- ✅ "Browse Jobs" button
- ✅ Job categories (may be empty)
- ✅ Newsletter form
- ✅ Login/Signup buttons

---

## 🔧 Troubleshooting

### "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Database connection failed"
- Check MySQL is running: `sudo systemctl status mysql`
- Check .env has correct password
- Test connection: `mysql -u root -p`

### "Port 3000 already in use"
```bash
# Change port in .env
PORT=3001
```

### Migrations fail
```bash
# Make sure database exists
mysql -u root -p -e "SHOW DATABASES;"

# Check permissions
mysql -u root -p -e "GRANT ALL ON rexjobs.* TO 'root'@'localhost';"
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `server.js` | Main application |
| `package.json` | Dependencies |
| `.env` | Your configuration |
| `knexfile.js` | Database config |
| `database/migrations/` | Table creation |

---

## 🎨 What Works Now

### ✅ Working Features
- Homepage display
- Job listings (when you add jobs)
- User signup
- User login
- Dashboard (after login)
- Database operations
- Session management

### ⚙️ Needs Configuration
- AWS S3 (for resume uploads)
  - Add AWS credentials to .env
- Email (for password reset)
  - Add SMTP details to .env

---

## 🚀 Next Steps

After getting it running:

1. **Create an account**
   - Click "Sign Up"
   - Fill in details
   
2. **Make yourself admin**
   ```sql
   UPDATE tbluser 
   SET isadmin = 1, issuperadmin = 1 
   WHERE userid = 1;
   ```

3. **Login to dashboard**
   - Login with your account
   - Visit /dashboard

4. **Add sample data**
   - Create jobs (database ready)
   - Test applications
   - Explore features

---

## 📚 Learning Path

If you're new to Node.js:

1. **Understand the structure**
   - Read PACKAGE_SUMMARY.md
   
2. **Explore the code**
   - Start with server.js
   - Look at controllers/
   - Check routes/
   
3. **Modify something small**
   - Change homepage text
   - Update CSS colors
   - Add a new route
   
4. **Build new features**
   - Use existing code as template
   - Follow the patterns

---

## 🆘 Need Help?

1. **Check documentation**
   - README.md
   - INSTALLATION_CHECKLIST.md
   
2. **Check error logs**
   - Terminal output
   - Database ErrorLog table
   
3. **Common issues**
   - See QUICKSTART.md troubleshooting section

---

## 📊 What's Included

- ✅ 45 files
- ✅ 6 migrations = 30 tables
- ✅ 3 controllers (800+ lines)
- ✅ 13 views
- ✅ Authentication system
- ✅ Dashboard
- ✅ AWS S3 integration
- ✅ Complete documentation

---

## 💡 Quick Tips

1. **Always run migrations first**
   ```bash
   npm run migrate:latest
   ```

2. **Use development mode**
   ```bash
   npm run dev  # Auto-reloads on changes
   ```

3. **Check database**
   ```bash
   mysql -u root -p rexjobs -e "SHOW TABLES;"
   ```

4. **View logs**
   ```bash
   # Terminal shows all logs
   # Or check database ErrorLog table
   ```

---

## 🎯 Success Criteria

You're ready when:

- [x] npm install completes
- [x] .env file created
- [x] Database created
- [x] Migrations run (30 tables)
- [x] Server starts without errors
- [x] Homepage loads at localhost:3000
- [x] Can create account
- [x] Can login
- [x] Dashboard loads

---

## 🎉 You're All Set!

**Commands to remember:**
```bash
npm run dev          # Start development server
npm start            # Start production server
npm run migrate:latest   # Run all migrations
npm run migrate:rollback # Undo last migration
```

**Default URL:**
```
http://localhost:3000
```

**Your credentials:**
```
(Create account via signup page)
```

---

## 📞 Resources

- **Node.js Docs:** https://nodejs.org/docs
- **Express Docs:** https://expressjs.com
- **MySQL Docs:** https://dev.mysql.com/doc
- **Knex Docs:** https://knexjs.org

---

**Ready? Let's go! 🚀**

```bash
npm run dev
```

Then visit: **http://localhost:3000**

Enjoy your new job portal! 🎉
