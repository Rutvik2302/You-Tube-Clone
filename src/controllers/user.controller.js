const asyncHandler = require("../utils/asyncHandler.js");
const ApiError = require("../utils/apiError.js");
const User = require("../models/user.model.js");
const uploadOnCloudinary = require("../utils/cludinary.js");
const ApiRespones = require("../utils/ApiResponse .js");

const GenrateRefranshTokenAndAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken =await user.generateRefranshToken();
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

  const { accessToken, refreshToken } = await GenrateRefranshTokenAndAccessToken(
    user._id,
  );

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

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
