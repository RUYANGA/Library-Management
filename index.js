require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const borrowBook = require('./routes/books');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

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

// Session Configuration (for Render backend + localhost frontend)
app.use(session({
    secret: 'supersecretkey', // Change this if needed
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_DB
    }),
    cookie: {
        secure: true,             // Render is https, so we need this
        httpOnly: true,            // Protect against XSS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        sameSite: 'none'           // Required for cross-origin with localhost frontend
    }
}));

// CORS Configuration (Allow local frontend to talk to Render backend)
app.use(cors({
    origin: 'http://localhost:3000',   // Local frontend
    credentials: true,                  // Allow cookies (session)
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization"
}));

// Routes
app.use('/api/user', authRoutes);
app.use('/api/book', borrowBook);

