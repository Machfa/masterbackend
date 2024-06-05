
require('./config/db.js');

const express = require('express');
const bodyParser = express.json;
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(bodyParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
app.use('/', routes);
const PORT = 4000;

const startApp = async () => {
  try {
    await app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};
startApp();










