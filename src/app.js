// import express
const express = require('express');
const cors = require('cors')
// create express app
app = express();

app.use(cors());
app.use(express.json());
app.use("/api", require("./routes/routes"));
module.exports = app;