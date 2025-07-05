const router = require('express').Router();
const Blog = require('../models/Blog');
const jwt = require('jsonwebtoken');

// Middleware to verify token
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

// Get blogs by author ID

router.get('/author/:userId', async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.userId }).populate('author', 'username profilePic');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs by author" });
  }
});

// CREATE
router.post('/', verifyToken, async (req, res) => {
  const blog = new Blog({ ...req.body, author: req.userId });
  await blog.save();
  res.json(blog);
});

// for like
router.post("/:id/like", verifyToken, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog.likes.includes(req.userId)) {
    blog.likes.push(req.userId);
    blog.unlikes.pull(req.userId); // Remove from unlike
  }
  await blog.save();
  res.json({ message: "Liked" });
});

// for unlike
router.post("/:id/unlike", verifyToken, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog.unlikes.includes(req.userId)) {
    blog.unlikes.push(req.userId);
    blog.likes.pull(req.userId); // Remove from like
  }
  await blog.save();
  res.json({ message: "Unliked" });
});

// for comment
router.post("/:id/comment", verifyToken, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  blog.comments.push({
    user: req.userId,
    text: req.body.text,
  });
  await blog.save();
  res.json({ message: "Comment added" });
});

// for image or video
router.post("/", verifyToken, async (req, res) => {
  const { title, content, image, video } = req.body;
  const blog = new Blog({
    title,
    content,
    image,
    video,
    author: req.userId,
  });
  await blog.save();
  res.json(blog);
});

// READ ALL
router.get('/', async (req, res) => {
  const blogs = await Blog.find().populate('author', 'username profilePic');
  res.json(blogs);
});

// READ ONE
router.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('author', 'username profilePic');
  res.json(blog);
});

// UPDATE
router.put('/:id', verifyToken, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (blog.author.toString() !== req.userId) return res.status(403).send("Not your blog");
  const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (blog.author.toString() !== req.userId) return res.status(403).send("Not your blog");
  await Blog.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});




module.exports = router;