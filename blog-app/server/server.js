const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const blogs  = require('./routes/blogs.js');
const userRoutes = require('./routes/users');


const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs',blogs);
app.use('/api/users', userRoutes);


app.listen(5000, () => console.log("Server running on port 5000"));