const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
const mongoURI = process.env['MONGO_URI']
const { Schema } = mongoose;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

//Create exercise Schema
const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
})
const Exercise = mongoose.model("exercise", exerciseSchema);


// Create user Schema
const userSchema = new Schema({
  username: { type: String, required: true },
})
const User = mongoose.model("user", userSchema);

// Create log Schema
const logSchema = new Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: [{ description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: String, required: true }, 
  }],
})
const Log = mongoose.model("log", logSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
