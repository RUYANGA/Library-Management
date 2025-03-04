require('dotenv').config();
const express=require('express');
const port =process.env.PORT ||3000;
const mongoose=require('mongoose');
const authRoutes=require('./routes/auth');
const borrowBook=require('./routes/books')
const session = require('express-session');


const app=express();

mongoose.connect(process.env.MONGO_DB)
.then(()=>{
    console.log('Mongodb connected ');
    app.listen(port,()=>{
    console.log(`Server is running at http://localhost:${port}`);
})
})
.catch((err)=>{
    console.log('Error to connect mongoDB',err);
    process.exit(1);
})

//middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:'supersecretkey', // Change this in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 } // 1 hour session
}));


//routes
app.use('/api/user',authRoutes);
app.use('/api/book',borrowBook)

