const mongoose = require("mongoose");
const validator = require('validator');
const bcrypt = require("bcryptjs");
const otpGenerator = require('otp-generator');

const userSchema = mongoose.Schema({

  username: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  contact:{
  type: Number

  }, addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'address' }], // Reference to Address schema
    
        country:{
          type: String
        
          },
          status:{
            type:String
          },
          dob:{
            type:String
          },
          days:{
            type:Number
          }, 

  images: Array,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  password: {
    type: String,
   
    minlength: 8,
    select: false,
  },
  cart: {
      type: Array
  },
  wishlist: {
      type: Array
  },
  referalCode: {
      type: String,
     
  },
  cpassword: {
    type: String,
  
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Passwords do not match",
    },
  }, isBlocked: {
    type: Boolean,
    default: false
},
history: {
    type: Array
},
redeemed: {
  type: Boolean,
  default: false,
},
redeemedUsers: [
  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
  }
],
  passwordChangedAt: Date,
  encryptedOTP: String,
  otpExpires: Date,
  updatedAt: Date,
  
},
{
  timestamps: true, // Automatically manage createdAt and updatedAt
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Only hash the password if it's provided during the update
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
    this.cpassword = undefined;
  }

  next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isPasswordChanged = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      // Convert the timestamps to seconds for comparison
      const passwordTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000); // Convert to seconds
    
      // If the password change timestamp is greater than or equal to the JWT timestamp, password changed
      return JWTTimestamp <= passwordTimestamp;
    }
    return false; // If passwordChangedAt is not set, assume the password was not changed
  };
  
  userSchema.methods.otpGenerator = function () {
    const OTP = otpGenerator.generate(6, {
      upperCaseAlphabets: true,
      specialChars: false,
    });
  
    // Encrypt the OTP using bcrypt before storing it
    const hashedOTP = bcrypt.hashSync(OTP, 10); // Hash the OTP with bcrypt (adjust salt rounds as needed)
    this.encryptedOTP = hashedOTP; // Assuming 'encryptedOTP' is a field in your user schema to store the encrypted OTP
    this.otpExpires = Date.now()+10 * 60 * 1000;
  
    return OTP; // Return the plain OTP for sending via email
  };

  userSchema.pre('save', async function(next) {
    if (!this.id) {
        let idExists = true;
        let newId;
        while (idExists) {
            newId = Math.floor(Math.random() * 1000).toString().substring(0, 3);
            idExists = await this.constructor.exists({ id: newId });
        }
        this.id = newId;
    }
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
