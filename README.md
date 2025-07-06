# LMS Leave Management System - Vercel Serverless

A Leave Management System for educational institutions, now deployed as serverless functions on Vercel.

## 🚀 Features

- **Serverless Architecture**: All API endpoints are deployed as Vercel serverless functions
- **MongoDB Integration**: Cached database connections for optimal performance
- **JWT Authentication**: Secure user authentication and authorization
- **Role-based Access Control**: Support for students, teachers, directors, and global admins
- **Email Notifications**: Automated email notifications for leave requests and approvals
- **Modern Frontend**: Static HTML/CSS/JS files served from Vercel's CDN

## 📁 Project Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── utils/
│   │   └── database.js     # Cached MongoDB connection
│   ├── v1/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin management endpoints
│   │   ├── leave/         # Leave management endpoints
│   │   └── health.js      # Health check endpoint
│   └── index.js           # API documentation endpoint
├── public/                 # Static files (HTML, CSS)
├── controllers/           # Business logic (reused from original)
├── models/               # MongoDB models
├── middleware/           # Authentication & validation middleware
├── routes/               # Original Express routes (kept for reference)
├── config/               # Configuration files
├── utils/                # Utility functions
├── vercel.json           # Vercel deployment configuration
└── package.json          # Dependencies & scripts
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/
JWT_SECRET=your-super-secret-jwt-key
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-email-password
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/approve/[token]` - User approval by token
- `GET /api/v1/auth/me` - Get current user info

### Admin Management
- `GET /api/v1/admin/pending-users` - Get pending users
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/teachers` - Get available teachers
- `GET /api/v1/admin/directors` - Get available directors
- `POST /api/v1/admin/register-user` - Admin user registration
- `PUT /api/v1/admin/users/[userId]/status` - Update user status

### Leave Management
- `POST /api/v1/leave/request` - Submit leave request
- `GET /api/v1/leave/my-requests` - Get user's leave requests
- `GET /api/v1/leave/[fullName]/[date]/[token]` - Submit leave for approval
- `GET /api/v1/leave/details/[token]` - Get leave request details
- `POST /api/v1/leave/approve/[token]` - Approve/reject leave request

### Utility
- `GET /api/v1/health` - Health check endpoint
- `GET /api` - API documentation

## 🌍 Frontend Routes

- `/` - Main dashboard
- `/register` - User registration
- `/approve/[token]` - User approval page
- `/approve-leave/[token]` - Leave approval page
- `/test-leave` - Test leave submission
- `/tos` - Terms of Service
- `/privacy` - Privacy Policy

## 🚀 Deploy to Vercel

### Option 1: Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Option 3: Vercel Dashboard

1. Import project from GitHub
2. Configure environment variables
3. Deploy

## 🔒 Security Features

- **JWT Token Authentication**: Secure API access
- **Role-based Authorization**: Different access levels for different user types
- **Input Validation**: Express-validator for request validation
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Configuration**: Proper cross-origin resource sharing setup

## 📊 Database

The application uses MongoDB with Mongoose ODM. The database connection is cached globally to optimize performance in the serverless environment.

Key collections:
- `users` - User accounts and profiles
- `leave_requests` - Leave applications and approvals
- `notifications` - Email notification logs

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# The original Express app will run on http://localhost:3000
```

### Testing Serverless Functions Locally

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev
```

## 🔄 Migration from Express.js

This project has been migrated from a traditional Express.js application to Vercel serverless functions:

1. **Routes → API Functions**: Express routes converted to individual serverless functions
2. **Static Files**: Moved to `public/` directory for CDN serving
3. **Database**: Implemented connection caching for serverless environment
4. **Middleware**: Adapted to work with serverless function handlers
5. **Error Handling**: Centralized error handling in each function

## 📝 Notes

- All original Express.js files are preserved for reference
- Database connections are cached to improve performance
- Static files are served from Vercel's global CDN
- All API endpoints maintain the same functionality as the original Express app
- Environment variables must be configured in Vercel dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.