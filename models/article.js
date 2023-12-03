const mongoose = require("mongoose");
const USERLEVEL = require("../lib/userLevel");
const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  interest: {
    type: String,
    required: true,
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

articleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

articleSchema.set("toJSON", {
  virtuals: true,
});

exports.Article = mongoose.model("Article", articleSchema);
exports.articleSchema = articleSchema;
