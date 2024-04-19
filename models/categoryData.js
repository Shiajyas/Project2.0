const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  
    isListed:{
    type: Boolean,
       default: true
    },
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
    description:{
        type: String,
        required: true
    }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
