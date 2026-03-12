const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/apiError.js");
const User = require("../models/user.model.js");
const uploadOnCloudinary = require("../utils/cludinary.js");
const ApiRespones = require("../utils/ApiResponse .js");
const jwt = require("jsonwebtoken");

const GenrateRefranshTokenAndAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefranshToken();
    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.error("Token Generation Error: ", error);
    throw new ApiError(500, "Somthing Went Wrong");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  let { fullName, email, userName, password } = req.body;
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Feild is require");
  }
  const user = await User.findOne({ $or: [{ userName }, { email }] });
  if (user) {
    throw new ApiError(409, "User with email and username is already exits");
  }
  const avatarLocalpath = req.files?.avatar[0]?.path;
  // const coverLocalpath = req.files?.coverImage[0]?.path;

  let coverLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.length > 0
  ) {
    coverLocalpath = res.files.coverImage[0].path;
  }
  if (!avatarLocalpath) {
    throw new ApiError(400, "avatarFile is required");
  }

  const uploadavatar = await uploadOnCloudinary(avatarLocalpath);
  const uploacoverImage = await uploadOnCloudinary(coverLocalpath);

  if (!uploadavatar) {
    throw new ApiError(400, "avatarFile is required");
  }

  const Users = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: uploadavatar.url,
    coverImage: uploacoverImage?.url || "",
  });

  const createdUser = await User.findById(Users._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiRespones(201, createdUser, "User created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  let { email, userName, password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  if (!userName && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User nor exits");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } =
    await GenrateRefranshTokenAndAccessToken(user._id);

  const loggedinUsser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespones(200, { user: loggedinUsser, accessToken, refreshToken }),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespones(200, {}, "Logout sucessfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshtoken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshtoken) {
    throw new ApiError(401, "Unauthorize request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshtoken,
      process.env.REFRESE_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Unauthorize request");
    }

    if (incomingRefreshtoken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expire ");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } =
      await GenrateRefranshTokenAndAccessToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiRespones(
          200,
          { accessToken, refreshToken },
          "refreshToken refrash",
        ),
      );
  } catch (error) {
    throw new ApiError(400, error.message || "Somthing Went Error");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old Password is icoorect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiRespones(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "currrent User get sucessfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  let { fullName, userName, email } = req.body;

  if (!fullName || !email || !userName) {
    throw new ApiError(400, "All feild are require");
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
        userName,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespones(200, user, "Account Details is Update"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error to upload the avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true },
  ).select("-password");
  return res.status(200, user, "avtar is updated");
});

const updateUserCover = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error to upload the coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverImage: coverImage.url },
    },
    { new: true },
  ).select("-password");

  return res.status(200, user, "CoverImage is updated");
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserCover,
  updateUserAvatar
};
