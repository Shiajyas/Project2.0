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
createCoupon,
getSalesReportPage,
salesToday,
salesWeekly,
salesMonthly,
salesYearly,
dateWiseFilter,
generatePdf,
downloadExcel
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

authRouterAdmin.get("/salesReport",adminProtectRules,adminRestrict("admin"),getSalesReportPage)
authRouterAdmin.get("/salesToday",adminProtectRules,adminRestrict("admin"),salesToday)
authRouterAdmin.get("/salesWeekly",adminProtectRules,adminRestrict("admin"),salesWeekly)
authRouterAdmin.get("/salesMonthly",adminProtectRules,adminRestrict("admin"),salesMonthly)
authRouterAdmin.get("/salesYearly",adminProtectRules,adminRestrict("admin"),salesYearly)
authRouterAdmin.get("/dateWiseFilter",adminProtectRules,adminRestrict("admin"),dateWiseFilter)
authRouterAdmin.post("/generatePdf",adminProtectRules,adminRestrict("admin"),generatePdf)
authRouterAdmin.post("/downloadExcel",adminProtectRules,adminRestrict("admin"),downloadExcel)



module.exports = authRouterAdmin
