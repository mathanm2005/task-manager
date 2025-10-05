# Task Manager - Full Stack Application

A comprehensive task management application built with React, Node.js, Express, and MongoDB. Features include user authentication, task management, and admin panel functionality.

## Features

### User Features
- **User Authentication**: Sign up, login, and logout functionality
- **Task Management**: Create, view, edit, and delete tasks
- **Task Organization**: Categorize tasks by status, priority, and assign to users
- **Dashboard**: Overview of tasks and statistics
- **Responsive Design**: Works on desktop and mobile devices

### Admin Features
- **User Management**: View, edit, and manage all users
- **Role Management**: Assign admin or user roles
- **User Status Control**: Activate/deactivate user accounts
- **System Statistics**: Monitor application usage and activity
- **Activity Monitoring**: Track recent user and task activity

## Tech Stack

### Frontend
- React 18 with Hooks
- React Router for navigation
- Axios for API calls
- React Hot Toast for notifications
- React Icons for UI icons
- Vite for build tooling

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation
- CORS enabled

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd task-manager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/task-manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend Configuration
VITE_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

### 5. Setup Admin User
Create the initial admin user:
```bash
npm run setup:admin
```
This creates an admin user with:
- Email: `admin@taskmanager.com`
- Password: `admin123456`

**Important**: Change these credentials after first login!

### 6. Start the Application

#### Option A: Run Frontend and Backend Separately
```bash
# Terminal 1: Start Backend
npm run server

# Terminal 2: Start Frontend
npm run dev
```

#### Option B: Run Both Together
```bash
npm run dev:full
```

### 7. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Admin Panel: http://localhost:5173/admin (after admin login)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Tasks
- `GET /api/tasks` - Get all tasks (with pagination and filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Admin (Admin only)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/status` - Toggle user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/activity` - Get recent activity

## Usage

### For Regular Users
1. **Sign Up**: Create a new account
2. **Login**: Access your dashboard
3. **Create Tasks**: Add new tasks with details
4. **Manage Tasks**: Update status, priority, and assignments
5. **View Dashboard**: See task overview and statistics

### For Admin Users
1. **Admin Login**: Use admin credentials
2. **Access Admin Panel**: Navigate to `/admin`
3. **User Management**: Monitor and manage all users
4. **System Monitoring**: View application statistics
5. **Role Management**: Assign admin privileges to users

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation with express-validator
- **Role-Based Access**: Admin and user role separation
- **CORS Protection**: Configured for security
- **Environment Variables**: Sensitive data protection

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: 'user', 'admin'),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date
}
```

### Task Model
```javascript
{
  title: String (required),
  description: String,
  status: String (enum: 'pending', 'in-progress', 'completed'),
  priority: String (enum: 'low', 'medium', 'high', 'urgent'),
  assignedTo: ObjectId (ref: User),
  createdBy: ObjectId (ref: User),
  dueDate: Date,
  tags: [String],
  createdAt: Date
}
```

## Development

### Project Structure
```
task-manager/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── admin/         # Admin components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── layout/        # Layout components
│   │   └── tasks/         # Task management components
│   ├── contexts/          # React contexts
│   └── App.jsx            # Main application component
├── server/                 # Backend source code
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

### Available Scripts
- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run setup:admin` - Create initial admin user
- `npm run lint` - Run ESLint

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env` file
   - Verify MongoDB port (default: 27017)

2. **Port Already in Use**
   - Change port in `.env` file
   - Kill processes using the port
   - Use different port for frontend/backend

3. **Admin Access Issues**
   - Run `npm run setup:admin` to create admin user
   - Verify user role is set to 'admin'
   - Check JWT token validity

4. **CORS Errors**
   - Verify backend is running on correct port
   - Check proxy configuration in `vite.config.js`
   - Ensure CORS middleware is enabled

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Note**: This is a development application. For production use, ensure proper security measures, environment configuration, and database optimization.
