
const User = require("../models/UserDb")


const userList = async (req, res) => { 
    let perpage = 10;
  let page = req.query.page || 1;
  try {
      const count = await User.countDocuments(); // Use countDocuments() instead of count()
      const userData = await User.aggregate([
          { $sort: {  name: 1 } }
      ])
      .skip(perpage * (page - 1))
      .limit(perpage)
      .exec();
      const success = req.flash('edit');
      return res.status(200).render("customer", { success: success,
           cat: userData,
           current: page,
           user: userData,
           pages: Math.ceil(count / perpage)
          });
     
  } catch (error) {
      console.log(error.message);
      res.status(500).render("404");
  }
}; 


const getListUser = async (req, res) => {
    try {
        let id = req.query.id
      
        let cat = await User.findById({_id: id})
        await  User.updateOne({ _id: id }, { $set: { isBlocked: false } })
        req.flash("edit",`Unisted Customer : ${cat.username} `)
        res.status(200).redirect('/admin/customer/view')
    } catch (error) {

        console.log(error.message);
        res.status(500).render("404")
    }
}


const getUnlistUser = async (req, res) => {
    try {
        let id = req.query.id
     console.log(2);
        let cat = await User.findById({_id: id})
        await User.findByIdAndUpdate({ _id: id }, { $set: { isBlocked: true } })
        req.flash("edit",`listed Customer : ${cat.username} `)
        res.status(200).redirect('/admin/customer/view');
    } catch (error) {
        console.log(error.message);
        res.status(500).render("404")
    }
}


const searchUser = async (req, res) => {
    try {
        let { searchName } = req.body;
        console.log(searchName);

        const searchNoSpecialChar = searchName.replace(/[^a-zA-Z0-9 ]/g, "");
        const user = await User.find({
            $or: [{ username: { $regex: new RegExp(searchNoSpecialChar, "i") } }],
        });

        if (user) {
            const success = req.flash('edit');
            return res.status(200).render("customer-s", { success: success, user: user });
        } else {
            console.log("No users found matching the search criteria");
            req.flash("edit", "No matched users found");
            return res.status(200).redirect("/admin/customer/view");
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).render("404");
    }
};


module.exports = {
    userList,
    searchUser,
    getListUser,
    getUnlistUser
}