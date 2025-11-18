const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ROUTES
app.use("/api/paths", require("./routes/file.route"));
app.use("/api/qr", require("./routes/qrRoutes"));

module.exports = app;
