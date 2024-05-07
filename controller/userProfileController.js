const User = require("../models/UserDb")
const Product = require("../models/productData")
const Address = require("../models/userAddressData")
const Order = require("../models/orderData")
const nodemailer = require("nodemailer")
const bcrypt = require("bcryptjs")
const path = require("path")
const imageProcessing = require("../utils/cropedImage")
const fs = require("fs")
const {filedCheker} = require("../utils/authHandler")


const getUserProfile = async (req, res) => {
    try {
        // console.log(req.user);
        
        const userId = req.user._id;

        const userData = await User.findById({ _id: userId })
        // Query user data and populate addresses field
        const addressData = await Address.findOne({ userId: userId })
        
        // Query order data
        const orderData = await Order.find({ userId }).sort({ createdOn: -1 });
        
        // Flash message
        let success = req.flash("edit");

        // Render profile template with user data, address data, order data, and success message
        res.render("profile", { user: userData,userAddress: addressData, order: orderData, success });
    } catch (error) {
        console.log(error.message);
    }
};


const getAddUserProfile = async (req, res) => {  
    try {
        const user = req.user
        let success = req.flash("edit")
        res.render("add-address", { user: user, success})
    } catch (error) {
        console.log(error.message);
    }
}


const postAddress = async (req, res) => {
    try {
        const userId = req.user._id;

        // Extracting fields from req.body
        const {
            username, // Updated user name
            images, // Updated user images
            addressType,
            city,
            landMark,
            state,
            pincode,
            contact,
            altPhone
        } = req.body;

        // Check if any field is missing
        const fields = { addressType,username, city, landMark, state, pincode,contact, altPhone };
        const missingFields = filedCheker(fields);
        if (missingFields.length > 0) {
            const errorMessage = `Missing fields: ${missingFields.join(', ')}`;
            req.flash("edit", errorMessage);
            return res.status(400).redirect("/user/addAddress");
        }

        // Check if any images were uploaded
        const files = req.files;
        if (!files || files.length === 0) {
            req.flash("edit", 'Missing image file');
            return res.status(400).redirect("/user/addAddress");
        }

        // Check if too many images were uploaded
        if (files.length > 4) {
            req.flash("edit", "You can upload a maximum of four images.");
            return res.status(400).redirect("/user/addAddress");
        }

        // Processing images
        const processedImages = await Promise.all(files.map(async (file) => {
            const inputFilePath = file.path;
            const outputFolderPath = './public/cropedImage';

            // Use imageProcessing function for image processing
            return await imageProcessing(inputFilePath, outputFolderPath);
        }));

        // Update user's name and images
        await User.findByIdAndUpdate(userId, { images: processedImages });

        // Find the address document associated with the user
        const userAddress = await Address.findOne({ userId: userId });
        console.log(userAddress);
        if(!userAddress){
            
            const newAddress = new Address({
                userId: userId,
                address: [
                    {
                        addressType,
                        username,
                        city,
                        landMark,
                        state,
                        pincode,
                        contact,
                        altPhone,
                    },
                ]
            })
            await newAddress.save()
            
        req.flash("edit", "User Address Created")
        return res.status(200).redirect("/user/profile");
        }else{
            console.log("scnd");
            userAddress.address.push({
                addressType,
                username,
                city,
                landMark,
                state,
                pincode,
                contact,
                altPhone,
            })
            await userAddress.save()
            req.flash("edit", "User Address updated")
            return res.status(200).redirect("/user/profile");
        }

    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const getEditUserProfile = async (req, res) => {
    try {
        const addressId = req.query.id
        const user = req.user
        const currAddress = await Address.findOne({
            "address._id": addressId,
        });

        const addressData = currAddress.address.find((item) => {
            return item._id.toString() == addressId.toString()
        })
        // console.log(addressData);
        let success = req.flash("edit")
        res.render("edit-address", { address: addressData, user: user, success })
    } catch (error) { 
        console.log(error.message);
    }
}

const editUserProfile = async (req, res) => {
    try {
        const data = req.body;
        const addressId = req.query.id;
        console.log(data.username);
        console.log(addressId, "address id");

        const missingFields = filedCheker(data);
        if (missingFields.length > 0) {
            const errorMessage = `Missing fields: ${missingFields.join(', ')}`;
            req.flash("edit", errorMessage);
            return res.status(400).redirect("/user/addAddress");
        }

        // Find the address by its _id and update it
        await Address.updateOne(
            { "address._id": addressId },
            {
                $set: {
                    "address.$[elem].addressType": data.addressType,
                    "address.$[elem].username": data.username,
                    "address.$[elem].city": data.city,
                    "address.$[elem].landMark": data.landMark,
                    "address.$[elem].state": data.state,
                    "address.$[elem].pincode": data.pincode,
                    "address.$[elem].contact": data.contact,
                    "address.$[elem].altPhone": data.altPhone,
                },
            },
            { arrayFilters: [{ "elem._id": addressId }] }
        );

        req.flash("edit", "Address edited");
        res.redirect("/user/profile");  
    } catch (error) {
        console.log(error.message);
    }
};


const getDeleteAddress = async (req, res) => {
    try {
        const addressId = req.query.id;

        // Find the address to be deleted
        const findAddress = await Address.findOne({ "address._id": addressId });

        if (!findAddress) {
            // If address not found, return an error flash message and redirect
            req.flash("edit", "Address not found");
            return res.redirect("/user/profile");
        }

        // Update the address by pulling the specified addressId
        const deletionResult = await Address.updateOne(
            { "address._id": addressId },
            {
                $pull: {
                    address: {
                        _id: addressId
                    }
                }
            }
        );

        // Check if any document was modified
        if (deletionResult.nModified === 0) {
            // If no documents were modified, return a failure flash message and redirect
            req.flash("edit", "Failed to delete address");
            return res.redirect("/user/profile");
        }

        // If deletion is successful, set a success flash message and redirect to profile page
        req.flash("edit", `${findAddress.name} deleted`);
        res.redirect("/user/profile");
    } catch (error) {
        // Handle any unexpected errors
        console.log(error.message);
        req.flash("edit", "An unexpected error occurred");
        res.redirect("/user/profile");
    }
};

const editUserDetails = async(req,res)=>{
 try {
    const userId = req.query.id
    const {username,contact} = req.body
    console.log(userId,username,contact)
    const fields = { username,contact };
    const missingFields = filedCheker(fields);
    if (missingFields.length > 0) {
        const errorMessage = `Missing fields: ${missingFields.join(', ')}`;
        req.flash("edit", errorMessage);
        return res.status(400).redirect("/user/profile");
    }

    await User.findByIdAndUpdate(userId,{username,contact})
    req.flash("edit", "Username and Phone number updated");
    return res.status(200).redirect("/user/profile");
 } catch (error) {
    console.log(error.message)
    return res.status(500).render("404")
 }
}

const verifyReferalCode = async (req, res) => {
    try {
        const referalCode = req.body.referalCode

        console.log(referalCode)
        const currentUser = await User.findOne({ _id: req.user._id })
        // console.log("currentUser=>>>", currentUser);
        const codeOwner = await User.findOne({ referalCode: referalCode })
        // console.log("codeOwner=>>>", codeOwner);

        if (currentUser.redeemed === true) {
            console.log("You have already redeemed a referral code before!");
            res.json({ message: "You have already redeemed a referral code before!" })
            return
        }

        if (!codeOwner || codeOwner._id.equals(currentUser._id)) {
            console.log("Invalid referral code!");
            res.json({ message: "Invalid referral code!" })
            return
        }

        const alreadyRedeemed = codeOwner.redeemedUsers.includes(currentUser._id)

        if (alreadyRedeemed) {
            console.log("You have already used this referral code!");
            res.json({ message: "You have already used this referral code!" })
            return
        } else {

            await User.updateOne(
                { _id: req.user._id  },
                {
                    $inc: { wallet: 100 },
                    $push: {
                        history: {
                            amount: 100,
                            status: "credit",
                            date: Date.now()
                        }
                    }
                }
            )
                .then(data => console.log("currentUser Wallet = > ", data))

                const newHistory = {
                    amount: 100,
    
                    status: "credit",
                    date: Date.now()
                }
                currentUser.history.push(newHistory)
               await currentUser.save()
            await User.updateOne(
                { _id: codeOwner._id },
                {
                    $inc: { wallet: 200 },
                    $push: {
                        history: {
                            amount: 200,
                            status: "credit",
                            date: Date.now()
                        }
                    }
                }
            )
                .then(data => console.log("codeOwner Wallet = > ", data))
           
                const newHistory2 = {
                    amount: 200,
    
                    status: "credit",
                    date: Date.now()
                }
                codeOwner.history.push(newHistory2)
                await codeOwner.save();
            await User.updateOne(
                { _id: codeOwner._id },
                { $set: { referalCode: "" } }
            )

            await User.updateOne(
                { _id: req.user._id  },
                { $set: { redeemed: true } }
            )

            await User.updateOne(
                { _id: codeOwner._id },
                { $push: { redeemedUsers: currentUser._id } }
            )

            console.log("Referral code redeemed successfully!");

            res.json({ message: "Referral code verified successfully!" })
            return

        }

    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    getUserProfile,
    getAddUserProfile,
    postAddress,
    getEditUserProfile,
    editUserProfile,
    getDeleteAddress,
    editUserDetails,
    verifyReferalCode 
}