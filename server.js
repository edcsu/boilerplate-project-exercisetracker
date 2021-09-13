const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const mongoURI = process.env["MONGO_URI"];
const { Schema } = mongoose;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

//Create exercise Schema
const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, default: Date.now},
});
const Exercise = mongoose.model("exercise", exerciseSchema);

// Create user Schema
const userSchema = new Schema({
  username: { type: String, required: true },
});
const User = mongoose.model("user", userSchema);

// Create log Schema
const logSchema = new Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: String, default: Date.now },
    },
  ],
});
const Log = mongoose.model("log", logSchema);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// add a user
app.post("/api/users", async (req, res) => {
  const username = req.body.username;

  try {
    // check if user exists
    let foundUser = await User.findOne({
      username,
    });
    if (foundUser) {
      console.log(`User with username: ${username} already exists.`);
      return res.json({
        username,
        _id: foundUser.id
      });
    } else {
      // create new User record
      console.log(`Creating user with username: ${username}.`);
      foundUser = new User({
        username,
      });
      let createdUser = await foundUser.save();
      return res.json({
        username,
        _id: createdUser.id
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json("oops something broke");
  }
});

// get a list of users
app.get("/api/users", async (req, res) => {
  const foundUsers =  await User.find({});
  let usersList = [];
  foundUsers.map((user) => {
    usersList.push(user);
  });
  return res.send(usersList);
});

// add exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;

  try {
    // check if user exists
    let foundUser = await User.findById(id);
    if (!foundUser) {
      return res.json({ error: `User not found with ${id}.`});
    } else {
      // create new exercise record
      let exercise = new Exercise({
        username : foundUser.username,
        description,
        duration,
        date: new Date(date).toDateString()
      });
      const savedExercise = await exercise.save();
      console.log(savedExercise)
      return res.json({
        username: savedExercise.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date,
        _id: savedExercise._id
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json("oops something broke");
  }
});

// get logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  const limit = req.query.limit;

  try {
    // check if user exists
    let foundUser = await User.findById(id);
    if (!foundUser) {
      return res.json({ error: `User not found with ${id}.`});
    } else {
      // get user logs
      const logs = await Log.findById(id)
      .sort({ date: -1 })
      .limit(limit)
      .select({ age: 0 })
      .exec()
      
      return res.json({
        ...logs
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json("oops something broke");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
