const mongoose = require("mongoose");
const USERLEVEL = require("../lib/userLevel");
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  video: {
    type: String,
  },
  level: {
    type: String,
    default: USERLEVEL.BEGINNER,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

videoSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

videoSchema.set("toJSON", {
  virtuals: true,
});

exports.Videos = mongoose.model("Videos", videoSchema);
exports.videoSchema = videoSchema;
