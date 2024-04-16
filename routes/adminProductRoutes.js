
const express = require("express")
const {upload} = require("../utils/imageUploader");
const adminProductRoutes = express.Router()

const {
    adminProtectRules,
    adminRestrict 
  } = require("../controller/adminAuthController")

const {
    getAddProduct, 
    addProduct ,
    getListProduct,
    blockProduct,
    unBlockCProduct,
    deleteProduct,
    searchProduct,
    getEditProduct
} = require("../controller/adminProductController")


adminProductRoutes.get("/add",adminProtectRules,adminRestrict("admin"),getAddProduct)
adminProductRoutes.post("/add",adminProtectRules,adminRestrict("admin"), upload.array("images", 4),addProduct) 
adminProductRoutes.get("/list",adminProtectRules,adminRestrict("admin"),getListProduct)
adminProductRoutes.get("/block",adminProtectRules,adminRestrict("admin"),blockProduct)
adminProductRoutes.get("/unblock",adminProtectRules,adminRestrict("admin"),unBlockCProduct)
adminProductRoutes.get("/delete",adminProtectRules,adminRestrict("admin"),deleteProduct)
adminProductRoutes.post("/search",adminProtectRules,adminRestrict("admin"),searchProduct)
adminProductRoutes.get("/edit",adminProtectRules,adminRestrict("admin"),getEditProduct)

module.exports = adminProductRoutes