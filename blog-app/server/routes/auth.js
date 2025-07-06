const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, profilePic } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json("All fields are required");
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, profilePic });
    await user.save();
    res.json("User registered");

  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json("Registration failed");
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json("User not found");

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(400).json("Wrong password");

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // 👇 Return profilePic also
    res.json({
      token,
      userId: user._id,
      profilePic: user.profilePic || "", // fallback empty if missing
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json("Internal server error");
  }
});
module.exports = router;