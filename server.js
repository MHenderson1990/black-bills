require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); 

connectDB();

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'BlackBills API is running' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`BlackBills server is running on port ${PORT}`);
});