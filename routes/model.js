const express = require("express");
const router = express.Router();
const { QuizUser } = require("../models/quiz-user");
const { AssignmentUser } = require("../models/assignment-user");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const tf = require("@tensorflow/tfjs-node");
const Question = require("../models/question");
const { Quiz } = require("../models/quiz");
const { Assignment } = require("../models/assignment");
const { Course } = require("../models/course");

router.post("/train", async (req, res) => {
  try {
    const user = req.query.user;
    if (!mongoose.isValidObjectId(user)) {
      return res.status(400).send("Invalid User Id");
    }

    const adminUser = await User.findOne({ _id: user });

    if (!adminUser || !adminUser.isAdmin) {
      return res.status(400).send("You are not authorized to train model");
    }

    assignments = await AssignmentUser.find();
    if (!assignments) {
      return res.status(400).send("No Assignments available");
    }
    let quizzes = await QuizUser.find();
    if (!quizzes) {
      return res.status(400).send("No Quizzes available");
    }
    // Prepare data for training
    const quizScores = quizzes.map((q) => q.score);
    const assignmentScores = assignments.map((a) => a.score);
    const inputFeatures = quizScores.map((quizScore, index) => [
      quizScore,
      assignmentScores[index],
    ]);

    const targetData = quizScores.map((quizScore) => [
      quizScore / 10,
      quizScore / 20,
      quizScore / 30,
    ]); // Example target data based on the problem

    // Normalize input features
    const inputMax = inputFeatures.map((feature) => Math.max(...feature));
    const inputMin = inputFeatures.map((feature) => Math.min(...feature));
    const normalizedInput = inputFeatures.map((feature, idx) =>
      feature.map(
        (value, i) => (value - inputMin[i]) / (inputMax[i] - inputMin[i])
      )
    );

    // Convert data to TensorFlow tensors
    const inputTensor = tf.tensor2d(normalizedInput);
    const targetTensor = tf.tensor2d(targetData);

    // Define and improve the model architecture
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 64, activation: "relu", inputShape: [2] })
    );
    model.add(tf.layers.dropout(0.2)); // Adding dropout for regularization
    model.add(tf.layers.dense({ units: 32, activation: "relu" }));
    model.add(tf.layers.dense({ units: 3, activation: "sigmoid" })); // Sigmoid for regression

    model.compile({
      optimizer: "adam",
      loss: "meanSquaredError", // Change to an appropriate regression loss function
    });

    // Train the model with validation data
    async function trainModel() {
      const history = await model.fit(inputTensor, targetTensor, {
        epochs: 50,
        batchSize: 1,
        validationSplit: 0.2, // Allocate a portion for validation
        callbacks: tf.node.tensorBoard("logs"), // Enable TensorBoard for monitoring
      });
    }

    // Initialize model training
    await trainModel();
    await model.save("file://recommender-model");
    return res.status(200).send({
      message:
        "Model trained and saved successfully, server is restarting to get optimized results",
    });
  } catch (error) {
    if (error instanceof ReferenceError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: `${error}` });
  }
});

router.get("/recommended", async (req, res) => {
  try {
    const user = req.query.user;
    if (user && !mongoose.isValidObjectId(user)) {
      return res.status(400).send("Invalid User Id");
    }

    const currentUser = await User.findById(user);
    let courses = await Course.find({ _id: { $in: currentUser.courses } });
    if (!courses || !courses.length) {
      return res
        .status(400)
        .send("No Course selected yet, please select course first");
    }
    const loadedModel = await tf.loadLayersModel(
      "file://recommender-model/model.json"
    );
    let assignments = await AssignmentUser.find({ user: currentUser.id });
    let quizzes = await QuizUser.find({ user: currentUser.id });

    if (
      (!assignments || !assignments.length) &&
      (!quizzes || !quizzes.length)
    ) {
      assignments = await AssignmentUser.find();
      quizzes = await QuizUser.find();
    }

    const quizScores = quizzes.map((scoreObj) =>
      scoreObj.quiz ? scoreObj.score : 0
    );
    const assignmentScores = assignments.map((scoreObj) =>
      scoreObj.assignment ? scoreObj.score : 0
    );

    // Create input features for prediction
    const predictionInput = quizScores.map((quizScore, index) => [
      quizScore,
      assignmentScores[index] ? assignmentScores[index] : 0,
    ]);

    // Check for NaN values in the prediction input and replace them with defaults
    const sanitizedPredictionInput = predictionInput.map((input) =>
      input.map((value) => (isNaN(value) ? 0 : value))
    );

    // Convert the sanitized prediction input to a tensor
    const predictionInputTensor = tf.tensor2d(sanitizedPredictionInput);

    // Get recommendations for the new student using the loaded model
    const recommendations = loadedModel.predict(predictionInputTensor);

    // Extract predictions from the tensor
    const predictions = recommendations.arraySync();

    // Process predictions to identify recommended items
    if (predictions && predictions.length > 0) {
      const maxProbabilityIndex = predictions[0].indexOf(
        Math.max(...predictions[0])
      );

      const recommendedItem = {
        quiz:
          maxProbabilityIndex >= 0
            ? quizzes[maxProbabilityIndex] || null
            : null,
        assignment:
          maxProbabilityIndex >= 0
            ? assignments[maxProbabilityIndex] || null
            : null,
        probability:
          maxProbabilityIndex >= 0
            ? predictions[0][maxProbabilityIndex]
            : undefined,
      };
      let recommendedData = {
        recommendedQuiz: null,
        recommendedAssignment: null,
      };
      if (recommendedItem.quiz) {
        let recQuiz = (recommendedData.recommendedQuiz = [
          await Quiz.findById(recommendedItem.quiz.quiz).populate("questions"),
        ]);
      }
      if (recommendedItem.assignment) {
        recommendedData.recommendedAssignment = [
          await Assignment.findById(
            recommendedItem.assignment.assignment
          ).populate("studentAssignments"),
        ];
      }
      return res.json(recommendedData);
    }
  } catch (error) {
    if (error instanceof ReferenceError) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error });
  }
});

module.exports = router;
