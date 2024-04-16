const mongoose = require("mongoose");
const validator = require('validator');
const bcrypt = require("bcryptjs");
const otpGenerator = require('otp-generator');

const adminSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  PhoneNo:{
    type: String, // Changed type to String
    
  },
  photo: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "admin",
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: 8,
    select: false,
  },
  cpassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Passwords do not match",
    },
  },
  passwordChangedAt: Date,
  encryptedOTP: String,
  otpExpires: Date,
});

adminSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  this.cpassword = undefined;

  // Adding prefix +91 to PhoneNo if it's not already included
  if (this.PhoneNo && !this.PhoneNo.startsWith("+91")) {
      this.PhoneNo = "+91" + this.PhoneNo;
  }

  next();
});


adminSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.isPasswordChanged = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      // Convert the timestamps to seconds for comparison
      const passwordTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000); // Convert to seconds
    
      // If the password change timestamp is greater than or equal to the JWT timestamp, password changed
      return JWTTimestamp <= passwordTimestamp;
    }
    return false; // If passwordChangedAt is not set, assume the password was not changed
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
