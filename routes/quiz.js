const express = require("express");
const router = express.Router();
const Question = require("../models/question");
const Quiz = require("../models/quiz").Quiz;
const ResponseResult = require("../helpers/DTO");
const User = require("../models/user");
const mongoose = require("mongoose");

const USERLEVEL = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  EXPERT: "EXPERT",
};

async function getQuizDetails(quizes) {
  if (quizes && quizes.length) {
    let quizWithQuestions = Promise.all(
      quizes.map(async (quiz) => {
        if (quiz.questions && quiz.questions.length) {
          quiz.questions = await Question.find({
            _id: { $in: quiz.questions },
          }).exec();
          return quiz;
        }
      })
    );
    return await quizWithQuestions;
  } else {
    quizes.questions = await Question.find({
      _id: { $in: quizes.questions },
    }).exec();
    return quizes;
  }
}

//Quiz routes
// get all quiz
router.get("/", async (req, res) => {
  try {
    const levelType = req.query.level;
    if (levelType) {
      await Quiz.find({ level: levelType }, async (err, quizes) => {
        if (err) {
          res.status(500).json({ error: err });
        }
        let QuizDetails = await getQuizDetails(quizes);
        let result = ResponseResult(QuizDetails.length, QuizDetails);
        res.json(result);
      });
    } else {
      let allQuizes = await Quiz.find();
      let QuizDetails = await getQuizDetails(allQuizes);
      let result = ResponseResult(QuizDetails.length, QuizDetails);
      res.status(200).json(result);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// get one quiz
router.get("/:id", async (req, res) => {
  try {
    const _id = req.params.id;

    const quiz = await Quiz.findOne({ _id });
    if (!quiz) {
      return res.status(404).json({});
    } else {
      let QuizDetails = await getQuizDetails(quiz);
      let result = ResponseResult(QuizDetails.length, QuizDetails);
      return res.status(200).json(result);
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

// create one quiz
router.post("/", async (req, res) => {
  try {
    const { name, level, questions, users, submittedUsers } = req.body;
    if (name && level && questions) {
      const savedQuestions = Promise.all(
        questions.map(async (question) => {
          let newQuestion = new Question({
            description: question.description,
            alternatives: [...question.alternatives],
          });

          newQuestion = await newQuestion.save();

          return newQuestion;
        })
      );

      const savedQuestionsResolved = await savedQuestions;

      let quiz = new Quiz({
        name: name,
        level: level,
        questions: savedQuestionsResolved,
        users: users,
        submittedUsers: submittedUsers,
      });
      quiz = await quiz.save();
      if (!quiz) return res.status(400).send("The Quiz cannot be created!");

      let result = ResponseResult(quiz.length, quiz);
      return res.status(200).send(result);
    }
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

// delete one quiz
router.delete("/:id", async (req, res) => {
  try {
    const _id = req.params.id;

    const quiz = await Quiz.deleteOne({ _id });

    if (quiz.deletedCount === 0) {
      return res.status(404).json();
    } else {
      return res.status(204).json();
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

//submit quiz
router.post("/submit", async (req, res) => {
  try {
    const { currentUser, correctAnswers, quizId } = req.body;

    if (
      !mongoose.isValidObjectId(quizId) ||
      !mongoose.isValidObjectId(currentUser)
    ) {
      return res.status(400).send("Invalid Quiz Id or missing current user id");
    }

    let quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(400).send("Quiz id is not valid");
    }
    if (quiz.submittedUsers.includes(currentUser)) {
      return res.status(400).send("Quiz is already submitted");
    }
    quiz.submittedUsers = [...quiz.submittedUsers, currentUser];
    await quiz.save();
    return res.status(200).json(quiz);
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

//Questions routes

// get one quiz question
router.get("/questions/:id", async (req, res) => {
  try {
    const _id = req.params.id;

    const question = await Question.findOne({ _id });
    if (!question) {
      return res.status(404).json({});
    } else {
      return res.status(200).json(question);
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

// create one quiz question
router.post("/questions", async (req, res) => {
  try {
    const { description } = req.body;
    const { alternatives } = req.body;

    const question = await Question.create({
      description,
      alternatives,
    });

    return res.status(201).json(question);
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

// update one quiz question
router.put("/questions/:id", async (req, res) => {
  try {
    const _id = req.params.id;
    const { description, alternatives } = req.body;

    let question = await Question.findOne({ _id });

    if (!question) {
      question = await Question.create({
        description,
        alternatives,
      });
      return res.status(201).json(question);
    } else {
      question.description = description;
      question.alternatives = alternatives;
      await question.save();
      return res.status(200).json(question);
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

// delete one quiz question
router.delete("/questions/:id", async (req, res) => {
  try {
    const _id = req.params.id;

    const question = await Question.deleteOne({ _id });

    if (question.deletedCount === 0) {
      return res.status(404).json();
    } else {
      return res.status(204).json();
    }
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});

module.exports = router;
