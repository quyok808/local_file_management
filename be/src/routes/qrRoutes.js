const express = require("express");
const multer = require("multer");
const controller = require("../controllers/qrController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", controller.getQR);
router.post("/", controller.saveQR);
router.post("/import-json", upload.single("file"), controller.importQR);

module.exports = router;
