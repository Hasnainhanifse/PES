const mongoose = require("mongoose");

const USERLEVEL = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  EXPERT: "EXPERT",
};

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
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
  ],
  submittedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
