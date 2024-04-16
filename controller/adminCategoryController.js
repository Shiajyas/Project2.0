const Category = require('../models/categoryData');
const asyncHandler = require("express-async-handler")
const mongoose = require("mongoose");
const Product = require("../models/productData")
const {filedCheker} = require("../utils/authHandler")
const fs = require("fs")
const path = require("path")
const imageProcessing = require("../utils/cropedImage")

const getCategory = async (req, res) => { 
      let perpage = 10;
    let page = req.query.page || 1;
    try {
        const count = await Category.countDocuments(); // Use countDocuments() instead of count()
        const categoryData = await Category.aggregate([
            { $sort: {  name: 1 } }
        ])
        .skip(perpage * (page - 1))
        .limit(perpage)
        .exec();

      
        const success = req.flash('edit');
        return res.status(200).render("categories", { success: success,
             cat: categoryData,
             current: page,
             category: categoryData,
             pages: Math.ceil(count / perpage)
            });
       
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404");
    }
}; 




const addCategorie =  async (req, res) => {
    console.log("helo");
    const {name,slug,parent,description} = req.body
 if(!req.body){
    console.log("no");
 }
 console.log(req.body);
    // Check for a valid category name
    if (!filedCheker({name,slug,parent,description})) {
      req.flash("edit", `Unsuccessful Add category. Please provide a valid category name.`);
      return res.status(400).redirect("/admin/categories/view");
    }
  
    try {  
      const newCategory = new Category({name,slug,parent,description});
      const savedCategory = await newCategory.save();
  console.log(savedCategory);

      req.flash('edit', `Category "${name}" added successfully`);
      res.redirect('/admin/categories/view');

    } catch (error) {
        if (error.name === 'ValidationError') {
            // Extract the validation error message
            const validationErrorMessage = error.message.split(': ')[2];
            req.flash('edit', `Not Added!! Name ${validationErrorMessage}`);
        } else {
            req.flash('edit', 'An error occurred while adding the category.');
        }
        res.redirect('/admin/categories/view');
    }

} 
  
const getListCategory = async (req, res) => {
    try {
        let id = req.query.id
        console.log(`getlist id acptd`);
        let cat = await Category.findById({_id: id})
        await Category.updateOne({ _id: id }, { $set: { isListed: false } })
        req.flash("edit",`Unisted Category : ${cat.name} `)
        res.status(200).redirect('/admin/categories/view')
    } catch (error) {

        console.log(error.message);
        res.status(500).render("404")
    }
}


const getUnlistCategory = async (req, res) => {
    try {
        let id = req.query.id
        console.log(id);
        console.log(`getlist id acptd`);
        let cat = await Category.findById({_id: id})
        await Category.findByIdAndUpdate({ _id: id }, { $set: { isListed: true } })
        req.flash("edit",`Listed Category : ${cat.name} `)
        res.status(200).redirect('/admin/categories/view');
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404")
    }
}

const getEditCategory = async (req, res) => {
    try {
        const id = req.query.id
        const category = await Category.findOne({ _id: id })
        res.status(200).render("edit-category", { category: category })
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404")
    }
}


const editCategory = async (req, res) => {
    try {
        const id = req.params.id
        console.log(id);
        const { name,slug,parent,description } = req.body
        const findCategory = await Category.find({ _id: id })
        if (findCategory) {
            await Category.updateOne(
                { _id: id },
                {
                    name: name,
                    slug: slug,
                    parent: parent,
                    description: description
                })
                req.flash("edit",`${name} Edited`)
            res.redirect("/admin/categories/view")
        } else {
            console.log("Category not found");
            req.flash("edit",`${name} Editing failed`)
            res.status(404).redirect("/admin/categories/view")
        }

    } catch (error) {
        console.log(error.message);
        res.status(500).render("404")
    }
}

const deleteCategory = async (req, res) => {
    try {
        let id = req.query.id;
        const cat = await Category.findOne({ _id: id });

        console.log(cat);

        if (cat) {
            await Category.findByIdAndDelete({ _id: id });
            req.flash("edit", `${cat.name} deleted`);
            res.status(200).redirect("/admin/categories/view");
        } else {
            console.log("Category not found");
            req.flash("edit", `Category not found`);
            res.status(404).redirect("/admin/categories/view");
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404");
    }
};

const searchCategory = async (req, res) => {
    try {
      let {searchTerm} = req.body
      console.log(searchTerm);
      const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");
      const category = await Category.find({
        $or: [{ name: { $regex: new RegExp(searchNoSpecialChar, "i") } }],
      });
      console.log(category);
     if(category){
        return res.status(200).render("categorey-s",{success:[],cat: category})
     }else{
        console.log("Category not found");
       
        req.flash("edit","No Matched categories")
        return  res.status(200).redirect("/admin/categories/view");
      
      
     }
    } catch (error) {
   
      console.log(error.message);
      res.status(500).render("404")
    }

  };
  
      
module.exports = {
    getCategory,
    addCategorie,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,
    deleteCategory,
    searchCategory

}