const mongoose = require("mongoose");
const USERLEVEL = require("../lib/userLevel");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  level: {
    type: String,
    default: USERLEVEL.BEGINNER,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  created: {
    type: Date,
    default: Date.now,
  },
});

courseSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

courseSchema.set("toJSON", {
  virtuals: true,
});

exports.Course = mongoose.model("Course", courseSchema);
exports.courseSchema = courseSchema;
