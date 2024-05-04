const express = require("express");
const authRouterUser = express.Router();
const {upload} = require("../utils/imageUploader");
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

// user Whishlist routeController

const{ getWishlistPage,
  addToWishlist,
  deleteItemWishlist 
} = require("../controller/wishlistController")

// user Profile Routes

const {
getUserProfile,
getAddUserProfile,
postAddress,
getEditUserProfile,
editUserProfile,
getDeleteAddress,
editUserDetails
} = require("../controller/userProfileController")

// user cart routes

const {
getCartPage,
addToCart,
changeQuantity,
deleteProduct
} = require("../controller/cartController")

//order rotes
const{
  getCheckoutPage,
  orderPlaced,
  verify,
  getOrderDetailsPage,
  cancelOrder,
  returnOrder
} = require("../controller/orderController")

// user auth routes
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
  productSortAVG,
  verifyOtp,
  resendOtp,
  fVerifyOtp
} = require("../controller/userAuthController")

authRouterUser.get('/signup',userSignup); // GET request to render the signup form
authRouterUser.post('/signup', userSignupPost); // POST request to handle form submission
authRouterUser.post('/login',userLoginPost)
authRouterUser.get('/login',userLogin)
authRouterUser.get("/logout",userLogout) 
authRouterUser.get("/forgetPassword",forgetPassword)
authRouterUser.post("/forgetPassword",forgetPasswordPost)
authRouterUser.post("/forget_verify-otp", fVerifyOtp)
authRouterUser.post("/forget_resendOtp", resendOtp)
authRouterUser.post("/verify-otp", verifyOtp)
authRouterUser.get("/resendOtp", resendOtp)
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


//User profile Routes 

authRouterUser.get("/profile",protectRules,restrict("user","admin"), getUserProfile)
authRouterUser.get("/addAddress",protectRules,restrict("user","admin"), getAddUserProfile)
authRouterUser.post("/addAddress",protectRules,restrict("user","admin"), upload.array("images",1),postAddress)
authRouterUser.get("/addAddress",protectRules,restrict("user","admin"), getAddUserProfile)
authRouterUser.get("/editAddress",protectRules,restrict("user","admin"), getEditUserProfile)
authRouterUser.post("/editAddress",protectRules,restrict("user","admin"), editUserProfile)
authRouterUser.get("/deleteAddress",protectRules,restrict("user","admin"), getDeleteAddress)
authRouterUser.post("/editUserDetails",protectRules,restrict("user","admin"), editUserDetails)

// cart routes  
authRouterUser.get("/cart",protectRules,restrict("user","admin"), getCartPage)
authRouterUser.post("/addcart",protectRules,restrict("user","admin"),addToCart) 
authRouterUser.post("/changeQuantity",protectRules,restrict("user","admin"),changeQuantity)
authRouterUser.get("/deleteItem",protectRules,restrict("user","admin"),deleteProduct)

// WishList routes 
authRouterUser.get("/wishlist",protectRules,restrict("user","admin"),getWishlistPage)
authRouterUser.post("/addWishlist",protectRules,restrict("user","admin"),addToWishlist)
authRouterUser.get("/deleteWishlist",protectRules,restrict("user","admin"),deleteItemWishlist )

//order routes 
authRouterUser.get("/checkout",protectRules,restrict("user","admin"), getCheckoutPage) 
authRouterUser.post("/orderPlaced",protectRules,restrict("user","admin"), orderPlaced) 
authRouterUser.post("/verifyPayment",protectRules,restrict("user","admin"), verify) 
authRouterUser.get("/orderDetails",protectRules,restrict("user","admin"), getOrderDetailsPage)
authRouterUser.get("/cancelOrder",protectRules,restrict("user","admin"), cancelOrder)
authRouterUser.get("/return",protectRules,restrict("user","admin"), returnOrder)

module.exports = authRouterUser;



