// const router = require('express').Router();
// const Blog = require('../models/Blog');
// const jwt = require('jsonwebtoken');

// // Middleware to verify token
// const verifyToken = (req, res, next) => {
//   const token = req.headers['authorization'];
  
//   if (!token) return res.status(403).send("Token missing");
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.userId = decoded.id;
//     next();
//   } catch {
//     res.status(401).send("Invalid token");
//   }
// };

// // Get blogs by author ID

// router.get('/author/:userId', async (req, res) => {
//   try {
//     const blogs = await Blog.find({ author: req.params.userId }).populate('author', 'username profilePic');
//     res.json(blogs);
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch blogs by author" });
//   }
// });

// // CREATE
// router.post('/', verifyToken, async (req, res) => {
//   const blog = new Blog({ ...req.body, author: req.userId });
//   await blog.save();
//   res.json(blog);
// });

// // for like
// router.post("/:id/like", verifyToken, async (req, res) => {
//   const blog = await Blog.findById(req.params.id);
//   if (!blog.likes.includes(req.userId)) {
//     blog.likes.push(req.userId);
//     blog.unlikes.pull(req.userId); // Remove from unlike
//   }
//   await blog.save();
//   res.json({ message: "Liked" });
// });

// // for unlike
// router.post("/:id/unlike", verifyToken, async (req, res) => {
//   const blog = await Blog.findById(req.params.id);
//   if (!blog.unlikes.includes(req.userId)) {
//     blog.unlikes.push(req.userId);
//     blog.likes.pull(req.userId); // Remove from like
//   }
//   await blog.save();
//   res.json({ message: "Unliked" });
// });

// // for comment
// router.post("/:id/comment", verifyToken, async (req, res) => {
//   const blog = await Blog.findById(req.params.id);
//   blog.comments.push({
//     user: req.userId,
//     text: req.body.text,
//   });
//   await blog.save();
//   res.json({ message: "Comment added" });
// });

// // for image or video
// router.post("/", verifyToken, async (req, res) => {
//   const { title, content, image, video } = req.body;
//   const blog = new Blog({
//     title,
//     content,
//     image,
//     video,
//     author: req.userId,
//   });
//   await blog.save();
//   res.json(blog);
// });

// // READ ALL
// router.get('/', async (req, res) => {
//   const blogs = await Blog.find().populate('author', 'username profilePic');
//   res.json(blogs);
// });

// // READ ONE
// router.get('/:id', async (req, res) => {
//   const blog = await Blog.findById(req.params.id).populate('author', 'username profilePic');
//   res.json(blog);
// });

// // UPDATE
// router.put('/:id', verifyToken, async (req, res) => {
//   const blog = await Blog.findById(req.params.id);
//   if (blog.author.toString() !== req.userId) return res.status(403).send("Not your blog");
//   const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(updated);
// });

// // DELETE
// router.delete('/:id', verifyToken, async (req, res) => {
//   const blog = await Blog.findById(req.params.id);
//   if (blog.author.toString() !== req.userId) return res.status(403).send("Not your blog");
//   await Blog.findByIdAndDelete(req.params.id);
//   res.send("Deleted");
// });




// module.exports = router;






const router = require('express').Router();
const Blog = require('../models/Blog');
const jwt = require('jsonwebtoken');

// ✅ Middleware to verify token
const verifyToken = (req, res, next) => {
  let token = req.headers['authorization'];
  if (!token) return res.status(403).send("Token missing");

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

// ✅ Get blogs by author ID
router.get('/author/:userId', async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.userId }).populate('author', 'username profilePic');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs by author" });
  }
});

// ✅ Create blog (including image/video)
router.post("/", verifyToken, async (req, res) => {
  const { title, content, image, video } = req.body;
  const blog = new Blog({
    title,
    content,
    image,
    video,
    author: req.userId,
  });

  try {
    await blog.save();
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: "Failed to create blog" });
  }
});

// ✅ Like a blog
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
   if (blog.likes.includes(req.userId)) {
  // ✅ Already liked → remove like (toggle off)
  blog.likes.pull(req.userId);
  await blog.save();
  return res.json({ message: "Like removed" });
} else {
  // ✅ Not liked yet → add like
  blog.likes.push(req.userId);
  blog.unlikes.pull(req.userId); // remove from unlikes if any
  await blog.save();
  return res.json({ message: "Liked" });
}


  } catch (err) {
    res.status(500).json({ error: "Like failed" });
  }
});

// ✅ Unlike a blog
router.post("/:id/unlike", verifyToken, async (req, res) => {
   try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    if (blog.unlikes.includes(req.userId)) {
      // ✅ Already unliked → toggle off (remove unlike)
      blog.unlikes.pull(req.userId);
      await blog.save();
      return res.json({ message: "Unlike removed" });
    } else {
      // ✅ Add unlike
      blog.unlikes.push(req.userId);
      blog.likes.pull(req.userId); // remove like if present
      await blog.save();
      return res.json({ message: "Unliked" });
    }
  } catch (err) {
    res.status(500).json({ error: "Unlike failed" });
  }
});

// ✅ Add a comment
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    blog.comments.push({
      user: req.userId,
      text: req.body.text,
    });

    await blog.save();
    res.json({ message: "Comment added" });
  } catch (err) {
    res.status(500).json({ error: "Comment failed" });
  }
});

// ✅ Get all blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'username profilePic')
      .populate('comments.user', 'username profilePic');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// ✅ Get a single blog
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'username profilePic')
      .populate('comments.user', 'username profilePic');

    if (!blog) return res.status(404).send("Blog not found");

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

router.delete("/:blogId/comment/:commentId", verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const commentIndex = blog.comments.findIndex(
      (c) => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1)
      return res.status(404).json({ message: "Comment not found" });

    const comment = blog.comments[commentIndex];

    if (comment.user.toString() !== req.userId)
      return res.status(403).json({ message: "Unauthorized" });

    blog.comments.splice(commentIndex, 1);
    await blog.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("❌ Delete Comment Error:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

// ✅ Update a blog
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    if (blog.author.toString() !== req.userId) {
      return res.status(403).send("Not your blog");
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// ✅ Delete a blog
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found");

    if (blog.author.toString() !== req.userId) {
      return res.status(403).send("Not your blog");
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.send("Deleted");
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;