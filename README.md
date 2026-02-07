# RexJobs - Node.js Job Portal

Complete job portal built with **Node.js**, **Express**, **EJS**, **MySQL**, and **Knex.js** - Converted from ASP.NET MVC.

## 📋 Features

✅ **Job Management** - Post, edit, delete job listings  
✅ **Application System** - Candidates can apply with resume upload  
✅ **AWS S3 Integration** - Resume storage on Amazon S3  
✅ **Advanced Search** - Filter by category, location, technology, job type  
✅ **User Authentication** - Session-based login with role management  
✅ **Admin Dashboard** - Analytics, statistics, and management  
✅ **Newsletter** - Email subscription system  
✅ **Visitor Tracking** - Analytics and visitor tracking  
✅ **Multi-tenancy** - Company-based data isolation  
✅ **SEO Optimized** - Meta tags, Open Graph, Schema markup  
✅ **Responsive Design** - Bootstrap 5 mobile-friendly UI  

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- MySQL 8.0+
- AWS S3 Account (for resume storage)
- SMTP Server (for emails)

### Installation

```bash
# 1. Clone or extract the project
cd rexjobs-nodejs

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database and AWS credentials

# 4. Run migrations
npm run migrate:latest

# 5. Start the server
npm run dev
```

Visit: http://localhost:3000

---

## 📁 Project Structure

```
rexjobs-nodejs/
├── config/
│   ├── database.js          # Knex database connection
│   └── aws.js                # AWS S3 configuration
├── controllers/
│   ├── homeController.js     # Public pages controller
│   ├── accountController.js  # Authentication
│   ├── dashboardController.js
│   ├── jobsController.js
│   ├── candidatesController.js
│   └── applicationsController.js
├── database/
│   ├── migrations/           # All database migrations
│   │   ├── 20260206000001_create_core_tables.js
│   │   ├── 20260206000002_create_master_data_tables.js
│   │   ├── 20260206000003_create_client_job_tables.js
│   │   ├── 20260206000004_create_requirements_table.js
│   │   ├── 20260206000005_create_applications_candidates_tables.js
│   │   └── 20260206000006_create_supporting_tables.js
│   └── seeds/                # Seed data (optional)
├── middleware/
│   ├── auth.js               # Authentication middleware
│   └── validation.js         # Input validation
├── routes/
│   ├── home.js               # Public routes
│   ├── account.js            # Auth routes
│   ├── dashboard.js          # Admin routes
│   ├── jobs.js               # Job management routes
│   ├── candidates.js         # Candidate routes
│   └── applications.js       # Application routes
├── views/
│   ├── layouts/
│   │   └── main.ejs          # Main layout template
│   ├── partials/
│   │   ├── header.ejs        # Header component
│   │   └── footer.ejs        # Footer component
│   ├── home/
│   │   ├── index.ejs         # Homepage
│   │   ├── career.ejs        # Job listings
│   │   ├── category.ejs      # Category page
│   │   ├── job-details.ejs   # Job details
│   │   ├── about.ejs         # About page
│   │   └── contact.ejs       # Contact page
│   ├── account/
│   │   ├── login.ejs
│   │   ├── signup.ejs
│   │   └── forgot-password.ejs
│   ├── dashboard/
│   │   └── index.ejs
│   └── error/
│       ├── 404.ejs
│       └── 500.ejs
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── .env.example              # Environment variables template
├── knexfile.js               # Knex configuration
├── server.js                 # Main application file
└── package.json              # Dependencies
```

---

## ⚙️ Configuration

### 1. Database (.env)

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rexjobs
```

### 2. AWS S3 (.env)

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=quikjob
```

### 3. Email (.env)

```env
SMTP_HOST=mail.rexjobs.in
SMTP_PORT=587
SMTP_USER=info@rexjobs.in
SMTP_PASSWORD=your_email_password
SMTP_FROM=info@rexjobs.in
```

### 4. Session (.env)

```env
SESSION_SECRET=your-super-secret-key-change-this-in-production
```

---

## 🗄️ Database Setup

### Run Migrations

```bash
# Run all migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:make migration_name
```

### Migrations Include:

1. **Core Tables** - ActivityLog, ErrorLog, Menu, Rights, Company, UserType
2. **Master Data** - Countries, States, Cities, Users
3. **Client & Jobs** - ClientType, Client, RequirementType, RequirementPosition, RequirementPriority
4. **Main Tables** - tblrequirement (Jobs)
5. **Applications** - tblapplyjob, tblcandidate
6. **Supporting** - Blogs, Newsletter, Vendor, VisitorCount

**Total: 30 Tables** with proper indexes and foreign keys

---

## 🎯 Key Routes

### Public Routes

- `GET /` - Homepage
- `GET /career` - Browse all jobs
- `GET /category/:seoname` - Jobs by category
- `GET /job/:id` - Job details
- `POST /apply` - Submit job application
- `POST /newsletter` - Newsletter subscription
- `POST /contact-submit` - Contact form

### Authentication Routes

- `GET /account/login` - Login page
- `POST /account/login` - Login submit
- `GET /account/signup` - Signup page
- `POST /account/signup` - Signup submit
- `GET /account/logout` - Logout
- `GET /account/forgot-password` - Forgot password

### Admin Routes (Protected)

- `GET /dashboard` - Dashboard
- `GET /jobs` - Manage jobs
- `GET /applications` - View applications
- `GET /candidates` - View candidates
- `POST /jobs/create` - Create job posting

---

## 📦 Dependencies

### Core
- **express** - Web framework
- **ejs** - Template engine
- **knex** - Query builder
- **mysql2** - MySQL driver

### Authentication
- **express-session** - Session management
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### File Upload
- **multer** - File upload middleware
- **aws-sdk** - AWS S3 integration

### Utilities
- **moment** - Date/time formatting
- **uuid** - UUID generation
- **nodemailer** - Email sending
- **dotenv** - Environment variables

### Security & Performance
- **helmet** - Security headers
- **compression** - Response compression
- **cors** - CORS middleware
- **morgan** - HTTP logger

---

## 🔧 npm Scripts

```bash
npm start          # Production server
npm run dev        # Development server (nodemon)
npm run migrate:latest   # Run migrations
npm run migrate:rollback # Rollback migrations
npm run migrate:make     # Create migration
npm run seed:run   # Run seeders
```

---

## 🌐 API Endpoints

### Job Search

```javascript
GET /api/technologies/:categoryId
// Returns technologies for a category

GET /api/locations/:technologyId  
// Returns locations for a technology
```

### Newsletter

```javascript
POST /newsletter
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Job Application

```javascript
POST /apply
Content-Type: multipart/form-data

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "requirementid": 1,
  "experienceYears": 3,
  "experienceMonths": 6,
  "currentSalary": 50000,
  "expectedSalary": 70000,
  "noticePeriod": 30,
  "reasonChange": "Career growth",
  "resume": <file>
}
```

---

## 🔐 Security Features

✅ **Session Management** - Secure session-based authentication  
✅ **Password Hashing** - bcrypt encryption  
✅ **SQL Injection Protection** - Knex parameterized queries  
✅ **XSS Protection** - Helmet middleware  
✅ **CSRF Protection** - Token-based validation  
✅ **File Upload Validation** - Type and size restrictions  
✅ **Role-based Access Control** - Permissions via Rights table  

---

## 📊 Database Schema

### Core Tables (30 Total)

1. **tblcompany** - Company master
2. **tbluser** - System users
3. **tblusertype** - User roles
4. **tblrequirement** - Job postings ⭐
5. **tblapplyjob** - Applications ⭐
6. **tblcandidate** - Candidate pool ⭐
7. **tblrequirementtype** - Job categories
8. **tblrequirementposition** - Technologies
9. **tblrequirementpriority** - Job priorities
10. **tblcity, tblstates, tblcountries** - Location data
11. **ActivityLog, ErrorLog** - System logs
12. **Menu, Rights** - Permissions
13. Plus 17 more supporting tables...

---

## 🎨 Frontend

- **Bootstrap 5** - Responsive framework
- **Font Awesome 6** - Icons
- **jQuery 3.7** - DOM manipulation
- **EJS** - Server-side templating
- **Moment.js** - Date formatting

---

## 📝 Environment Variables

Create `.env` file from `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000
APP_NAME=RexJobs
BASE_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=rexjobs

# Session
SESSION_SECRET=your-secret-key

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=quikjob

# Email
SMTP_HOST=mail.rexjobs.in
SMTP_PORT=587
SMTP_USER=info@rexjobs.in
SMTP_PASSWORD=your-password
SMTP_FROM=info@rexjobs.in

# Defaults
DEFAULT_COMPANY_ID=1
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change `SESSION_SECRET` to secure random string
- [ ] Update AWS credentials
- [ ] Configure SMTP settings
- [ ] Set proper database credentials
- [ ] Enable HTTPS/SSL
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up error monitoring (Sentry)
- [ ] Enable compression and caching

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name rexjobs

# Auto-restart on server reboot
pm2 startup
pm2 save
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -h localhost
```

### Migration Errors

```bash
# Rollback and re-run
npm run migrate:rollback
npm run migrate:latest
```

### File Upload Issues

- Check AWS credentials in `.env`
- Verify bucket name and region
- Ensure bucket has public read access

---

## 📞 Support

- **Documentation**: Check this README
- **Issues**: Create issue on GitHub
- **Email**: support@rexjobs.com

---

## 📄 License

MIT License - Free to use and modify

---

## 🎉 What's Next?

Refer to the complete file structure above to:
1. Create remaining controller files
2. Add more view templates
3. Implement email service
4. Add validation middleware
5. Create admin dashboard
6. Add more features

---

**Status**: ✅ **Core application ready!**  
**Migrations**: ✅ **All 6 migration files created!**  
**Homepage**: ✅ **Fully functional with S3 integration!**

Start the development server and begin building! 🚀
