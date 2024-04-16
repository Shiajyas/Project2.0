require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const session = require("express-session")
const cookie = require("cookie-parser")
const methodOverride = require("method-override")
const connectDB = require("./server/config/db")
const flash = require("connect-flash")
const path = require("path")
const nocache = require("nocache")
const User = require("./models/UserDb")


connectDB()
const app = express()
const port = process.env.PORT || 5000

app.use(cookie()) 
app.use(bodyParser.urlencoded({extended: true}))
// app.use(methodOverride("_method")) 
app.use(nocache())

app.use(session({
    secret: "secret", 
    resave: false, 
    saveUninitialized: true,
    cookie:{  
        maxAge: 1000*60*60*24*7 // 1 week
    }
}))
  
app.use(flash())

// Serve static files for /admin route
app.use("/admin/assets", express.static(path.join(__dirname, "assets")));
app.use("/admin/css", express.static(path.join(__dirname, "assets/css")));
app.use("/admin/assets/js/vendor", express.static(path.join(__dirname, "assets/js/vendor")));
app.use("/admin/imgs/theme",express.static(path.join(__dirname, "assets/imgs/theme")))

// Serve static files for /customer route
app.use("/admin/customer/assets", express.static(path.join(__dirname, "assets")));
// app.use("/admin/customer/css", express.static(path.join(__dirname, "assets/css")));
// app.use("/admin/customer/assets/js/vendor", express.static(path.join(__dirname, "assets/js/vendor")));
// app.use("/admin/customer/imgs/theme",express.static(path.join(__dirname, "assets/imgs/theme")))

// Serve static files for /admin categories route
app.use("/admin/categories/assets", express.static(path.join(__dirname, "assets")));
// app.use("/admin/categories/css", express.static(path.join(__dirname, "assets/css")));
// app.use("/admin/categories/assets/js/vendor", express.static(path.join(__dirname, "assets/js/vendor")));
// app.use("/admin/categories/imgs/theme",express.static(path.join(__dirname, "assets/imgs/theme")))

// Serve static files for /asmin pr0ducts route

app.use("/admin/product/assets", express.static(path.join(__dirname, "assets")));

// Serve other static files
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/css", express.static(path.join(__dirname, "assets/css")));

// Serve static files for /user route
app.use("/user/product/assets", express.static(path.join(__dirname, "assets")))

app.use("/user/assets", express.static(path.join(__dirname, "assets")));
app.use("/user/css", express.static(path.join(__dirname, "assets/css")));
app.use("/public",express.static(path.join(__dirname,"public")))
app.use("/user/public",express.static(path.join(__dirname,"public")))

 
// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
 
 
app.get("/",async(req,res)=>{
    try {
        let token = req.query.token || req.cookies.token || req.headers.authorization;
        if(token){
          let user = {username: "Test"}
            return res.status(200).render("home1",{user: user});
        }else{
            return res.status(200).render("home1",{user: null});
        }
    } catch (error) {
        // Handle errors such as database query errors
        console.error(error);
        return res.status(500).render('404');
    }
})
 
app.use("/user", require("./routes/authUserRoutes"))    
app.use("/admin",require("./routes/authRouterAdmin"))
app.use("/admin/categories",require("./routes/adminCategoryRoutes"))
app.use("/admin/customer",require("./routes/adminUserRoutes"))
app.use("/admin/product",require("./routes/adminProductRoutes"))

app.listen(port, ()=>console.log(`Server running on : http://localhost:${port}`))






