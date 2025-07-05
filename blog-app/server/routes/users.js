const router = require('express').Router();
const User = require('../models/User');

router.get('/', async (req, res) => {
  const users = await User.find({}, 'username'); // Only return _id and username
  res.json(users);
});

module.exports = router;