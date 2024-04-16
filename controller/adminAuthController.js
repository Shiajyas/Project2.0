const Admin = require("../models/adminData")
const {validatingRules,signToken} = require("../utils/authHandler")
const asyncHandler = require("express-async-handler")
const { validationResult } = require("express-validator")
const jwt = require("jsonwebtoken")
const util = require("util");
const { error, log } = require('console');

const adminlogin = (req,res)=>{
  const error = req.flash('error'); // Retrieve flash messages
    res.status(200).render("adminLogin",{ error })
}

const adminSignUp = (req,res)=>{
    res.status(200).render("adminSignup",{ error: [], successMsg: '' })
}


const adminSignupPost = [
    validatingRules,
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        let errorMsg = errors.array().map((err)=>err.msg)
     
        return res.status(401).render("adminSignup",{ error: [errorMsg], successMsg: "" })
    
      } else {
        console.log("in");
        const { username, email,phoneNo, password, cpassword } = req.body;
        console.log(password);
        console.log(cpassword);
        
        try {
          const newAdmin = await Admin.create({ username, email,phoneNo, password, cpassword });
          const token = signToken(newAdmin._id);
  
          console.log(newAdmin); 
          console.log(token);
          req.flash("error", "Signup success")
          return res.status(200).redirect("/admin/login")
        } catch (error) {
          console.error(error);
  
          if (error.name === 'ValidationError' && error.errors.email === 'unique') {
            return res.status(500).render("adminSignup",{ error: ['Server error'], successMsg: '' })
          } else {
            return res.status(401).render("adminSignup",{ error: ['Server error'], successMsg: '' })
          }
        }
      }
    })
  ];


  const adminLoginPost = asyncHandler(async (req, res) => {

    const { email, password } = req.body;
  
    if (!email || !password) {
     req.flash("error","Please provide email and password")
      return res.status(400).redirect("/admin/login")
    }
   
    try {
      const newUser = await Admin.findOne({ email }).select("+password");
  
      if (!newUser) {
        req.flash("error","Invalid email or password")
        return res.status(401).redirect("/admin/login")
      }
      const isPasswordMatch = await newUser.comparePassword(password);
  
      if (isPasswordMatch) {
        console.log("success");
        const token = signToken(newUser._id);
      
        // Set token as a cookie with options (e.g., secure, httpOnly, sameSite)
        res.cookie('token', token, {
          httpOnly: true, // Cookie accessible only by the web server
          secure: true, // Enable only in HTTPS mode
          sameSite: 'strict', // Restrict cookie sending to same-site requests
          // Add other necessary cookie options
        })
        return res.status(200).redirect("/admin/dashbord"); // Redirect to dashboard after setting the cookie
      } else {
        console.log("fail");
        req.flash("error","Invalid email or password")
        return res.status(401).redirect("/admin/login")
      }
    } catch (err) {
      console.error(err.message);
      if (err.name === "ServerError") {
        req.flash("error","Server error. Please try again later.")
        return res.status(500).redirect("/admin/login")
      } else {
        req.flash("error","Something went wrong. Please try again." )
        return res.status(500).redirect("/admin/login")
      }
    }
  });


  const adminDashBord = (req,res)=>{
    return res.status(200).render("adminConsole")
  }

  // Protect middleware
const adminProtectRules = asyncHandler(async (req, res, next) => {
  try {
    let token = req.query.token || req.cookies.token || req.headers.authorization;

    if (!token) {
      req.flash("error","Unauthorized access")
      return res.status(401).redirect("/admin/login");
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
    const admin = await Admin.findById(decodeToken.id);

    if (!admin) {
      req.flash("error","your profile not exit create new one!!")
      return res.status(404).redirect("/admin/login");
    }

    // Check if the user changed the password after the token was issued
    if (admin.isPasswordChanged(decodeToken.iat)) {
      req.flash("error","The password was changed recently. Please try again later.")
      return res.status(401).redirect("/admin/login");
    }

    // Proceed to the next middleware
    req.admin = admin
    req.token = token; // Optional: Save the token in the request object for later use
    next();
  } catch (error) {
    // Handle specific error scenarios with appropriate responses
    if (error.name === "JsonWebTokenError") {
      req.flash("error","your profile not valid, create new one")
      return res.status(401).redirect("/admin/login");
    } else if (error.name === "TokenExpiredError") {
      req.flash("error","your profile not valid, create new one")
      return res.status(401).redirect("/admin/login");
    } else {
      console.error(error.message);
      req.flash("error","your profile not valid, create new one")
      return res.status(500).redirect("/admin/login");
    }
  }
});

const adminRestrict = (...role)=>{
  return (req,res,next)=>{

    if(!role.includes(req.admin.role)){
      
      req.flash("error","your profile not valid, create new one")
      return res.status(500).redirect("/admin/login");
    }
    next ()
  }
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
  console.log("in");
  res.cookie("token", "", {maxAge:1})
  req.flash("error","Logout success")
  return res.status(200).redirect("/")
}


module.exports = {
    adminlogin,
    adminSignUp,
    adminSignupPost,
    adminLoginPost,
    adminDashBord,
    adminProtectRules,
    adminRestrict,
    forgetPassword,
    forgetPasswordPost,
    resetPasswordPost,
    adminLogout
}