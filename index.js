const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require("dotenv").config();

mongoose.connect(process.env.MONGO_DB);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const userSchema = new Schema({
  username: { type: String, required: true },
});
const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

const users = [];
app.post("/api/users", async function (req, res) {
  // if (err) return console.log(err);
  try {
    console.log(req.body);
    let newUser = new User({ username: req.body.username });
    const savedUser = await newUser.save();
    res.json({ username: savedUser.username, _id: savedUser["_id"] });
  } catch (error) {
    req.json({ error });
  }
});

app.post("/api/users/:_id/exercises", async function (req, res) {
  try {
    // console.log(req.params);
    const findUser = await User.findById(req.params._id);

    let newExercise = new Exercise({
      username: findUser.username,
      description: req.body.description,
      duration: +req.body.duration,
      date: req.body.date || Date.now(),
    });
    const savedExercise = await newExercise.save();
    console.log(savedExercise);

    res.json({
      _id: req.params._id,
      username: savedExercise.username,
      date: savedExercise.date,
      duration: savedExercise.duration,
      description: savedExercise.description,
    });
  } catch (error) {
    res.json(error);
  }
});

app.get("/api/users", async function (req, res) {
  try {
    let findUser = await User.find({});
    res.json(findUser);
  } catch (error) {
    res.json({ error });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
