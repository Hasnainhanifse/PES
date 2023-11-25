const mongoose = require("mongoose");
const USERLEVEL = require("../lib/userLevel");
const quizSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
    default: USERLEVEL.BEGINNER,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
  ],
  submittedQuiz: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: false,
    },
  ],
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

quizSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

quizSchema.set("toJSON", {
  virtuals: true,
});

exports.Quiz = mongoose.model("Quiz", quizSchema);
exports.quizSchema = quizSchema;
