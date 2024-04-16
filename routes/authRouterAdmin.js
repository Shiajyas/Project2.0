const express = require("express")
const authRouterAdmin = express.Router()

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
adminLogout
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

module.exports = authRouterAdmin
