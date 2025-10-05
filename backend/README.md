# Task Manager Backend

A Node.js backend API for the Task Manager application with MongoDB integration.

## Features

- User authentication and authorization
- Task management (CRUD operations)
- Admin dashboard and user management
- MongoDB database integration
- JWT-based authentication
- Input validation and error handling
- Role-based access control

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/taskmanager
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   
   # Admin Configuration
   ADMIN_EMAIL=admin@taskmanager.com
   ADMIN_PASSWORD=admin123
   ```

## Database Setup

### Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The application will connect to `mongodb://localhost:27017/taskmanager`

### MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

2. Setup admin user (first time only):
   ```bash
   npm run setup:admin
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Tasks
- `GET /api/tasks` - Get all tasks (with filters)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task
- `PUT /api/tasks/:id/archive` - Archive/unarchive task

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get single user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/tasks` - Get all tasks (admin view)

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── errorHandler.js     # Error handling middleware
├── models/
│   ├── User.js             # User model
│   └── Task.js             # Task model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── tasks.js            # Task routes
│   └── admin.js            # Admin routes
├── utils/
│   └── setupAdmin.js       # Admin setup utility
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
└── server.js               # Main server file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/taskmanager` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRE` | JWT token expiration | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `ADMIN_EMAIL` | Default admin email | `admin@taskmanager.com` |
| `ADMIN_PASSWORD` | Default admin password | `admin123` |

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation with express-validator
- CORS configuration
- Role-based access control
- Error handling and logging

## Development

The backend uses ES6 modules and includes:
- Express.js for the web framework
- Mongoose for MongoDB ODM
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation
- CORS for cross-origin requests

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Use MongoDB Atlas or a production MongoDB instance
5. Set up proper logging and monitoring
