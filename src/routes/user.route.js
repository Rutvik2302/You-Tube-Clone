const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser , refreshAccessToken } = require("../controllers/user.controller.js");
const upload = require("../middleware/multer.js");
const verifyjwt = require('../middleware/auth.js');

router.post("/register" , upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser);

router.post("/login" , loginUser)
router.post("/logout" , verifyjwt ,logoutUser)
router.post("/refrshToken" , refreshAccessToken)

module.exports = router;
