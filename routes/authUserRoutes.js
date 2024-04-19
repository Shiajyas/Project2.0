const express = require("express");
const authRouterUser = express.Router();
const passport = require("passport");
require("../utils/passport");

authRouterUser.use(passport.initialize());
authRouterUser.use(passport.session());

authRouterUser.get("/auth/facebook", passport.authenticate("facebook", {
  scope: ["email", "profile"]
}));

// Corrected callback route
authRouterUser.get("/auth/facebook/callback", passport.authenticate("facebook", {
  successRedirect: "/",
  failureRedirect: "/user/login"
}));

// Google authentication route
authRouterUser.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

// Google authentication callback route
authRouterUser.get("/auth/google/callback", passport.authenticate("google", {
  successRedirect: "/",
  failureRedirect: "/user/login"
}));


const {
  userSignup,
  userSignupPost,
  userLoginPost,
  userLogin,
  protectRules,
  restrict,
  userLogout,
  forgetPassword,
  forgetPasswordPost,
  resetPasswordPost,
  // getUserHome,
  getUserProductDetails,
  productSortL_H,
  productSortH_L,
  productSortAVG
} = require("../controller/userAuthController")

authRouterUser.get('/signup',userSignup); // GET request to render the signup form
authRouterUser.post('/signup', userSignupPost); // POST request to handle form submission
authRouterUser.post('/login',userLoginPost)
authRouterUser.get('/login',userLogin)
authRouterUser.get("/logout",userLogout) 
authRouterUser.get("/forgetPassword",forgetPassword)
authRouterUser.post("/forgetPassword",forgetPasswordPost)
authRouterUser.post("/resetPassword",resetPasswordPost)
// authRouterUser.get("/home",protectRules,restrict("user","admin"),getUserHome)
authRouterUser.get("/product/detail",protectRules,restrict("user","admin"),getUserProductDetails)
authRouterUser.get("/product/sort_L_H",protectRules,restrict("user","admin"),productSortL_H)
authRouterUser.get("/product/sort_H_L",protectRules,restrict("user","admin"),productSortH_L)
authRouterUser.get("/product/sort_avg_rate",protectRules,restrict("user","admin"),productSortAVG)


authRouterUser.get("/auth/facebook",passport.authenticate("facebook",{
  scope: ["email","profile"]
}))

authRouterUser.get("/user/auth/facebook/callback",passport.authenticate("facebook",{
successRedirect: "/",
failureRedirect: "/user/login"
}))



module.exports = authRouterUser;



