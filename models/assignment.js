const mongoose = require("mongoose");

const USERLEVEL = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  EXPERT: "EXPERT",
};

const assignmentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
    default: USERLEVEL.BEGINNER,
  },
  file: {
    type: String,
    required: true,
  },
  studentAssignments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssignmentUser",
    },
  ],
  submittedFile: {
    type: String,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

assignmentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

assignmentSchema.set("toJSON", {
  virtuals: true,
});

exports.Assignment = mongoose.model("Assignment", assignmentSchema);
