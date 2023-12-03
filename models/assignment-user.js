const mongoose = require("mongoose");

const assignmentUserSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: {
    type: String,
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
  },
  submittedFile: {
    type: String,
  },
  score: {
    type: Number,
  },
  submittedDate: {
    type: Date,
  },
});

assignmentUserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

assignmentUserSchema.set("toJSON", {
  virtuals: true,
});

exports.AssignmentUser = mongoose.model("AssignmentUser", assignmentUserSchema);
exports.assignmentUserSchema = assignmentUserSchema;
