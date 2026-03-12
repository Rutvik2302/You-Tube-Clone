const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true , limit:"16kb"}))
app.use(express.static("public"));
app.use(cookieParser());

// Routes imports 
console.log("run")

const userRoute = require('./routes/user.route.js');

app.use("/users" , userRoute);

module.exports = app;