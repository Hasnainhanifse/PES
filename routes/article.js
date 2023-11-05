const express = require("express");
const router = express.Router();
const ResponseResult = require("../helpers/DTO");
const { Article } = require("../models/article");
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
    cb(uploadError, "public/uploads/articles/");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

const removeFile = (fileName) => {
  fs.unlink(`public/uploads/articles/${fileName}`, (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
};

// get all articles
router.get("/", async (req, res) => {
  try {
    const { levelType } = req.query;
    let articles;
    if (levelType) {
      //if level is provided in param then will find assignments whose level is provided in param
      articles = await Article.find({ level: levelType });
    } else {
      articles = await Article.find();
    }

    if (!articles) {
      return res.status(400).send("No Articles available");
    }
    let result = ResponseResult(articles.length, articles);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
});

// create one article
router.post("/", uploadOptions.single("image"), async (req, res) => {
  try {
    const { title, description, interest, level } = req.body;
    if (!title || !description || !interest) {
      return res.status(400).send("Please fill all fields");
    }
    const file = req.file;
    if (!file) return res.status(400).send("No File in the request");

    //setting file path and name
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get(
      "host"
    )}/public/uploads/articles/`;

    //creating new article
    let article = new Article({
      title,
      description,
      interest,
      level,
      image: `${basePath}${fileName}`,
    });
    article = await article.save();
    if (!article) {
      removeFile(fileName);
      return res.status(500).send("The File cannot be uploaded");
    }

    res.status(200).send(article);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

// update article
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    const { title, description, interest, level } = req.body;
    const articleId = req.params.id;
    if (!articleId || !mongoose.isValidObjectId(articleId)) {
      return res.status(400).send("Please provide valid article Id");
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

    //check if article is available
    let article = await Article.findById(articleId);
    if (!article) {
      removeFile(fileName);
      return res.status(400).send("Invalid Article");
    }

    let updatedArticle = await Article.findByIdAndUpdate(
      articleId,
      {
        title: title ? title : article.title,
        description: description ? description : article.description,
        interest: interest ? interest : article.interest,
        level: level ? level : article.level,
        image: fileName && basePath ? `${basePath}${fileName}` : article.image,
        created: article.created,
      },
      { new: false }
    );
    if (!updatedArticle) {
      removeFile(fileName);
      return res.status(500).send("the article cannot be update!");
    }

    article = await Article.findById(articleId);
    res.status(200).send(article);
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({ error: error });
  }
});

// update article
router.delete("/:id", async (req, res) => {
  try {
    const articleId = req.params.id;
    if (!articleId || !mongoose.isValidObjectId(articleId)) {
      return res.status(400).send("Please provide valid article Id");
    }

    Article.findByIdAndRemove(articleId)
      .then((article) => {
        if (article) {
          removeFile(article.image);
          return res
            .status(200)
            .json({ success: true, message: "the article is deleted!" });
        } else {
          return res
            .status(404)
            .json({ success: false, message: "article not found!" });
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
