const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const mongoURI = process.env.MONGO_URI;
const { Schema } = mongoose;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

//Create exercise Schema
const exerciseSchema = new Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String },
});
const Exercise = mongoose.model("exercise", exerciseSchema);

// Create user Schema
const userSchema = new Schema({
  username: { type: String, required: true },
  count: { type: Number },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: String, },
    },
  ],
});
const User = mongoose.model("user", userSchema);

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
  const date = req.body.date === '' ? new Date() : new Date(req.body.date);

  try {
    // check if user exists
    await User.findById(id).exec((error, data) => {
      if(error) console.log(error);
      
      else if (data === null) {
        return res.json({ error: `User not found with ${id}.`});
      } else {
        // create new log
        let newLog = {
          _id: id,
          description,
          duration: +duration,
          date: date.toString().slice(0, 15),
          username : data.username,
        };
        data.log = data.log.concat(newLog);
        data.log = data.log.sort((a, b) => a.date - b.date);
        
        data.save((error) => {
          if (error) return console.error(error)
        });

        return res.json(newLog);
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json("oops something broke");
  }
});

// get logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const id = req.params._id;
  let limit = req.query.limit;
  let from = req.query.from;
  let to = req.query.to;

  try {
    // check if user exists
    User.findById(id, (error, result) => {
      if(!error){
        let userFound = result
        
        if(from || to){
          
          from = new Date(0)
          to = new Date()
          
          if(from){
            from = new Date(from)
          }
          
          if(to){
            to = new Date(to)
          }
          
          from = from.getTime()
          to = to.getTime()
          
          userFound.log = userFound.log.filter((exercise) => {
            let exerciseDate = new Date(exercise.date).getTime()
            
            return exerciseDate >= from && exerciseDate <= to
          })
        }
        
        if(limit){
          userFound.log = userFound.log.slice(0, +limit)
        }

        let logs = [];
        userFound.log.forEach(log => {
          logs.push({
            description: log.description,
            duration: log.duration,
            date: log.date
          })
        });
        
        res.json({
          _id: id,
          username: userFound.username,
          count: userFound.log.length,
          log: logs
        });
      }
    })
  } catch (err) {
    console.error(err);
    return res.status(500).json("oops something broke");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
