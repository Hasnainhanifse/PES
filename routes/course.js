const express = require("express");
const router = express.Router();
const ResponseResult = require("../helpers/DTO");
const { Course } = require("../models/course");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");

const FILE_TYPE_MAP = {
  "image/jpeg": "jpeg",
  "image/png": "png",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid file type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads/courses/");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

const removeFile = (fileName) => {
  fs.unlink(`public/uploads/courses/${fileName}`, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

// get all courses
router.get("/", async (req, res) => {
  try {
    const { levelType } = req.query;
    let courses;
    if (levelType) {
      //if level is provided in param then will find assignments whose level is provided in param
      courses = await Course.find({ level: levelType });
    } else {
      courses = await Course.find();
    }

    if (!courses) {
      return res.status(400).send("No Courses available");
    }
    let result = ResponseResult(courses.length, courses);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// create one course
router.post("/", uploadOptions.single("image"), async (req, res) => {
  try {
    const { title, level } = req.body;
    if (!title || !level) {
      return res.status(400).send("Please fill all fields");
    }
    const file = req.file;
    let fileName;
    let basePath;
    if (file) {
      //setting file path and name
      fileName = file.filename;
      basePath = `${req.protocol}://${req.get("host")}/public/uploads/courses/`;
    }

    //creating new course
    let course = new Course({
      title,
      level,
      image: file ? `${basePath}${fileName}` : "",
    });
    course = await course.save();

    if (!course) {
      removeFile(fileName);
      return res.status(500).send("Course an not be created");
    }
    res.status(200).send(course);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

router.post("/enroll/:id", async (req, res) => {
  try {
    const { user } = req.body;
    const courseId = req.params.id;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).send("Please provide valid course Id");
    }
    if (!user || !mongoose.isValidObjectId(user)) {
      return res.status(400).send("Please provide valid user Id");
    }

    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).send("Invalid course");
    }

    let existingUser = await User.findById(user);
    if (!existingUser) {
      return res.status(400).send("Invalid user");
    }

    if (
      existingUser.courses.includes(courseId) ||
      course.users.includes(user)
    ) {
      return res.status(400).send("already assigned course");
    }

    existingUser.courses = [...existingUser.courses, courseId];
    course.users = [...course.users, user];
    await existingUser.save();
    course = await course.save();
    res.status(200).send(existingUser);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    const { title, level } = req.body;
    const courseId = req.params.id;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return res.status(400).send("Please provide valid course Id");
    }
    //checking file is attached or not
    const file = req.file;
    let fileName, basePath;
    if (file) {
      //setting path and file name for uploaded file
      fileName = file.filename;
      basePath = `${req.protocol}://${req.get(
        "host"
      )}/public/uploads/articles/`;
    }

    //check if course is available
    let course = await Course.findById(courseId);
    if (!course) {
      removeFile(fileName);
      return res.status(400).send("Invalid course");
    }

    let updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        title: title ? title : course.title,
        level: level ? level : course.level,
        image: fileName && basePath ? `${basePath}${fileName}` : course.image,
        created: course.created,
      },
      { new: false }
    );
    if (!updatedCourse) {
      removeFile(fileName);
      return res.status(500).send("the course cannot be update!");
    }

    course = await Course.findById(courseId);
    res.status(200).send(course);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

module.exports = router;
