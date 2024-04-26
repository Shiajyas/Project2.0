const User = require("../models/UserDb")
const Product = require("../models/productData")
const mongodb = require("mongodb")


const getCartPage = async (req, res) => {
    try {
        const id = req.user._id
        // console.log(id);
        // console.log("cart is workding");
        const user = await User.findOne({ _id: id })
        const productIds = user.cart.map(item => item.producId)
        // console.log(productIds);
        const products = await Product.find({ _id: { $in: productIds } })
        // console.log(user.cart[0].quantity); 
        
        const oid = new mongodb.ObjectId(id);
        let data = await User.aggregate([
            {$match:{_id:oid}},
            {$unwind:'$cart'},
            {$project:{
                proId:{'$toObjectId':'$cart.productId'},
                stock:'$cart.stock',
            }},
            {$lookup:{
                from:'products',
                localField:'proId', 
                foreignField:'_id',
                as:'productDetails',
            }},

        ])
        console.log("Data  =>>" , data)

       
        let quantity = 0

        for (const i of user.cart) {
            quantity += i.stock
        }
        // console.log(user.cart.length,'this is cart lenght')
        // console.log(products)
        var grandTotal = 0;
        for(let i=0;i<data.length;i++){
            console.log("sale prices ==>" , data[i].productDetails[0].price)
            console.log("Quantity ==>" ,data[i].stock )
           
             
                grandTotal += data[i].productDetails[0].price * data[i].stock;
                // console.log(grandTotal,'hsihishi ',i)
            
           
            req.session.grandTotal = grandTotal
        }
     

        res.render("cart", { 
            user,
            quantity,
            data,
            grandTotal
        })

    } catch (error) {
        console.log(error.message);
    }
}


const addToCart = async (req, res) => {
    try {
        const id = req.query.id
        // console.log(id);
        const userId = req.user._id
        const findUser = await User.findById(userId)
        // console.log(findUser);
        const product = await Product.findById({ _id: id }).lean()
        if (!product) {
            return res.json({ status: "Product not found" });
        }
        if (product.stock > 0) {
            const cartIndex = findUser.cart.findIndex(item => item.productId == id)
            // console.log(cartIndex, "cartIndex");
            if (cartIndex == -1) {
                // console.log("this");
                let stock = parseInt(req.body.stock)
                await User.findByIdAndUpdate(userId, {
                    $addToSet: {
                        cart: {
                            productId: id,
                            stock: stock,
                            
                        }
                    }
                })
                    .then((data) =>
                        res.json({ status: true }))
            } else {

                // console.log("hi");
                const productInCart = findUser.cart[cartIndex]
                // console.log(productInCart);
                if(productInCart.stock < product.stock){
                    const newQuantity = parseInt(productInCart.stock) + parseInt(req.body.stock)
                    await User.updateOne(
                        { _id: userId, "cart.productId": id },
                        { $set: { "cart.$.stock": newQuantity } }
                    );
                    res.json({ status: true })
                }else{
                    // console.log("Poda");
                    res.json({ status: "Out of stock" })
                }
                // console.log(productInCart, "product", newQuantity);
               
               
            }
        } else {
            res.json({ status: "Out of stock" })
        }


    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    getCartPage,
    addToCart
}