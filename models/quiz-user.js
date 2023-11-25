const mongoose = require("mongoose");

const quizUserSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
  },
  score: {
    type: Number,
  },
});

quizUserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

quizUserSchema.set("toJSON", {
  virtuals: true,
});

exports.QuizUser = mongoose.model("QuizUser", quizUserSchema);
exports.quizUserSchema = quizUserSchema;
