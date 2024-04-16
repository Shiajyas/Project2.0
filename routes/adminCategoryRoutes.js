const express = require("express")
const adminCategoryRoutes = express.Router()
const {upload} = require("../utils/imageUploader")
const  { 
    getCategory,
    addCategorie,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,
    deleteCategory,
    searchCategory
    } = require("../controller/adminCategoryController")

    const {
        adminProtectRules,
        adminRestrict 
      } = require("../controller/adminAuthController")


      adminCategoryRoutes.get("/view",adminProtectRules,adminRestrict("admin"),getCategory) 
      adminCategoryRoutes.post("/add",adminProtectRules,adminRestrict("admin"),addCategorie) 
      adminCategoryRoutes.get("/unlist",adminProtectRules,adminRestrict("admin"),getListCategory) 
      adminCategoryRoutes.get("/list",adminProtectRules,adminRestrict("admin"),getUnlistCategory)
      adminCategoryRoutes.get("/edit",adminProtectRules,adminRestrict("admin"),getEditCategory)
      adminCategoryRoutes.post("/edit",adminProtectRules,adminRestrict("admin"),editCategory) 
      adminCategoryRoutes.get("/remove",adminProtectRules,adminRestrict("admin"),deleteCategory) 
      adminCategoryRoutes.post("/search",adminProtectRules,adminRestrict("admin"),searchCategory)
      
module.exports = adminCategoryRoutes;