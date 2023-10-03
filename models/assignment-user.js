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
});

exports.AssignmentUser = mongoose.model("AssignmentUser", assignmentUserSchema);
