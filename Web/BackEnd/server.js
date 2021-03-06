const express = require('express');
const morgan = require('morgan');
const app = express();
const cookieParser = require('cookie-parser');

require('dotenv').config();

//Connect MongoDB
const mongoose = require('mongoose');
const connect = mongoose
  .connect(process.env.MONGO_SECRET, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch((err) => console.log(err));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//api
app.use('/api/payment', require('./routes/payment'));
app.use('/api/order', require('./routes/order'));
app.use('/api/merchant', require('./routes/merchant'));
app.use('/api/product', require('./routes/product'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/merchantLocator', require('./routes/merchantLocator'));

//to retrieve images
app.use('/uploads', express.static('uploads'));

const port = process.env.PORT;

app.listen(port, (error) => {
  if (error) {
    console.log(`Error ${error} has occurred when starting the server.`);
  }
  console.log(`Server running on ${port}`);
});
