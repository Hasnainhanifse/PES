const express = require("express");
const router = express.Router();
const ResponseResult = require("../helpers/DTO");
const { Videos } = require("../models/videos");
const mongoose = require("mongoose");

// get all Videos
router.get("/", async (req, res) => {
  try {
    const { levelType } = req.query;
    let videos;
    if (levelType) {
      videos = await Videos.find({ level: levelType });
    } else {
      videos = await Videos.find();
    }

    if (!videos) {
      return res.status(400).send("No Videos available");
    }
    let result = ResponseResult(videos.length, videos);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// create one video
router.post("/", async (req, res) => {
  try {
    const { title, description, video, level } = req.body;
    if (!title || !description || !level || !video) {
      return res.status(400).send("Please fill all fields");
    }

    //creating new video
    let newVideo = new Videos({
      title,
      description,
      level,
      video,
    });
    newVideo = await newVideo.save();
    if (!newVideo) {
      return res.status(500).send("The video cannot be updated");
    }

    res.status(200).send(newVideo);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

// update video
router.put("/:id", async (req, res) => {
  try {
    const { title, description, video, level } = req.body;
    const videoId = req.params.id;
    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      return res.status(400).send("Please provide valid video Id");
    }

    //check if video is available
    let existingVideo = await Videos.findById(videoId);
    if (!existingVideo) {
      return res.status(400).send("Invalid video");
    }

    let updatedVideo = await Videos.findByIdAndUpdate(
      videoId,
      {
        title: title ? title : existingVideo.title,
        description: description ? description : existingVideo.description,
        level: level ? level : existingVideo.level,
        video: video ? video : existingVideo.video,
        created: existingVideo.created,
      },
      { new: false }
    );
    if (!updatedVideo) {
      return res.status(500).send("the video cannot be update!");
    }

    existingVideo = await Videos.findById(videoId);
    res.status(200).send(existingVideo);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

// delete video
router.delete("/:id", async (req, res) => {
  try {
    const videoId = req.params.id;
    if (!videoId || !mongoose.isValidObjectId(videoId)) {
      return res.status(400).send("Please provide valid video Id");
    }

    Videos.findByIdAndRemove(videoId)
      .then((video) => {
        if (video) {
          return res
            .status(200)
            .json({ success: true, message: "the video is deleted!" });
        } else {
          return res
            .status(404)
            .json({ success: false, message: "video not found!" });
        }
      })
      .catch((err) => {
        return res.status(500).json({ success: false, error: err });
      });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

module.exports = router;
