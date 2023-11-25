const mongoose = require("mongoose");

const assignmentUserSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
});

assignmentUserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

assignmentUserSchema.set("toJSON", {
  virtuals: true,
});

exports.AssignmentUser = mongoose.model("AssignmentUser", assignmentUserSchema);
exports.assignmentUserSchema = assignmentUserSchema;
