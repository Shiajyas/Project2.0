
const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: async function(name) {
                const category = await this.constructor.findOne({ name });
                return !category;
            },
            message: props => `${props.value} already exists!`
        },
        set: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    color:{
        type: String,
        required: true
    },
    size:{
        type: String,
        required: true
    },
    rate:{
        type: String,
        required: true
    },
    brand:{
        type: String,
        required: true
    },
    description: { 
        type: String,
        required: true
    },
     richdescription: { 
        type: String 
    },
    price: { type: Number,
         required: true
         },
    status: {
         type: String, 
          required: true 
        },
    tags: { 
        type: [String]
     },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required:true
    },
    images: { 
        type: Array
    }, // Assuming you store image paths
    isListed:{
    type: Boolean,
    default: true
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    
})

productSchema.pre('save', async function(next) {
    if (!this.id) {
        let idExists = true;
        let newId;
        while (idExists) {
            newId = Math.floor(Math.random() * 1000).toString().substring(0, 3);
            idExists = await this.constructor.exists({ id: newId });
        }
        this.id = newId;
    }
    next();
});

  

const Product = mongoose.model('Product', productSchema);

module.exports = Product  
    

