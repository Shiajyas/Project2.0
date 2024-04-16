const express = require("express")
const adminUserRoutes = express.Router()


const {
   userList,
   searchUser,
   getListUser,
   getUnlistUser

  } =require("../controller/adminUserController");

  
const {  
    adminProtectRules,
    adminRestrict
  } = require("../controller/adminAuthController")

   
adminUserRoutes.get("/view",adminProtectRules,adminRestrict("admin"),userList)
adminUserRoutes.get("/list",adminProtectRules,adminRestrict("admin"),getListUser)
adminUserRoutes.get("/unlist",adminProtectRules,adminRestrict("admin"),getUnlistUser)
adminUserRoutes.post("/search",adminProtectRules,adminRestrict("admin"),searchUser)

module.exports = adminUserRoutes;