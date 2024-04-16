const User = require("../models/UserDb");
const Category = require("../models/categoryData")
const Product = require("../models/productData")
const {validatingRules,signToken, filedCheker}= require("../utils/authHandler")
const asyncHandler = require('express-async-handler');
const {  validationResult } = require('express-validator');
const jwt = require("jsonwebtoken")
const util = require("util");
const { error, log } = require('console'); 
const sendEmail = require("../Utils/email")
const bcrypt = require("bcryptjs");
// Handle user signup POST request



const userSignup = (req,res)=>{
   try {
  
    return res.status(200).render("signup", {successMsg: "", error: [] });
   } catch (error) {
    console.log(error.message);
   }
}

const userSignupPost = [
    validatingRules,
    asyncHandler(async (req, res) => {
   
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const errorArray = errors.array().map((err) => err.msg);
      
        return res.status(401).render('signup', { error: errorArray, successMsg: '' });
      } else {
        const { username, email,contact, password, cpassword } = req.body;
        
        console.log(req.body);
 
        try {
          const newUser = await User.create({ username, email,contact, password, cpassword });
          const token = signToken(newUser._id);
          const tokenWithBearer = `Bearer ${token}`
  
          console.log(newUser); 
          console.log(token);
          return res.status(200).render('signup', { successMsg: 'Signup successful', error: [] });
        } catch (error) {
          console.error(error);
  
          if (error.name === 'ValidationError' && error.errors.email.kind === 'unique') {
            return res.status(500).render('signup', { error: ['Oops! Something went wrong.'], successMsg: '' });
          } else {
            return res.status(401).render('signup', { error: ['Email already registered'], successMsg: '' });
          }
        }
      }
    })
  ];
  
  
  const userLoginPost = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
   
    if (!email || !password) {
        return res.status(400).render("login", { error: ['Please provide email and password'], successMsg: '' });
    }
  
    try {
        const newUser = await User.findOne({ email }).select("+password");
  
        if (!newUser) {
            return res.status(401).render("login", { error: ['Invalid email or password..'], successMsg: '' });
        }
        
        if(newUser.blocked) {
            return res.status(401).render("login", { error: ['Your account is blocked. Please contact support.'], successMsg: '' });
        }

        const isPasswordMatch = await newUser.comparePassword(password);
  
        if (isPasswordMatch) {
            const token = signToken(newUser._id);
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
            });
            return res.status(200).redirect("/"); // Redirect to dashboard after setting the cookie
        } else {
            return res.status(401).render("login", { error: ['Invalid email or password'], successMsg: '' });
        }
    } catch (err) {
        console.error(err.message);
        if (err.name === "ServerError") {
            return res.status(500).render("login", { error: ['Server error. Please try again later.'], successMsg: '' });
        } else {
            return res.status(500).render("login", { error: [], successMsg: '' });
        }
    }
});

  const userLogin = (req, res) => {
  
   return res.status(200).render('login', { error: [''], successMsg: '' });
  };



  
// Protect middleware
const protectRules = asyncHandler(async (req, res, next) => {
    try {
      let token = req.query.token || req.cookies.token || req.headers.authorization;
  
      if (!token) {
        return res.status(401).render("login",{ error: ['Unauthorized access'], successMsg: '' })
      }
  
      // Log the token for inspection
  
      // Check if the token is in the format 'Bearer <token>'
      if (!token.startsWith("Bearer")) {
        // If the token doesn't have the 'Bearer' prefix, prepend it
        token = `Bearer ${token}`;
      }
  
      // Extract the token part after 'Bearer '
      token = token.slice(7); // Remove 'Bearer ' to get only the token part
  
      // Validate token
      const decodeToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);
      console.log(decodeToken);
  
      // Verify user existence based on the decoded token
      const user = await User.findById(decodeToken.id);
  
      if (!user) {
        
        return res.status(404).render("login",{ error: ['error","your profile not exit create new one!!'], successMsg: '' })
      }
  
      // Check if the user changed the password after the token was issued
      if (user.isPasswordChanged(decodeToken.iat)) {
        return res.status(401).render("login",{ error: ['The password was changed recently. Please try again later.'], successMsg: '' })
      }
  
      // Proceed to the next middleware
      req.user = user
      req.token = token; // Optional: Save the token in the request object for later use
      next();
    } catch (error) {
      // Handle specific error scenarios with appropriate responses
      if (error.name === "JsonWebTokenError") {
        return res.status(401).render("login",{ error: ['your profile not valid, create new one'], successMsg: '' })
      } else if (error.name === "TokenExpiredError") {
        return res.status(401).render("login",{ error: ['your profile not valid, create new one'], successMsg: '' })
      } else {
        console.error(error.message);
        return res.status(500).render("login",{ error: ['your profile not valid, create new one'], successMsg: '' })
      }
    }
  });
  
  // add seprate permission to access admin and user
  
  const restrict = (...role)=>{
    return (req,res,next)=>{
  
      if(!role.includes(req.user.role)){
        
        req.flash("error","your profile not valid, create new one")
        return res.status(500).render("login",{ error: ['LogOut successfull!!'], successMsg: '' })
      }
      next ()
    }
  }

  const userLogout = (req,res)=>{
    res.cookie("token","", {maxAge:1})
    return res.status(200).redirect("/")
  }
  
  const forgetPassword = (req, res) => {
    
    return res.status(200).render("restpass",{ error: [], successMsg: '' });
  };

  const forgetPasswordPost = asyncHandler(async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });
  
      if (!user) {
       
        return res.status(401).render("restpass",{ error: ["This email is not registered"], successMsg: '' });
      }
  
      const otp = user.otpGenerator();
      console.log(otp);
  
      await user.save({ validateBeforeSave: false });
  
      // Prepare and send email with the OTP
      const message = `We have received a password reset request. Your OTP is: ${otp}`;
      await sendEmail({
        email: user.email,
        subject: "Password Reset OTP",
        message: message,
      });
  
      
      return res.status(200).render("restpass",{ error: [], successMsg: `OTP send to ${user.email}` });;
    } catch (error) {
      console.error(error);
     
      return res.status(500).render("restpass",{ error: ["Server error. Unable to generate OTP"], successMsg: '' });
    }
  });
  
  
const resetPasswordPost = asyncHandler(async (req, res) => {
    try {
      const user = await User.findOne({
        email: req.body.email,
        otpExpires: { $gt: Date.now() },
      });
  
      const {password,cpassword} = req.body
      if(password !== cpassword){
        return res.status(401).render("restpass",{ error: ["Passeord donsn't match"], successMsg: '' }); 
      }
  
      console.log(user);

      if (!user) {
      return res.status(400).render("restpass",{ error: ["Invalid OTP or OTP has expired"], successMsg: '' });
      }
  
      const isMatch = await bcrypt.compare(req.body.otp, user.encryptedOTP);
  
      if (!isMatch) {
        return res.status(400).render("restpass",{ error: ["Invalid OTP or OTP has expired"], successMsg: '' });
       
      }
  
      // Reset user password and other necessary fields
      user.password = req.body.password;
      user.confirmPassword = req.body.cpassword;
      user.encryptedOTPotp = undefined;
      user.otpExpires = undefined;
      user.passwordChangedAt = Date.now();
  
      await user.save();
      return res.render("login",{ error: ["Password successfully updated"], successMsg: '' })
    } catch (error) {
      console.error(error);
      return res.status(500).render("restpass",{ error: ["Server error. Unable to reset password"], successMsg: '' });
    }
  });

  const adminLogout = (req,res)=>{
    res.cookie("token","", {maxAge:1})
    req.flash("error","Logout success")
    return res.status(200).redirect("/admin/login")
  }

//   const getUserHome = asyncHandler(async (req, res) => {
//     try {
     
//         const userId = req.user._id; // Retrieve the user ID
//         const products = await Product.find({ isListed: true }).limit(9);
//         const user = await User.findById(userId);
        

//         for (const product of products) {
//           const categoryId = product.category;
//           const category = await Category.findById(categoryId);
//           product.categoryD = category.isListed; // Add category details to each product
//       }
 
       
//         if (user) {
//             res.render("home2", { user: user, products: products });
//         } else {
//             res.render("home2", { products: products });
//         }
//     } catch (err) {
//         // Handle errors appropriately
//         console.error(err);
//         return res.status(500).render('404');
//     }
// }); 

const getUserProductDetails = asyncHandler(async (req, res) => {
  try {
       
    console.log(req.query.id)
      const userId = req.user._id
      const productId = req.query.id // Retrieve the user ID 
      const products = await Product.findOne({ _id: productId })
      const user = await User.findById(userId);

   
        const categoryId = products.category;
        const category = await Category.findById(categoryId);
        products.categoryD = category; // Add category details to each product

    
      if (user) {
          res.render("userProductDetails", { user: user, products: products });
      } else {
          res.render("userProductDetails", { products: products });
      }
  } catch (err) {
      // Handle errors appropriately
      console.error(err);
      return res.status(500).render('404');
  }
}); 

const productSortL_H = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    console.log("1");
    
    const products = await Product.find().sort({ price: 1 });
    for (const product of products) {
      const categoryId = product.category; 
      const category = await Category.findById(categoryId);
      product.categoryD = category;
    }

    if (products.length > 0) { 
      console.log(products);
      return res.status(200).render("home2", { products: products, user: user });
    } else {
    
      console.log("No products found.");
      return res.status(200).render("home2", { products: [], user: user });
    }
  } catch (error) {
    console.error(error.stack); 
    res.status(500).render("404");
  }
};

const productSortH_L = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    console.log("1");
    
    const products = await Product.find().sort({ price: -1 }); 
    for (const product of products) {
      const categoryId = product.category; 
      const category = await Category.findById(categoryId);
      product.categoryD = category;
    }

    if (products.length > 0) { 
      console.log(products);
      return res.status(200).render("home2", { products: products, user: user });
    } else {
     
      console.log("No products found.");
      return res.status(200).render("home2", { products: [], user: user });
    }
  } catch (error) {
    console.error(error.stack);
    res.status(500).render("404");
  }
};

const productSortAVG = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    console.log("1");
    
    const products = await Product.find({ rate: { $gt: 2 } }).sort({ price: 1 });
    for (const product of products) {
      const categoryId = product.category; 
      const category = await Category.findById(categoryId);
      product.categoryD = category;
    }

    if (products.length > 0) {
      console.log(products);
      return res.status(200).render("home2", { products: products, user: user });
    } else {
    
      console.log("No products found.");
      return res.status(200).render("home2", { products: [], user: user });
    }
  } catch (error) {
    console.error(error.stack); 
    res.status(500).render("404");
  }
};



module.exports = {
    userSignup,
    userSignupPost,
    userLoginPost,
    userLogin,
    // getUserHome,
    protectRules,
    restrict,
    userLogout,
    forgetPassword,
    forgetPasswordPost,
    resetPasswordPost,
    adminLogout,
    getUserProductDetails,
    productSortL_H,
    productSortH_L,
    productSortAVG
  };
  