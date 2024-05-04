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
        // console.log("Data  =>>" , data)

       
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

const changeQuantity = async (req, res) => {
    try {
        // console.log('herere--------');
        const id = req.body.productId
        const user = req.user
        const count = req.body.count

        // console.log(user);
        // console.log(id, "productId");

        const findUser = await User.findOne({ _id: user })
        // console.log(findUser);
        const findProduct = await Product.findOne({ _id: id })


        if (findUser) {

            // console.log('iam here--');
            const productExistinCart = findUser.cart.find(item => item.productId === id)
            // console.log(productExistinCart, 'this is product in cart');
            let newQuantity
            if (productExistinCart) {
                // console.log('iam in the carrt');
                console.log(count);
                if (count == 1) {
                    // console.log("count + 1");
                    newQuantity = productExistinCart.stock + 1
                } else if (count == -1) {
                    // console.log("count - 1");
                    newQuantity = productExistinCart.stock - 1
                } else {
                    // console.log("errrrrrrrr");
                    return res.status(400).json({ status: false, error: "Invalid count" })
                }
            } else {
                // console.log('hhihihihihihi../');
            }
         
            console.log(newQuantity, 'this id new Quantity');
            if (newQuantity > 0 && newQuantity <= findProduct.stock) {
                let quantityUpdated = await User.updateOne(
                    { _id: user, "cart.productId": id },
                    {
                        $set: {
                            "cart.$.stock": newQuantity
                        }
                    }
                )
                const totalAmount = findProduct.salePrice


                // console.log(totalAmount,"totsll");
                if (quantityUpdated) {
                    // console.log('iam here inside the cart', quantityUpdated, 'ok');

                    res.json({ status: true, quantityInput: newQuantity,count:count, totalAmount: totalAmount })
                } else {
                    res.json({ status: false, error: 'cart quantity is less' });

                }
            } else {
                res.json({ status: false, error: 'out of stock' });
            }
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: false, error: "Server error" });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const id = req.query.id
        console.log(id, "id");
        const userId = req.user
        const user = await User.findById(userId)
        const cartIndex = user.cart.findIndex(item => item.productId == id)
        user.cart.splice(cartIndex, 1)
        await user.save()
        console.log("item deleted from cart");
        res.redirect("/user/cart")
    } catch (error) {
        console.log('thsi is aeroor ',error);
    }
}

module.exports = {
    getCartPage,
    addToCart,
    changeQuantity,
    deleteProduct
}