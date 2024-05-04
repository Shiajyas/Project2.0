const Mongoose = require('mongoose');

const addressSchema = Mongoose.Schema({
    userId: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    address: [{
        addressType: {
            type: String,
            required: true
        },
        username: {
            type: String,
            // required: true
        },
        city: {
            type: String,
            required: true 
        },
        landMark: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        }, 
        pincode: {
            type: Number,
            required: true
        },
        contact:{
            type: Number,
        },
        altPhone: {
            type: Number,
            required: true
        }
    }]
})

const address = Mongoose.model('address', addressSchema);

module.exports = address;