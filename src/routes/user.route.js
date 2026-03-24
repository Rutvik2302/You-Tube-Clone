const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCover,
  getUserChannelProfile,
  getWatchHistory,
} = require("../controllers/user.controller.js");
const upload = require("../middleware/multer.js");
const verifyjwt = require("../middleware/auth.js");

router.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.post("/login", loginUser);
router.post("/logout", verifyjwt, logoutUser);
router.post("/refrshToken", refreshAccessToken);
router.post("/change-password", verifyjwt, changeCurrentPassword);
router.get("/current-user" , verifyjwt , getCurrentUser)
router.patch("/update-details" , verifyjwt , updateAccountDetails)
router.patch("/update-avtar" , verifyjwt , upload.single("avatar") , updateUserAvatar)
router.patch("/update-coverImage" , verifyjwt , upload.single("coverImage") , updateUserCover)
router.get("/channel/:userName" , verifyjwt , getUserChannelProfile)
router.get("/watchHistory" , verifyjwt , getWatchHistory)

module.exports = router;
