
const Product = require("../models/productData")
const Category = require("../models/categoryData")
const path = require("path")
const imageProcessing = require("../utils/cropedImage")
const fs = require("fs")


const getAddProduct = async (req,res)=>{
    try {
        // Fetch categories from the database
        const categories = await Category.find({});
    //    console.log(categories);
        let success = req.flash("edit")
      
        return res.status(200).render("productAdd", { 
          Categories: categories,
          success,
          Product: {}, // Provide an empty Product object if needed
        }); 
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .json({ success: false, error: "Internal Server Error" });
      }
}

const addProduct = async (req, res) => {
  try {
    if (!req.body.CategoryId) {
        console.log("Invalid CategoryId"); 
        req.flash("edit", 'Invalid Category');
        return res.status(400).redirect("/admin/product/add");
    }
    const category = await Category.findById(req.body.CategoryId);
    console.log(category);
    if (!category) {
        console.log("Invalid Category");
        req.flash("edit", 'Invalid Category');
        return res.status(400).redirect("/admin/product/add");
    }
    const { name, color, size, rate, brand, description, richdescription, price, status, CategoryId, images } = req.body;
   
    if(!name){
        req.flash("edit", 'Missing Product Title');
        return res.status(400).redirect("/admin/product/add");
    }
    const files = req.files;
    if (!files || files.length === 0) {
        req.flash("edit", 'Missing image file');
        return res.status(400).redirect("/admin/product/add");;
    }   

    const processedImages = await Promise.all(files.map(async (file) => {
        const inputFilePath = file.path;
        const outputFolderPath = './public/cropedImage';

        // Use imageProcessing function for image processing
        return await imageProcessing(inputFilePath, outputFolderPath);
    }));

    const newProduct = new Product({
        name,
        color,
        size,
        brand,
        description,
         richdescription, 
         rate,
         price, 
         status, 
         category: CategoryId,
         images: processedImages

    })
    console.log(newProduct);

    const savedProduct = await newProduct.save();
console.log("saved:", savedProduct);
    
  if (!savedProduct) {
    console.log("Product update failed");
    req.flash("edit", 'Product upload failed');
    return res.status(500).redirect("/admin/product/add");
}

console.log("Product update done");
req.flash("edit", "Product upload successful");
return res.status(200).redirect("/admin/product/add");
  } catch (error) {
    if (error.name === 'ValidationError') {
        console.log(error);
        // Extract the validation error message
        const validationErrorMessage = error.message.split(': ')[2];
        req.flash('edit', `Not uploded Name ${validationErrorMessage}`);
    } else {
        req.flash('edit', 'An error occurred while adding the category.');
    }
    res.redirect('/admin/product/add');
}
  }

const getListProduct =  async (req, res) => { 
    let perpage = 10;
  let page = req.query.page || 1;
  try {
      const count = await Product.countDocuments(); // Use countDocuments() instead of count()
      const productData = await Product.aggregate([
          { $sort: {  name: 1 } }
      ])
      .skip(perpage * (page - 1))
      .limit(perpage)
      .exec();
      const success = req.flash('edit');
      return res.status(200).render("adminProductList", { success: success,
           cat: productData,
           current: page,
           product: productData,
           pages: Math.ceil(count / perpage)
          });
     
  } catch (error) {
      console.log(error.message);
      res.status(500).render("404");
  }
}; 

const blockProduct = async (req, res) => {
    try {
        let id = req.query.id
        console.log(`getlist id acptd`);
        let cat = await Product.findById({_id: id})
        await Product.updateOne({ _id: id }, { $set: { isListed: false } })
        req.flash("edit",`Unisted Category : ${cat.name} `)
        res.status(200).redirect('/admin/product/list')
    } catch (error) {

        console.log(error.message);
        res.status(500).render("404")
    }
}


const unBlockCProduct = async (req, res) => {
    try {
        let id = req.query.id
        console.log(id);
        console.log(`getlist id acptd`);
        let cat = await Product.findById({_id: id})
        await Product.findByIdAndUpdate({ _id: id }, { $set: { isListed: true } })
        req.flash("edit",`Listed Category : ${cat.name} `)
        res.status(200).redirect('/admin/product/list');
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404")
    }
}

const deleteProduct = async(req,res)=>{
    try {
        let id = req.query.id
        console.log(id);
        console.log(`getlist id acptd`);
        let cat = await Product.findById({_id: id})
        await Product.findByIdAndDelete({ _id: id }, { $set: { isListed: true } })
        req.flash("edit",`Listed Category : ${cat.name} `)
        res.status(200).redirect('/admin/product/list');
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404")
    }
}

const searchProduct = async (req, res) => {
    try {
        let { searchTerm } = req.body;
        console.log(searchTerm);
        
        // Check if searchTerm exists and is a string
        if (searchTerm && typeof searchTerm === 'string') {
            const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");
            const category = await Product.find({
                $or: [{ name: { $regex: new RegExp(searchNoSpecialChar, "i") } }],
            });
            if (category.length > 0) { // Check if category array is not empty
                const success = req.flash('edit');
                return res.status(200).render("adminProductList-s", { success: success, cat: category });
            } else {
                console.log("Category not found");
                req.flash("edit", "No Matched categories");
                return res.status(200).redirect("/admin/product/list");
            }
        } else {
            console.log("Invalid search term");
            req.flash("edit", "Invalid search term");
            return res.status(400).redirect("/admin/product/list");
        }
    } catch (error) {
        console.log(error);
        res.status(500).render("404");
    }
};

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id
        const categories = await Category.find({})
        const products = await Product.findOne({ _id: id })
        let success = req.flash("edit")
        res.status(200).render("edit-Product", {
             product : products,
             categories: categories,
            success,
            
             })
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404")
    }
}  


module.exports = {
    getAddProduct,
    addProduct,
    getListProduct,
    blockProduct,
    unBlockCProduct,
    deleteProduct,
    searchProduct,
    getEditProduct
}