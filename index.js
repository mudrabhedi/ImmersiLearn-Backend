const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: "https://immersi-learn-q58d.vercel.app/" }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'));

app.use('/api', require('./routes/auth'));

app.listen(5000, () => console.log('Server running on port 5000'));
