const express = require("express");
const router = express.Router();
const ResponseResult = require("../helpers/DTO");
const { QuizUser } = require("../models/quiz-user");
const { AssignmentUser } = require("../models/assignment-user");
const mongoose = require("mongoose");

// get progress report
router.get("/", async (req, res) => {
  try {
    const { user } = req.query;
    if (!user || !mongoose.isValidObjectId(user)) {
      return res.status(400).send("Please provide valid user Id");
    }
    const assignments = await AssignmentUser.find({ user: user });
    const quizzes = await QuizUser.find({ user: user });

    // Combine data or perform computations as needed
    const combinedData = assignments.concat(quizzes);
    const transformedData =
      combinedData &&
      combinedData.map((item) => {
        if (item.assignment) {
          // For assignments
          return {
            type: "Assignment",
            name: item.name ? item.name : "Assignment",
            marks: item.score ? item.score : null,
            totalMarks: 10,
            submittedDate: item.submittedDate ? item.submittedDate : null,
          };
        } else if (item.quiz) {
          // For quizzes
          return {
            type: "Quiz",
            name: item.name ? item.name : "Quiz",
            marks: item.score ? item.score : null,
            totalMarks: 10,
          };
        }
      });
    let result = ResponseResult(transformedData.length, transformedData);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

module.exports = router;
