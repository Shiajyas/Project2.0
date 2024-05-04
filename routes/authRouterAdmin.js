const express = require("express")
const authRouterAdmin = express.Router()

const {
    getOrderListPageAdmin,
    getOrderDetailsPageAdmin,
    changeOrderStatus
} = require("../controller/orderController")

const {
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
adminLogout,
getCouponPageAdmin,
createCoupon
} = require("../controller/adminAuthController")

authRouterAdmin.get("/login",adminlogin)
authRouterAdmin.get("/signup",adminSignUp)
authRouterAdmin.post("/signup",adminSignupPost)
authRouterAdmin.post("/login",adminLoginPost)
authRouterAdmin.get("/dashbord",adminProtectRules,adminRestrict("admin"),adminDashBord)
authRouterAdmin.get("/forgetPassword",forgetPassword)
authRouterAdmin.post("/forgetPassword",forgetPasswordPost)
authRouterAdmin.post("/resetPassword",resetPasswordPost)
authRouterAdmin.get("/logout",adminLogout)
authRouterAdmin.get("/coupon",adminProtectRules,adminRestrict("admin"),getCouponPageAdmin)
authRouterAdmin.post("/createCoupon",adminProtectRules,adminRestrict("admin"),createCoupon)

authRouterAdmin.get("/orderlist",adminProtectRules,adminRestrict("admin"),getOrderListPageAdmin)
authRouterAdmin.get("/orderDetailsAdmin",adminProtectRules,adminRestrict("admin"),getOrderDetailsPageAdmin)
authRouterAdmin.get("/changeStatus",adminProtectRules,adminRestrict("admin"),changeOrderStatus)



module.exports = authRouterAdmin
