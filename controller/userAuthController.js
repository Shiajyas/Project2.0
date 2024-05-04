const User = require("../models/UserDb");
const Category = require("../models/categoryData")
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/productData")
const {validatingRules,signToken, filedCheker}= require("../utils/authHandler")
const asyncHandler = require('express-async-handler');
const {  validationResult } = require('express-validator');
const jwt = require("jsonwebtoken")
const util = require("util");
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
          const { username, email, contact, password, cpassword } = req.body;
          console.log(email);

          const findUser = await User.findOne({ email });

          if (password === cpassword) {
              if (!findUser) {
                  let otp = otpGenerator();
                  console.log(otp);

                  // Prepare and send email with the OTP
                  const message = `We have received a password reset request. Your OTP is: ${otp}`;
                  const info = await sendEmail({
                      email: email,
                      subject: "Password Reset OTP",
                      message: message,
                      html: `<b> <h4>Your OTP ${otp}</h4> <br> <a href="">Click here</a></b>`,
                  });

                  if (info) {
                      req.session.userOtp = otp;
                      req.session.userData = req.body;
                      console.log( req.session.userData);
                      
                      res.status(200).render("verify-otp", { email });
                      console.log("Email sented", info.messageId);
                  } else {
                    console.error("Error sending email:", info); 
                      return res.status(500).json({ error: "email-error" });
                  }
              } else {
                  return res.status(401).render('signup', { error: ['Email already registered'], successMsg: '' });
              }
          } else {
              return res.status(401).render('signup', { error: ['Passwords do not match'], successMsg: '' });
          }
      }
  })
];

const resendOtp = async (req, res) => {
  try {
      const email = req.session.userData.email;
      var newOtp = otpGenerator(); 
      console.log(email, newOtp);


                  // Prepare and send email with the OTP
                  const message = `We have received a password reset request. Your OTP is: ${newOtp}`;
                  const info = await sendEmail({
                      email: email,
                      subject: "Password Reset OTP",
                      message: message,
                      html: `<b> <h4>Your OTP ${newOtp}</h4> <br> <a href="">Click here</a></b>`,
                  });

      if (info) {
          req.session.userOtp = newOtp;
          res.render("verify-otp", { email });
          console.log("Email resent", info.messageId);
      } else {
          
          return res.status(401).render('signup', { error: ['Failed to resend OTP'], successMsg: '' });
      }
  } catch (error) {
      console.log(error.message);

      return res.status(401).render('signup', { error: ['Error in resending OTP'], successMsg: '' });

  }
}


const verifyOtp = async (req, res) => {
  try {

      //get otp from body
      const { otp } = req.body
      if (otp === req.session.userOtp) {
          const user = req.session.userData
          const referalCode = uuidv4()
          console.log("the referralCode  =>" + referalCode);
         console.log("ve",user.username)
          const newUser = new User({
              username: user.username,
              email: user.email,
              contact: user.contact,
              password: user.password,
              referalCode : referalCode
          })
          const token = signToken(newUser._id);
          const tokenWithBearer = `Bearer ${token}`
  
          console.log(newUser); 
          console.log(token);
          await newUser.save()

          req.session.user = newUser._id

          return res.status(200).render('login', { error: ['Signup success'], successMsg: '' });
       
      } else {
        const email = req.session.userData.email;
        if(!email){
          return res.status(401).render('signup', { error: ['Otp sending error!! Try again'], successMsg: '' });
        }else{
          console.log("otp not matching");
          return res.status(401).render('signup', { error: ['Otp mismatching'], successMsg: '' });
        }
         
      }

  } catch (error) {
      console.log(error.message);
  }
}


  //Generate OTP

function otpGenerator() {
  const digits = "1234567890"
  var otp = ""
  for (i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)]
  }
  return otp
}
  
  const userLoginPost = asyncHandler(async (req, res, next) => {
    console.log(req.user);
    const { email, password } = req.body;
   
    if (!email || !password) {
        return res.status(400).render("login", { error: ['Please provide email and password'], successMsg: '' });
    }
  
    try {
        const newUser = await User.findOne({ email }).select("+password");
  
        if (!newUser) {
            return res.status(401).render("login", { error: ['Invalid email or password..'], successMsg: '' });
        }
        
        if(newUser.isBlocked) {
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
  console.log(req.user);
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
  
  const restrict = (...roles) => {
    return (req, res, next) => {
        try {
            // Check if the user's role is included in the specified roles
            const userRole = req.user ? req.user.role : null;
            if (!roles.includes(userRole)) {
                req.flash("error", "Your profile is not valid, create a new one");
                return res.status(403).render("login", { error: ['Unauthorized access'], successMsg: '' });
            }
            next();
        } catch (error) {
            console.error("Error in restrict middleware:", error);
            return res.status(500).render("login", { error: ['Error occurred'], successMsg: '' });
        }
    };
};

  const userLogout = (req,res)=>{
    req.session = null
    res.cookie("token","", {maxAge:1})
    return res.status(200).redirect("/")
  }
  
  const forgetPassword = (req, res) => {
    
    return res.status(200).render("restpass",{ error: [], successMsg: '' });
  };

  const forgetPasswordPost = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).render("restpass", { error: ["This email is not registered"], successMsg: '' });
        }

        const otp = otpGenerator();
        console.log("Generated OTP2:", otp);

        user.otp = otp;
        user.otpExpires = Date.now() + 600000; // Set OTP expiry to 10 minutes
        await user.save({ validateBeforeSave: false });

        // Prepare and send email with the OTP
        const message = `We have received a password reset request. Your OTP2 is: ${otp}`;
        const info = await sendEmail({
            email: user.email,
            subject: "Password Reset OTP",
            message: message,
        });

        if (info) {
            req.session.userEmail = user.email;
            req.session.userOtp = otp;
            return res.status(200).render("fverify-otp", { email: user.email });
        } else {
            console.error("Error sending email:", info);
            return res.status(500).render("restpass", { error: ["Server error. Unable to generate OTP"], successMsg: '' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).render("restpass", { error: ["Server error. Unable to generate OTP"], successMsg: '' });
    }
});

const fVerifyOtp = asyncHandler(async (req, res) => {
    try {

        const { otp } = req.body;
        const userEmail = req.session.userEmail;
        const userOtp = req.session.userOtp;
        const referalCode = uuidv4()
        console.log("the referralCode2  =>" + referalCode);
        console.log(userOtp);

        if (otp === userOtp) {
            return res.status(200).render('restpassF', { error: [], successMsg: '' });
        } else {
            console.log("OTP mismatch");
            return res.status(401).render('restpass', { error: ['OTP mismatch'], successMsg: '' });
        }
    } catch (error) {
        console.error(error.message);
        return res.status(500).render("restpass", { error: ["Server error. Unable to verify OTP"], successMsg: '' });
    }
});

const resetPasswordPost = asyncHandler(async (req, res) => {
    try {
        const  email  = req.session.userEmail;
        console.log(email);
        const user = await User.findOne({
            email,
          
        });

        if (!user) {
            return res.status(400).render("restpass", { error: ["Invalid OTP or OTP has expired"], successMsg: '' });
        }

        const { password, cpassword } = req.body;
        if (password !== cpassword) {
            return res.status(401).render("restpass", { error: ["Passwords don't match"], successMsg: '' });
        }

        // Reset user password and other necessary fields
        user.password = password;
        user.confirmPassword = cpassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.passwordChangedAt = Date.now();

        await user.save();

        // Clear session data after password reset
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
            }
        });
        return res.status(200).render('login', { error: ['Password successfully updated. You can now log in.'], successMsg: '' });
       
        
    } catch (error) {
        console.error(error);
        return res.status(500).render("restpassF", { error: ["Server error. Unable to reset password"], successMsg: '' });
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
    productSortAVG,
    verifyOtp,
    resendOtp,
    fVerifyOtp
  };
  