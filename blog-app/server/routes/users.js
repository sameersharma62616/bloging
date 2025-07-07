const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // ⬅️ Add this at the top
const Blog = require('../models/Blog');

// Token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send("Token missing");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

// ✅ Get all users (minimal fields)
router.get('/', async (req, res) => {
  const users = await User.find({}, 'username profilePic');
  res.json(users);
});

// ✅ Search users by username
router.get('/search', async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({
      username: { $regex: username, $options: 'i' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
});

// ✅ Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username profilePic');
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Update profile (username, email, password, profilePic)
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { username, email, password, profilePic } = req.body;

    const updateFields = { username, email, profilePic };

    // 👉 Only hash password if it’s being updated
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateFields,
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error("Update error", err);
    res.status(500).json({ error: "Profile update failed" });
  }
});

// ✅ DELETE user account and their blogs
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ message: "Unauthorized" });

    // 🗑️ Delete all blogs of this user
    await Blog.deleteMany({ author: req.params.id });

    // 🗑️ Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Account and all blogs deleted successfully" });
  } catch (err) {
    console.error("❌ Account delete error:", err.message);
    res.status(500).json({ message: "Failed to delete account" });
  }
});

module.exports = router;