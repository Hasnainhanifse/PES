const express = require("express");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv/config");
const api = process.env.API_URL;
const cors = require("cors");

//routes
const usersRoutes = require("./routes/users");
const quizRoutes = require("./routes/quiz");
const assignmentRoutes = require("./routes/assignment");
const articleRoutes = require("./routes/article");
const courseRoutes = require("./routes/course");
const progressRoutes = require("./routes/progress");
const videosRoutes = require("./routes/videos");
const mlModelRoute = require("./routes/model");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

app.use(cors());
app.options("*", cors());

//middlewares
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler);
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

app.use(`${api}/users`, usersRoutes);
app.use(`${api}/quiz`, quizRoutes);
app.use(`${api}/assignment`, assignmentRoutes);
app.use(`${api}/articles`, articleRoutes);
app.use(`${api}/courses`, courseRoutes);
app.use(`${api}/progress`, progressRoutes);
app.use(`${api}/videos`, videosRoutes);
app.use(`${api}/model`, mlModelRoute);

//database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "pes",
  })
  .then(() => {
    console.log("Database is connected...");
  })
  .catch((err) => {
    console.log(err);
  });

app.listen(3000, () => {
  console.log("server is running on port 3000");
});
