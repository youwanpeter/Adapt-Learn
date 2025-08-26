const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const { createUser } = require("../controllers/userController");

const router = express.Router();

// legacy create user route
router.post("/", asyncHandler(createUser));

module.exports = router;
