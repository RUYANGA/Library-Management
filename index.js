require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const borrowBook = require('./routes/borrowBook');
const notification=require('./routes/notification')
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const multer=require('multer')

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        console.log('Mongodb connected');
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log('Error to connect mongoDB', err);
        process.exit(1);
    });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration 
app.use(session({
    secret: 'supersecretkey', // Change this if needed
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_DB
    }),
    cookie: {
        secure: false,             // Render is https, so we need this
        httpOnly: false,            // Protect against XSS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        sameSite: 'none' 
    }
}));


// CORS Configuration 
app.use(cors({
    origin:process.env.FRONTEND_URL,  
    credentials: true,                  // Allow cookies (session)
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization"
}));

// Routes
app.use('/api/user', authRoutes);
app.use('/api/book', borrowBook);
app.use('/api/notification',notification);



app.use((error,req,res,next)=>{

    return res.json({message:'Something went wronge!'})
});

app.use((req,res,next)=>{

    res.status(404).json({message:'Page not found 404!'})
})