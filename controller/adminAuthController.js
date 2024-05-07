const Admin = require("../models/adminData")
const {validatingRules,signToken} = require("../utils/authHandler")
const asyncHandler = require("express-async-handler")
const { validationResult } = require("express-validator")
const jwt = require("jsonwebtoken")
const util = require("util");
const Order = require("../models/orderData")
const Coupon = require("../models/cuponData")
const moment = require('moment');
const ExcelJS = require("exceljs")
const PDFDocument = require('pdfkit')


const adminlogin = (req,res)=>{
  const error = req.flash('error'); // Retrieve flash messages
    res.status(200).render("adminLogin",{ error })
}

const adminSignUp = (req,res)=>{
    res.status(200).render("adminSignup",{ error: [], successMsg: '' })
}


const adminSignupPost = [
    validatingRules,
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
  
      if (!errors.isEmpty()) {
        let errorMsg = errors.array().map((err)=>err.msg)
     
        return res.status(401).render("adminSignup",{ error: [errorMsg], successMsg: "" })
    
      } else {
        console.log("in");
        const { username, email,phoneNo, password, cpassword } = req.body;
        console.log(password);
        console.log(cpassword);
        
        try {
          const newAdmin = await Admin.create({ username, email,phoneNo, password, cpassword });
          const token = signToken(newAdmin._id);
  
          console.log(newAdmin); 
          console.log(token);
          req.flash("error", "Signup success")
          return res.status(200).redirect("/admin/login")
        } catch (error) {
          console.error(error);
  
          if (error.name === 'ValidationError' && error.errors.email === 'unique') {
            return res.status(500).render("adminSignup",{ error: ['Server error'], successMsg: '' })
          } else {
            return res.status(401).render("adminSignup",{ error: ['Server error'], successMsg: '' })
          }
        }
      }
    })
  ];


  const adminLoginPost = asyncHandler(async (req, res) => {

    const { email, password } = req.body;
  
    if (!email || !password) {
     req.flash("error","Please provide email and password")
      return res.status(400).redirect("/admin/login")
    }
   
    try {
      const newUser = await Admin.findOne({ email }).select("+password");
  
      if (!newUser) {
        req.flash("error","Invalid email or password")
        return res.status(401).redirect("/admin/login")
      }
      const isPasswordMatch = await newUser.comparePassword(password);
  
      if (isPasswordMatch) {
        console.log("success");
        const token = signToken(newUser._id);
      
        // Set token as a cookie with options (e.g., secure, httpOnly, sameSite)
        res.cookie('token', token, {
          httpOnly: true, // Cookie accessible only by the web server
          secure: true, // Enable only in HTTPS mode
          sameSite: 'strict', // Restrict cookie sending to same-site requests
          // Add other necessary cookie options
        })
        return res.status(200).redirect("/admin/dashbord"); // Redirect to dashboard after setting the cookie
      } else {
        console.log("fail");
        req.flash("error","Invalid email or password")
        return res.status(401).redirect("/admin/login")
      }
    } catch (err) {
      console.error(err.message);
      if (err.name === "ServerError") {
        req.flash("error","Server error. Please try again later.")
        return res.status(500).redirect("/admin/login")
      } else {
        req.flash("error","Something went wrong. Please try again." )
        return res.status(500).redirect("/admin/login")
      }
    }
  });


  const adminDashBord = (req,res)=>{
   if(req.token){
    return res.status(200).render("adminConsole")
   }
  }

  // Protect middleware
const adminProtectRules = asyncHandler(async (req, res, next) => {
  try {
    let token = req.query.token || req.cookies.token || req.headers.authorization;

    if (!token) {
      req.flash("error","Unauthorized access")
      return res.status(401).redirect("/admin/login");
    }

    // Log the token for inspection

    // Check if the token is in the format 'Bearer <token>'
    if (!token.startsWith("Bearer")) {
      // If the token doesn't have the 'Bearer' prefix, prepend it
      token = `Bearer ${token}`;
    }

    // Extract the token part after 'Bearer '
    token = token.slice(7); // Remove 'Bearer ' to get only the token part

    // Validate token
    const decodeToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);
    console.log(decodeToken);

    // Verify user existence based on the decoded token
    const admin = await Admin.findById(decodeToken.id);

    if (!admin) {
      req.flash("error","your profile not exit create new one!!")
      return res.status(404).redirect("/admin/login");
    }

    // Check if the user changed the password after the token was issued
    if (admin.isPasswordChanged(decodeToken.iat)) {
      req.flash("error","The password was changed recently. Please try again later.")
      return res.status(401).redirect("/admin/login");
    }

    // Proceed to the next middleware
    req.admin = admin
    req.token = token; // Optional: Save the token in the request object for later use
    next();
  } catch (error) {
    // Handle specific error scenarios with appropriate responses
    if (error.name === "JsonWebTokenError") {
      req.flash("error","your profile not valid, create new one")
      return res.status(401).redirect("/admin/login");
    } else if (error.name === "TokenExpiredError") {
      req.flash("error","your profile not valid, create new one")
      return res.status(401).redirect("/admin/login");
    } else {
      console.error(error.message);
      req.flash("error","your profile not valid, create new one")
      return res.status(500).redirect("/admin/login");
    }
  }
});

const adminRestrict = (...role)=>{
  return (req,res,next)=>{

    if(!role.includes(req.admin.role)){
      
      req.flash("error","your profile not valid, create new one")
      return res.status(500).redirect("/admin/login");
    }
    next ()
  }
}


const forgetPassword = (req, res) => {
    
  return res.status(200).render("restpass",{ error: [], successMsg: '' });
};

const forgetPasswordPost = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
     
      return res.status(401).render("restpass",{ error: ["This email is not registered"], successMsg: '' });
    }

    const otp = user.otpGenerator();
    console.log(otp);

    await user.save({ validateBeforeSave: false });

    // Prepare and send email with the OTP
    const message = `We have received a password reset request. Your OTP is: ${otp}`;
    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message: message,
    });

    
    return res.status(200).render("restpass",{ error: [], successMsg: `OTP send to ${user.email}` });;
  } catch (error) {
    console.error(error);
   
    return res.status(500).render("restpass",{ error: ["Server error. Unable to generate OTP"], successMsg: '' });
  }
});


const resetPasswordPost = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
      otpExpires: { $gt: Date.now() },
    });

    const {password,cpassword} = req.body
    if(password !== cpassword){
      return res.status(401).render("restpass",{ error: ["Passeord donsn't match"], successMsg: '' }); 
    }

    console.log(user);

    if (!user) {
    return res.status(400).render("restpass",{ error: ["Invalid OTP or OTP has expired"], successMsg: '' });
    }

    const isMatch = await bcrypt.compare(req.body.otp, user.encryptedOTP);

    if (!isMatch) {
      return res.status(400).render("restpass",{ error: ["Invalid OTP or OTP has expired"], successMsg: '' });
     
    }

    // Reset user password and other necessary fields
    user.password = req.body.password;
    user.confirmPassword = req.body.cpassword;
    user.encryptedOTPotp = undefined;
    user.otpExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();
    return res.render("login",{ error: ["Password successfully updated"], successMsg: '' })
  } catch (error) {
    console.error(error);
    return res.status(500).render("restpass",{ error: ["Server error. Unable to reset password"], successMsg: '' });
  }
});

const adminLogout = (req,res)=>{

  req.session = null
  res.cookie("token", "", {maxAge:1})

  return res.status(200).redirect("/")
}

const getCouponPageAdmin = async (req, res) => {
  try {
      const findCoupons = await Coupon.find({})
      res.render("coupon", { coupons: findCoupons })
  } catch (error) {
      console.log(error.message);
  }
}

const createCoupon = async (req, res) => {
  try {

      const data = { 
          couponName: req.body.couponName,
          startDate: new Date(req.body.startDate + 'T00:00:00'),
          endDate: new Date(req.body.endDate + 'T00:00:00'),
          offerPrice: parseInt(req.body.offerPrice),
          minimumPrice: parseInt(req.body.minimumPrice)
      };

      const newCoupon = new Coupon({
          name: data.couponName,
          createdOn: data.startDate,
          expireOn: data.endDate,
          offerPrice: data.offerPrice,
          minimumPrice: data.minimumPrice
      })

      await newCoupon.save()
          .then(data => console.log(data))

      res.redirect("/admin/coupon")

      console.log(data);

  } catch (error) {
      console.log(error.message);
  }
}

const getSalesReportPage = async (req, res) => {
  try {
      // const orders = await Order.find({ status: "Delivered" }).sort({ createdOn: -1 })
      // console.log(orders);

      // res.render("salesReport", { data: currentOrder, totalPages, currentPage })

      // console.log(req.query.day);
      let filterBy = req.query.day
      if (filterBy) {
          res.redirect(`/admin/${req.query.day}`)
      } else {
          res.redirect(`/admin/salesMonthly`)
      }
  } catch (error) {
      console.log(error.message);
  }
}
const salesToday = async (req, res) => {
  try {
    let today = new Date();
    const startOfTheDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfTheDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const orders = await Order.aggregate([
      {
        $match: {
          createdOn: { $gte: startOfTheDay, $lt: endOfTheDay },
          status: "Delivered"
        }
      }
    ]).sort({ createdOn: -1 });

    let itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(orders.length / itemsPerPage); // Use itemsPerPage for total pages calculation
    const currentOrders = orders.slice(startIndex, endIndex);

    console.log(currentOrders, "currentOrders");

    res.render("salesReport", { data: currentOrders, totalPages, currentPage, salesToday: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const salesWeekly = async (req, res) => {
  try {
      let currentDate = new Date()
      const startOfTheWeek = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() - currentDate.getDay()
      )

      const endOfTheWeek = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate() + (6 - currentDate.getDay()),
          23,
          59,
          59,
          999
      )

      const orders = await Order.aggregate([
          {
              $match: {
                  createdOn: {
                      $gte: startOfTheWeek,
                      $lt: endOfTheWeek
                  },
                  status: "Delivered"
              }
          }
      ]).sort({ createdOn: -1 })

      let itemsPerPage = 5
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(orders.length / 3)
      const currentOrder = orders.slice(startIndex, endIndex)

      res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesWeekly: true })

  } catch (error) {
      console.log(error.message);
  }
}


const salesMonthly = async (req, res) => {
  try {
      let currentMonth = new Date().getMonth() + 1
      const startOfTheMonth = new Date(
          new Date().getFullYear(),
          currentMonth - 1,
          1, 0, 0, 0, 0
      )
      const endOfTheMonth = new Date(
          new Date().getFullYear(),
          currentMonth,
          0, 23, 59, 59, 999
      )
      const orders = await Order.aggregate([
          {
              $match: {
                  createdOn: {
                      $gte: startOfTheMonth,
                      $lt: endOfTheMonth
                  },
                  status: "Delivered"
              }
          }
      ]).sort({ createdOn: -1 })
      // .then(data=>console.log(data))
      console.log("ethi");
      console.log(orders);

      let itemsPerPage = 5
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(orders.length / 3)
      const currentOrder = orders.slice(startIndex, endIndex)

      res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true })


  } catch (error) {
      console.log(error.message);
  }
}


const salesYearly = async (req, res) => {
  try {
      const currentYear = new Date().getFullYear()
      const startofYear = new Date(currentYear, 0, 1, 0, 0, 0, 0)
      const endofYear = new Date(currentYear, 11, 31, 23, 59, 59, 999)

      const orders = await Order.aggregate([
          {
              $match: {
                  createdOn: {
                      $gte: startofYear,
                      $lt: endofYear
                  },
                  status: "Delivered"
              }
          }
      ])


      let itemsPerPage = 5
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(orders.length / 3)
      const currentOrder = orders.slice(startIndex, endIndex)

      res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesYearly: true })

  } catch (error) {
      console.log(error.message);
  }
}


const dateWiseFilter = async (req, res)=>{
  try {
      console.log(req.query);
      const date = moment(req.query.date).startOf('day').toDate();

      const orders = await Order.aggregate([
          {
              $match: {
                  createdOn: {
                      $gte: moment(date).startOf('day').toDate(),
                      $lt: moment(date).endOf('day').toDate(),
                  },
                  status: "Delivered"
              }
          }
      ]);

      console.log(orders);

      let itemsPerPage = 5
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(orders.length / 3)
      const currentOrder = orders.slice(startIndex, endIndex)

      res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true , date})
     

  } catch (error) {
      console.log(error.message);
  }
}

const generatePdf = async (req, res) => {
  try {
      const doc = new PDFDocument();
      const filename = 'sales-report.pdf';
      const orders = req.body;

      console.log(orders);

      // Check if orders is an array
      if (!Array.isArray(orders)) {
          throw new Error('Orders data is not an array');
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      doc.pipe(res);
      doc.fontSize(12);
      doc.text('Sales Report', { align: 'center', fontSize: 16 });
      const margin = 5;
      doc
          .moveTo(margin, margin)
          .lineTo(600 - margin, margin)
          .lineTo(600 - margin, 842 - margin)
          .lineTo(margin, 842 - margin)
          .lineTo(margin, margin)
          .lineTo(600 - margin, margin)
          .lineWidth(3)
          .strokeColor('#000000')
          .stroke();

      doc.moveDown();

      const headers = ['Order ID', 'Name', 'Date',  'Total']; // Fixed headers

      let headerX = 20;
      const headerY = doc.y + 10;

      doc.text(headers[0], headerX, headerY);
      headerX += 200;

      headers.slice(1).forEach(header => {
          doc.text(header, headerX, headerY);
          headerX += 130;
      });

      let dataY = headerY + 25;

      orders.forEach(order => {
          const cleanedDataId = order.dataId.trim();
          const cleanedName = order.name.trim();

          doc.text(cleanedDataId, 20, dataY, { width: 200 });
          doc.text(cleanedName, 230, dataY);
          doc.text(order.date, 360, dataY, { width: 100 }); // Adjusted position for date
        
          doc.text(order.totalAmount.toString(), 570, dataY); // Adjusted position for totalAmount

          dataY += 30;
      });

      doc.end();
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
}




const downloadExcel = async (req, res) => {
  try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      worksheet.columns = [
          { header: 'Order ID', key: 'orderId', width: 50 },
          { header: 'Customer', key: 'customer', width: 30 },
          { header: 'Date', key: 'date', width: 30 },
         
          { header: 'Total', key: 'totalAmount', width: 15 },
          { header: 'Payment', key: 'payment', width: 15 },
      ];

      const orders = req.body;

      console.log(orders)

      orders.forEach(order => {
          worksheet.addRow({
              orderId: order.orderId,
              customer: order.name,
              date: order.date,
             
              totalAmount: order.totalAmount,
              payment: order.payment,
              products: order.products,
          });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=salesReport.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

  } catch (error) {
      console.log(error.message);
  }
}




module.exports = {
    adminlogin,
    adminSignUp,
    adminSignupPost,
    adminLoginPost,
    adminDashBord,
    adminProtectRules,
    adminRestrict,
    forgetPassword,
    forgetPasswordPost,
    resetPasswordPost,
    adminLogout,
    getCouponPageAdmin,
    createCoupon,
    getSalesReportPage,
    salesToday,
    salesWeekly,
    salesMonthly,
    salesYearly,
    dateWiseFilter,
    generatePdf,
    downloadExcel
}