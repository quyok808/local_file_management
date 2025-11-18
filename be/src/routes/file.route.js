const express = require("express");
const multer = require("multer");
const fileControllers = require("../controllers/file.controllers");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", fileControllers.getPaths);
router.post("/", fileControllers.savePaths);
router.post("/open", fileControllers.openFile);
router.get("/is-open", fileControllers.isOpen);
router.post("/import-json", upload.single("file"), fileControllers.importJson);

module.exports = router;
