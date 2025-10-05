import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      
      // Ask if user wants to update admin password
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('Do you want to update the admin password? (y/n): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        const newPassword = await new Promise((resolve) => {
          const rl2 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });
          rl2.question('Enter new admin password: ', (password) => {
            rl2.close();
            resolve(password);
          });
        });

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        existingAdmin.password = await bcrypt.hash(newPassword, salt);
        await existingAdmin.save();

        console.log('Admin password updated successfully');
      }

      process.exit(0);
    }

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@taskmanager.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = await User.create({
      name: 'Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', adminPassword);
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error setting up admin:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the setup
setupAdmin();
