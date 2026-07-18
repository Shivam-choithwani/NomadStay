const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

const createAdmin = async () => {
  await connectDB();

  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@stayshare.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword123";

    // Check if admin exists
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      console.log("Admin account already exists!");
      console.log(`Email: ${adminEmail}`);
      process.exit();
    }

    const adminUser = await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isEmailVerified: true
    });

    console.log("Admin account successfully created!");
    console.log("-----------------------------------");
    console.log("Login Portal: /admin/login");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: (hidden for security)`);
    console.log("-----------------------------------");

    process.exit();
  } catch (error) {
    console.error("Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
