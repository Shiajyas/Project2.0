const User = require("../models/UserDb")
const Product = require("../models/productData");


const getWishlistPage = async (req, res) => {
    try {
        const userId = req.user._id
        console.log(userId);
        const findUser = await User.findOne({ _id: userId })
        // console.log(findUser.wishlist, "user");
        
        res.render("wishlist", {data : findUser.wishlist, user : userId})
    } catch (error) {
        console.log(error.message);
    }
}


const addToWishlist = async (req, res) => {
    try {
        // console.log(req.user._id)
        if (!req.user) {
            console.log("User not found")
            res.json({ error: "User not found", status: false })
        }
        const productId = req.body.productId
        // console.log(productId,1);
        const findProduct = await Product.findOne({ _id: productId })

        // console.log(findProduct,2);
        await User.updateOne(
            {
                _id: req.user._id,
            },
            {
                $addToSet: {
                    wishlist: {
                        productId: productId,
                        image: findProduct.images[0],
                        productName: findProduct.name,
                        category: findProduct.category,
                        salePrice: findProduct.price,
                        brand: findProduct.brand,
                        units : findProduct.stock
                    }
                }
            }
        )
        .then(data => console.log(data))

        res.json({ status: true })


    } catch (error) {
        console.log(error.message);
    }
}


const deleteItemWishlist = async (req, res)=>{
    try {
        // console.log(req.query);
        const id = req.query.id
        await User.updateOne(
            { _id: req.user._id },
            {
                $pull: {
                    wishlist: { productId: id }
                }
            }
        )
        .then((data)=>console.log(data))
        res.redirect("/user/wishlist")
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    getWishlistPage,
    addToWishlist,
    deleteItemWishlist 
}