const User = require("../models/UserDb")
const Product = require("../models/productData")
const Address = require("../models/userAddressData")
const Order = require("../models/orderData")
const Coupon = require("../models/cuponData")
const mongodb = require("mongodb")
const razorpay = require("razorpay")
const crypto = require("crypto");

let instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


const getCheckoutPage = async (req, res) => {
    try {
      
        console.log("queryyyyyyyy", req.query);
        if (req.query.isSingle == "true") {
            const id = req.query.id
            const findProduct = await Product.find({ id: id }).lean()
            const userId = req.user._id
            const findUser = await User.findOne({ _id: userId })
            const addressData = await Address.findOne({ userId: userId })
            // console.log(addressData)
            console.log("THis is find product =>", findProduct);

            const today = new Date().toISOString(); // Get today's date in ISO format

            const findCoupons = await Coupon.find({
                isList: true,
                createdOn: { $lt: new Date(today) },
                expireOn: { $gt: new Date(today) },
                minimumPrice: { $lt: findProduct[0].price },
            });


            console.log(findCoupons, 'this is coupon ');

            res.render("checkout", { product: findProduct, user: userId, findUser: findUser, userAddress: addressData, isSingle: true, coupons: findCoupons })
        } else {
            const user = req.query.userId
            const findUser = await User.findOne({ _id: user })
            // console.log(findUser);
            const productIds = findUser.cart.map(item => item.productId)
            console.log(productIds)
            // const findProducts = await Product.find({ _id: { $in: productIds } })
            // console.log(findProducts);
            const addressData = await Address.findOne({ userId: user })
            // console.log("THis is find product =>",findProducts);
            const oid = new mongodb.ObjectId(user);
            const data = await User.aggregate([
                { $match: { _id: oid } },
                { $unwind: "$cart" },
                {
                    $project: {
                        proId: { '$toObjectId': '$cart.productId' },
                        quantity: "$cart.stock"
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'proId',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
            ])
            
            console.log("Data  =>>", data)
            // console.log("Data  =>>" , data[0].productDetails[])
            const grandTotal = req.session.grandTotal
            // console.log(grandTotal);
            const today = new Date().toISOString(); // Get today's date in ISO format

            const findCoupons = await Coupon.find({
                isList: true,
                createdOn: { $lt: new Date(today) },
                expireOn: { $gt: new Date(today) },
                minimumPrice: { $lt: grandTotal },
            });

            res.render("checkout", { data: data, user: findUser, isCart: true, userAddress: addressData, isSingle: false, grandTotal, coupons: findCoupons })
        }

    } catch (error) {
        console.log(error.message);
    }
}

const orderPlaced = async (req, res) => {
    try {
        console.log("req.body================>", req.body);
        if (req.body.isSingle === "true") {
            let { totalPrice, addressId, payment, productId} = req.body
            const userId = req.user._id
            console.log(req.session.grandTotal,"from session");
            const grandTotal = req.session.grandTotal
            // console.log(req.body)
            // console.log(totalPrice, addressId, payment, productId);
            const findUser = await User.findOne({ _id: userId })
            // console.log("Find user ===>", findUser);
            const address = await Address.findOne({ userId: userId })
            // console.log(address);
          
            const findAddress = address.address.find(item => item._id.toString() === addressId);
            console.log(findAddress);
            // console.log("Before product search")
            const findProduct = await Product.findOne({ _id: productId })
            // console.log(findProduct);
            
            const productDetails = {
                _id: findProduct._id,
                price: findProduct.salePrice,
                name: findProduct.productName,
                image: findProduct.productImage[0],
                quantity: 1
            }
            // console.log("Before order placed")
            const newOrder = new Order(({
                product: productDetails,
                totalPrice: grandTotal,
                address: findAddress,
                payment: payment,
                userId: userId,
              
                createdOn: Date.now(),
                status: "Confirmed",
            }))

          
            console.log("Order placed")
            findProduct.quantity = findProduct.quantity - 1

            
            let orderDone; 

            if (newOrder.payment == 'cod') {
                console.log('Order Placed with COD');
                await findProduct.save()
                orderDone = await newOrder.save();
                res.json({ payment: true, method: "cod", order: orderDone, quantity: 1, orderId: userId });
            } else if (newOrder.payment == 'online') {
                console.log('order placed by Razorpay');
                orderDone = await newOrder.save();
                const generatedOrder = await generateOrderRazorpay(orderDone._id, orderDone.totalPrice);
                console.log(generatedOrder, "order generated");
                await findProduct.save()
                res.json({ payment: false, method: "online", razorpayOrder: generatedOrder, order: orderDone, orderId: orderDone._id, quantity: 1 });
            }   

        } else {

            console.log("from cart");

            const { totalPrice, addressId, payment } = req.body
            // console.log(totalPrice, addressId, payment);
            console.log("offer is", offer)
            const userId = req.user._id.toString();
            console.log(userId,0)
            const findUser = await User.findOne({ _id: userId })
            // console.log(findUser)
            const productIds = await findUser.cart.map(item => item.productId)
           
            console.log(productIds,1)
            //  const addres= await Address.find({userId:userId  })

            const findAddress = await Address.findOne({ 'address._id': addressId });

            if (findAddress) {
                const desiredAddress = await findAddress.address.find(item => item._id.toString() === addressId.toString());
                // console.log(desiredAddress);
           
                console.log(productIds,3)

                const findProducts = await Product.find({ _id: { $in: productIds } })


                const cartItemQuantities = await findUser.cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.stock
                }))

                const orderedProducts = await findProducts.map((item) => ({
                    _id: item._id,
                    price: item.price,
                    name: item.name,

                    image: item.images[0],
                    quantity: cartItemQuantities.find(cartItem => cartItem.productId.toString() === item._id.toString()).quantity
                }))
             
                console.log(orderedProducts,2)

                let  grandTotal = req.body.totalPrice

                console.log(grandTotal)

                

                const newOrder = new Order({
                    product: orderedProducts,
                    totalPrice: grandTotal,
                    address: desiredAddress,
                    payment: payment,
                    userId: userId,
                    
                    status: "Confirmed",
                    createdOn: Date.now()

                })
                

                await User.updateOne(
                    { _id: userId },
                    { $set: { cart: [] } }
                );


                // console.log('thsi is new order',newOrder);   

                for (let i = 0; i < orderedProducts.length; i++) {

                    const product = await Product.findOne({ _id: orderedProducts[i]._id });
                    if (product) {
                        const newQuantity = +product.stock - +orderedProducts[i].quantity;
                        console.log(newQuantity,5)
                        product.stock = Math.max(newQuantity, 0);
                        await product.save();
                    }
                        
                }
                
                let orderDone
                if (newOrder.payment == 'cod') {
                    console.log('order placed by cod');
                    orderDone = await newOrder.save();
                    res.json({ payment: true, method: "cod", order: orderDone, quantity: cartItemQuantities, orderId: findUser });
                } else if (newOrder.payment == 'online') {
                    console.log('order placed by Razorpay');
                    orderDone = await newOrder.save();
                    const generatedOrder = await generateOrderRazorpay(orderDone._id, orderDone.totalPrice);
                    console.log(generatedOrder, "order generated");
                    res.json({ payment: false, method: "online", razorpayOrder: generatedOrder, order: orderDone, orderId: orderDone._id, quantity: cartItemQuantities });
                } else if (newOrder.payment == "wallet") {
                    if (newOrder.totalPrice <= findUser.wallet) {
                        console.log("order placed with Wallet");
                        const data = findUser.wallet -= newOrder.totalPrice
                        const newHistory = {
                            amount: data,
                            status: "debit",
                            date: Date.now()
                        }
                        findUser.history.push(newHistory)
                        await findUser.save()

                        orderDone = await newOrder.save();

                        res.json({ payment: true, method: "wallet", order: orderDone, orderId: orderDone._id, quantity: cartItemQuantities, success: true })
                        return;
                    } else {
                        console.log("wallet amount is lesser than total amount");
                        res.json({ payment: false, method: "wallet", success: false });
                        return
                    }
                }

            } else {
                console.log('Address not found');
            }
        }
    } catch (error) {
        console.log(error);
    }
}

const generateOrderRazorpay = (orderId, total) => {
    return new Promise((resolve, reject) => {
        const options = {
            amount: total * 100,
            currency: "INR",
            receipt: String(orderId)
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.log("failed");
                console.log(err);
                reject(err);
            } else {
                console.log("Order Generated RazorPAY: " + JSON.stringify(order));
                resolve(order);
            }
        });
    })
}

const verify = (req, res) => {
    console.log(req.body,"end");
    let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(
        `${req.body.payment.razorpay_order_id}|${req.body.payment.razorpay_payment_id}`
    );
    hmac = hmac.digest("hex");
    // console.log(hmac,"HMAC");
    // console.log(req.body.payment.razorpay_signature,"signature");
    if (hmac === req.body.payment.razorpay_signature) {
        console.log("true");
        res.json({ status: true });
    } else {
        console.log("false");
        res.json({ status: false });
    }
};


const getOrderDetailsPage = async (req, res) => {
    try {
        const userId = req.user._id
        const orderId = req.query.id
        const findOrder = await Order.findOne({ _id: orderId })
        const findUser = await User.findOne({ _id: userId })
        console.log(findOrder,2);
        res.render("orderDetails", { orders: findOrder, user: findUser, orderId })
    } catch (error) {
        console.log(error.message);
    }
}

const getOrderListPageAdmin = async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdOn: -1 });

        // console.log(req.query);

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("orders-list", { orders: currentOrder, totalPages, currentPage })
    } catch (error) {
        console.log(error.message);
    }
}


const getOrderDetailsPageAdmin = async (req, res) => {
    try {
        const orderId = req.query.id
        // console.log(orderId);
        const findOrder = await Order.findOne({ _id: orderId }).sort({ createdOn: 1 })
        // console.log(findOrder);


        res.render("order-details-admin", { orders: findOrder, orderId })
    } catch (error) {
        console.log(error.message);
    }
}

const changeOrderStatus = async (req, res) => {
    try {
        console.log(req.query);


        const orderId = req.query.orderId
        console.log(orderId);

        await Order.updateOne({ _id: orderId },
            { status: req.query.status }
        ).then((data) => console.log(data))

        // const findOrder = await Order.findOne({ _id: orderId })

        // console.log(findOrder,"order......................");

        res.redirect('/admin/orderList');

    } catch (error) {
        console.log(error.message);
    }
}

const cancelOrder = async (req, res) => {
    try {
        console.log("im here");
        const userId = req.user._id
        const findUser = await User.findOne({ _id: userId })

        console.log(findUser)

        if (!findUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const orderId = req.query.orderId
        console.log(orderId);

        await Order.updateOne({ _id: orderId },
            { status: "Canceled" } 
        ).then((data) => console.log(data))

        const findOrder = await Order.findOne({ _id: orderId })

        if ( findOrder.payment === "wallet" ||findOrder.payment === "online") {
            
            findUser.wallet += findOrder.totalPrice

            const newHistory = {
                amount: findOrder.totalPrice,
                status: "credit",
                date: Date.now()
            }
            findUser.history.push(newHistory)
            await findUser.save();
        }

        // console.log(findOrder);

        for (const productData of findOrder.product) {
            const productId = productData.ProductId;
            const quantity = productData.quantity;

            const product = await Product.findById(productId);

            // console.log(product, "=>>>>>>>>>");

            if (product) {
                product.stock += quantity;
                await product.save();
            }
        }

        res.redirect('/user/profile');

    } catch (error) {
        console.log(error.message);
    }
}


const cancelProduct = async (req, res) => {
    try {
        console.log("im here");
        const userId = req.user._id
        const findUser = await User.findOne({ _id: userId })

        // console.log(findUser)

        if (!findUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        const orderId = req.query.orderId;
        const productId = req.query.productId;
        
        // console.log("Product ID:", productId);
        // console.log("Order ID:", orderId);
        
        // Fetch the order by its ID
        const order = await Order.findById(orderId);
        
        if (!order) {
            console.log("Order not found");
            return; // Exit early if the order is not found
        }
        
       

const productIdObj = new mongodb.ObjectId(productId);

const product = order.product.find(product => product._id.equals(productIdObj));
console.log(product)

// Find the index of the product with the given ID in the order's products array
const productIndex = order.product.findIndex(product => product._id.equals(productIdObj));
if (productIndex === -1) {
    console.log("Product not found in the order");
    return; // Exit early if the product is not found in the order
}

// Remove the product from the products array using splice
order.product.splice(productIndex, 1);

// console.log("Order:", order);

        const findOrder = await Order.findOne({ _id: orderId })

        if ( findOrder.payment === "wallet" ||findOrder.payment === "online") {
            
          
            const newTotal = findOrder.totalPrice - (product.price * product.quantity);
            findOrder.totalPrice = newTotal;
            
            findUser.wallet += product.price * product.quantity
            
            const newHistory = {
                amount: findOrder.totalPrice,

                status: "credit",
                date: Date.now()
            }
            findUser.history.push(newHistory)
            await findUser.save();
            await findOrder.save()
        }

        // console.log(findOrder);

        for (const productData of findOrder.product) {
            const productId = productData.ProductId;
            const quantity = productData.quantity;

            const product = await Product.findById(productId);

            // console.log(product, "=>>>>>>>>>");

            if (product) {
                product.stock += quantity;
                await product.save();
            }
        }
      
await order.save();   
console.log("Product removed successfully");


        // Redirect to '/user/orderDetails' with the order ID as a query parameter
        res.redirect(`/user/orderDetails?id=${orderId}`);
        

    } catch (error) {
        console.log(error.message);
    }
}

const returnOrder = async (req, res) => {
    try {

        const userId = req.user._id
        const findUser = await User.findOne({ _id: userId })

        if (!findUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const id = req.query.id
        await Order.updateOne({ _id: id },
            { status: "Returned" }
        ).then((data) => console.log(data)) 

        const findOrder = await Order.findOne({ _id: id })



        if (findOrder.payment === "wallet" || findOrder.payment === "online") {
            findUser.wallet += findOrder.totalPrice;

            const newHistory = {
                amount: findOrder.totalPrice,
                status: "credit",
                date: Date.now()
            }
            findUser.history.push(newHistory)
            await findUser.save();
        }

        for (const productData of findOrder.product) {
            const productId = productData.ProductId;
            const quantity = productData.quantity;

            const product = await Product.findById(productId);

            // console.log(product,"=>>>>>>>>>");

            if (product) {
                product.stock += quantity;
                await product.save();
            }
        }

        res.redirect('/user/profile');

    } catch (error) {
        console.log(error.message);
    }
}

const getInvoice = async (req, res) => {
    try {
        console.log("helloooo");
        await invoice.invoice(req, res);
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    getCheckoutPage,
    orderPlaced,
    verify,
    getOrderDetailsPage,
    getOrderListPageAdmin,
    getOrderDetailsPageAdmin,
    changeOrderStatus,
    cancelOrder,
    returnOrder,
    cancelProduct,
    getInvoice
}