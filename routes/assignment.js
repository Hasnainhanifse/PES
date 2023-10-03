const express = require("express");
const router = express.Router();
const ResponseResult = require("../helpers/DTO");
const { Assignment } = require("../models/assignment");
const { AssignmentUser } = require("../models/assignment-user");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");

const FILE_TYPE_MAP = {
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid file type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads/assignments/");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

const removeFile = (fileName) => {
  fs.unlink(`public/uploads/assignments/${fileName}`, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

async function getAssignmentUserDetails(assignment, currentUser) {
  //getting submitted assignment details
  if (assignment && assignment.length) {
    let userAssignments = Promise.all(
      assignment.map(async (a) => {
        if (a.studentAssignments && a.studentAssignments.length) {
          a.studentAssignments = await AssignmentUser.find({
            _id: { $in: a.studentAssignments },
            user: currentUser,
          }).exec();
          return a;
        } else return a;
      })
    );
    return await userAssignments;
  } else {
    assignment.studentAssignments = await AssignmentUser.find({
      _id: { $in: assignment.studentAssignments },
      user: currentUser,
    }).exec();
    return assignment;
  }
}

//Assignment routes
// get all assignments
router.get("/", async (req, res) => {
  try {
    const { currentUser, levelType } = req.query;
    //checking if current user id is valid in mongodb
    if (currentUser && !mongoose.isValidObjectId(currentUser)) {
      return res.status(400).send("Invalid User Id or missing current user id");
    }

    let assignments;
    if (levelType) {
      //if level is provided in param then will find assignments whose level is provided in param
      assignments = await Assignment.find({ level: levelType });
      if (!assignments) {
        return res.status(400).send("No Assignments available");
      }
    } else {
      assignments = await Assignment.find();
      if (!assignments) {
        return res.status(400).send("No Assignments available");
      }
    }
    assignments = await getAssignmentUserDetails(assignments, currentUser);
    let result = ResponseResult(assignments.length, assignments);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// create one assignment
router.post("/upload", uploadOptions.single("file"), async (req, res) => {
  try {
    const { name, level } = req.body;
    //checking file is attachedin api
    const file = req.file;
    if (!file) return res.status(400).send("No File in the request");
    //setting file path and name
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get(
      "host"
    )}/public/uploads/assignments/`;

    if (!name) {
      removeFile(fileName);
      return res.status(400).send("No File Name in the request");
    }

    //creating new assignment
    let assignment = new Assignment({
      name: name,
      level: level,
      file: `${basePath}${fileName}`,
    });
    assignment = await assignment.save();
    if (!assignment) {
      removeFile(fileName);
      return res.status(500).send("The File cannot be uploaded");
    }

    res.status(200).send(assignment);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

// submit assignment
router.put("/submit", uploadOptions.single("file"), async (req, res) => {
  try {
    const { user, assignmentId, submitAssignmentId } = req.body;

    //checking file is attached or not
    const file = req.file;
    if (!file) return res.status(400).send("No File in the request");
    //setting path and file name for uploaded file
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get(
      "host"
    )}/public/uploads/assignments/`;

    if (!user || !assignmentId) {
      removeFile(fileName);
      return res.status(400).send("Please provide all required params");
    }
    //checking provided ids are valid mongodb ids
    if (
      (user && !mongoose.isValidObjectId(user)) ||
      (assignmentId && !mongoose.isValidObjectId(assignmentId)) ||
      (submitAssignmentId && !mongoose.isValidObjectId(submitAssignmentId))
    ) {
      removeFile(fileName);
      return res
        .status(400)
        .send("Invalid User Id, assignment Id or submitted assignment id");
    }

    //check if assignment is available
    let assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      removeFile(fileName);
      return res.status(400).send("Invalid Assignment");
    }

    //check if assignment is submitted or not
    let assignmentUser = await AssignmentUser.findById(submitAssignmentId);

    let submittedAssignment;
    if (!assignmentUser) {
      //if assignment is not submitted then we will submit assignment and assign submitted id to assignment object's studentAssignments array
      submittedAssignment = new AssignmentUser({
        user: user,
        assignment: assignmentId,
        submittedFile: `${basePath}${fileName}`,
      });
      submittedAssignment = await submittedAssignment.save();
      assignment.studentAssignments = [
        ...assignment.studentAssignments,
        submittedAssignment._id,
      ];
    } else {
      //if assignment is allready submitted then need submitted assignment id to update existing assignment
      if (submitAssignmentId) {
        submittedAssignment = await AssignmentUser.findByIdAndUpdate(
          submitAssignmentId,
          {
            submittedFile: `${basePath}${fileName}`,
          },
          { new: true }
        );

        if (!submittedAssignment) {
          removeFile(fileName);
          return res.status(400).send("the assignment cannot be update!");
        }
      } else {
        //if assignment is already submitted and no submitted assignment id is provided then throw below error
        removeFile(fileName);
        return res
          .status(400)
          .send(
            "File is already submitted, please provide submitted assignment id to update existing file"
          );
      }
    }

    assignment = await assignment.save();
    if (!assignment) return res.status(500).send("The File cannot be uploaded");
    res.status(200).send(assignment);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

module.exports = router;
