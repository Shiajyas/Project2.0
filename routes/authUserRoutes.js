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
editUserDetails,
verifyReferalCode 
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
  returnOrder,
  cancelProduct
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
  newProducts,
  verifyOtp,
  resendOtp,
  fVerifyOtp,
  applyCoupon,
  category_L_H,
  category_H_L,
  categoryAvg,
  getShopPage,
  productSearch
} = require("../controller/userAuthController")

const {
  addMoneyToWallet,
  verify_payment,

} = require("../controller/walletController")

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
authRouterUser.get("/product/shop",protectRules,restrict("user"),getShopPage)
authRouterUser.get("/product/detail",protectRules,restrict("user"),getUserProductDetails)
authRouterUser.get("/product/sort_L_H",protectRules,restrict("user"),productSortL_H)
authRouterUser.get("/product/sort_H_L",protectRules,restrict("user"),productSortH_L)
authRouterUser.get("/product/sort_avg_rate",protectRules,restrict("user"),productSortAVG)
authRouterUser.get("/product/NewProducts",protectRules,restrict("user"),newProducts)
authRouterUser.get("/product/category_H_L",protectRules,restrict("user"),category_H_L)
authRouterUser.get("/product/category_L_H",protectRules,restrict("user"),category_L_H)
authRouterUser.get("/product/categoryAvg",protectRules,restrict("user"),categoryAvg)
authRouterUser.get("/product/search",protectRules,restrict("user"),productSearch)


authRouterUser.get("/auth/facebook",passport.authenticate("facebook",{
  scope: ["email","profile"]
}))

authRouterUser.get("/user/auth/facebook/callback",passport.authenticate("facebook",{
successRedirect: "/",
failureRedirect: "/user/login"
}))


//User profile Routes 

authRouterUser.get("/profile",protectRules,restrict("user"), getUserProfile)
authRouterUser.get("/addAddress",protectRules,restrict("user"), getAddUserProfile)
authRouterUser.post("/addAddress",protectRules,restrict("user"), upload.array("images",1),postAddress)
authRouterUser.get("/addAddress",protectRules,restrict("user"), getAddUserProfile)
authRouterUser.get("/editAddress",protectRules,restrict("user"), getEditUserProfile)
authRouterUser.post("/editAddress",protectRules,restrict("user"), editUserProfile)
authRouterUser.get("/deleteAddress",protectRules,restrict("user"), getDeleteAddress)
authRouterUser.post("/editUserDetails",protectRules,restrict("user"), editUserDetails)
authRouterUser.post("/verifyReferalCode",protectRules,restrict("user"), verifyReferalCode)

// cart routes  
authRouterUser.get("/cart",protectRules,restrict("user"), getCartPage)
authRouterUser.post("/addcart",protectRules,restrict("user"),addToCart) 
authRouterUser.post("/changeQuantity",protectRules,restrict("user"),changeQuantity)
authRouterUser.get("/deleteItem",protectRules,restrict("user"),deleteProduct)

// WishList routes 
authRouterUser.get("/wishlist",protectRules,restrict("user"),getWishlistPage)
authRouterUser.post("/addWishlist",protectRules,restrict("user"),addToWishlist)
authRouterUser.get("/deleteWishlist",protectRules,restrict("user"),deleteItemWishlist )

//order routes 
authRouterUser.get("/checkout",protectRules,restrict("user"), getCheckoutPage) 
authRouterUser.post("/orderPlaced",protectRules,restrict("user"), orderPlaced) 
authRouterUser.post("/verifyPayment",protectRules,restrict("user"), verify) 
authRouterUser.get("/orderDetails",protectRules,restrict("user"), getOrderDetailsPage)
authRouterUser.get("/cancelOrder",protectRules,restrict("user"), cancelOrder)
authRouterUser.get("/return",protectRules,restrict("user"), returnOrder)
authRouterUser.post("/applyCoupon",protectRules,restrict("user"), applyCoupon)
authRouterUser.get("/cancelProduct",protectRules,restrict("user"), cancelProduct)

//Walet
authRouterUser.post("/addMoney",protectRules,restrict("user"), addMoneyToWallet)
authRouterUser.post("/verify-payment",protectRules,restrict("user"), verify_payment)

module.exports = authRouterUser;



