const router = require('express').Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  const users = await User.find({}, 'username profilePic'); // Only return _id and username
  res.json(users);
});

router.get('/search', async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({
      username: { $regex: username, $options: 'i' } // case-insensitive
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Search failed' });
  }
});

// GET user by ID (used for profile photo)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username profilePic');
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;