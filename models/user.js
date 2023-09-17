const mongoose = require("mongoose");
const USERTYPES = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
};
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: "",
  },
  userType: {
    type: String,
    default: USERTYPES.STUDENT,
  },
  birthday: {
    type: Date,
    default: "",
  },
  interest: {
    type: String,
    default: "",
  },
  goal: {
    type: String,
    default: "",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  level: {
    type: String,
    default: "",
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

exports.User = mongoose.model("User", userSchema);
exports.userSchema = userSchema;
