// const http = require('http');

// const routes = require('./routes');

// 1st method
// function rqListener(req, res){

// }
// http.createServer(rqListener);

// 2nd method
// http.createServer(function(req, res){

// });

// console.log(routes.someText);

// const server = http.createServer(routes.handler);
const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

//Using mySQL 
// const sequelize = require('./util/database');
// const Product = require('./models/product');
// const User = require('./models/user');
// const Cart = require('./models/cart');
// const CartItem = require('./models/cart-item');
// const Order = require('./models/order');
// const OrderItem = require('./models/order-item');

//Using mongodb
// const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');

// const MONGODB_URI = `mongodb://localhost:27017/${process.env.MONGO_DEFAULT_DATABASE}`;
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@shop.uudhcdb.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

//Ejs
app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const errorController = require('./controllers/error');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}));

app.use(bodyParser.urlencoded({extended: true})); //Need to make extended as true because of express version 4.16+
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        if(!user) {
            return next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err));
    });
});

//We can also use express instead of bodyparser
// app.use(express.urlencoded({extended: false}));

// app.use((req, res, next) => {
//     console.log('In the middleware!');
//     next(); // Allows the request to the next middleware in line
// });

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render(...);
    // res.redirect('/500');
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path:'/500',
        isAuthenticated: req.session.isLoggedIn
    });
});

//Without using express
// const server = http.createServer(app);

// server.listen(3000);

//Short code using express

//Using mongodb
// mongoConnect(() => {
//     app.listen(3000);
// });

//Using mongoose
mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(process.env.PORT || 3000);
})
.catch(err => {
    console.log(err);
}); 