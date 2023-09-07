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
  date: Date,
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

function convertirFecha(fechaISO) {
  const meses = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const date = new Date(fechaISO);
  const diaSemana = date.toLocaleDateString("en-US", { weekday: "short" });
  const mes = meses[date.getUTCMonth()];
  const dia = date.getUTCDate();
  const anio = date.getUTCFullYear();

  return `${diaSemana} ${mes} ${dia} ${anio}`;
}

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
    const parsedDay = convertirFecha(req.body.date);
    let newExercise = new Exercise({
      username: findUser.username,
      description: req.body.description,
      duration: +req.body.duration,
      date: new Date(req.body.date) || Date.now(),
    });
    const savedExercise = await newExercise.save();
    console.log(savedExercise);

    res.json({
      _id: req.params._id,
      username: savedExercise.username,
      date: parsedDay,
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

function filtrarPorFecha(array, fechaDesde, fechaHasta) {
  // Convertir las fechas desde y hasta al formato "Thu Feb 02 2023"
  if (fechaDesde) {
    fechaDesde = convertirFecha(fechaDesde);
  }

  if (fechaHasta) {
    fechaHasta = convertirFecha(fechaHasta);
  }

  // Filtrar el array original según las fechas especificadas
  const resultado = array.filter((objeto) => {
    const fechaObjeto = objeto.date;
    if (fechaDesde && fechaHasta) {
      return fechaObjeto >= fechaDesde && fechaObjeto <= fechaHasta;
    } else if (fechaDesde) {
      return fechaObjeto >= fechaDesde;
    } else if (fechaHasta) {
      return fechaObjeto <= fechaHasta;
    } else {
      return true; // Si no se proporciona ninguna fecha, no se aplica filtro
    }
  });

  return resultado;
}

app.get("/api/users/:_id/logs?", async function (req, res) {
  try {
    const { from, to, limit } = req.query;
    console.log(from, to, limit);
    let findUser = await User.findById(req.params._id);
    let logs = await Exercise.find({ username: findUser.username })
      .select("-_id description duration date")
      .limit(limit);
    // logs[date] = convertirFecha(logs.date);
    const convertedLogs = logs.map((objeto) => ({
      description: objeto.description,
      duration: objeto.duration,
      date: convertirFecha(objeto.date),
    }));
    if (from && to) {
      let filteredLogs = filtrarPorFecha(convertedLogs, from, to);
      res.json({
        _id: findUser._id,
        from,
        to,
        username: findUser.username,
        count: filteredLogs.length,
        log: filteredLogs,
      });
      return;
    }
    if (from) {
      let filteredLogs = filtrarPorFecha(convertedLogs, from, null);
      res.json({
        _id: findUser._id,
        from,
        username: findUser.username,
        count: filteredLogs.length,
        log: filteredLogs,
      });
      return;
    }
    if (to) {
      let filteredLogs = filtrarPorFecha(convertedLogs, from, null);
      res.json({
        _id: findUser._id,
        to,
        username: findUser.username,
        count: filteredLogs.length,
        log: filteredLogs,
      });
      return;
    }
    res.json({
      _id: findUser._id,
      username: findUser.username,
      count: logs.length,
      log: convertedLogs,
    });
  } catch (error) {
    res.json({ error });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
