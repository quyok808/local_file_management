const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = 2502;
const DATA_FILE = path.resolve("./paths.json");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
let activeFiles = [];
const upload = multer({ dest: "uploads/" });

app.get("/api/paths", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  res.json(data);
});

app.post("/api/paths", (req, res) => {
  const list = (req.body || []).map((item) => ({
    ...item,
    path: item.path ? item.path.replaceAll("\\", "/") : "",
  }));
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  res.json({ ok: true });
});

app.post("/api/open", (req, res) => {
  let filePath = req.body.path.replaceAll("/", "\\");
  if (/^[A-Za-z]:[^\\]/.test(filePath))
    filePath = filePath[0] + ":\\" + filePath.slice(2);
  if (!fs.existsSync(filePath))
    return res.status(400).json({ error: "File not found" });

  if (!activeFiles.includes(filePath)) activeFiles.push(filePath);
  exec(`start "" "${filePath}"`);
  res.json({ ok: true });
});

app.get("/api/is-open", async (req, res) => {
  const statusList = await Promise.all(
    activeFiles.map(async (file) => {
      let filePath = path.normalize(file);
      try {
        const fd = fs.openSync(Buffer.from(filePath, "utf8").toString(), "r+");
        fs.closeSync(fd);

        activeFiles = activeFiles.filter((f) => f !== file);
        return { filePath: filePath.replaceAll("\\", "/"), isOpen: false };
      } catch (err) {
        if (err.code === "EPERM" || err.code === "EBUSY") {
          return { filePath: filePath.replaceAll("\\", "/"), isOpen: true };
        } else if (err.code === "ENOENT") {
          activeFiles = activeFiles.filter((f) => f !== file);
          return { filePath: filePath.replaceAll("\\", "/"), isOpen: false };
        } else {
          console.error("Unexpected error:", err);
          return { filePath: filePath.replaceAll("\\", "/"), isOpen: null };
        }
      }
    })
  );

  res.json(statusList);
});

app.post("/api/import-json", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  try {
    const imported = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(imported))
      return res.status(400).json({ error: "Invalid JSON format" });

    let existing = [];
    if (fs.existsSync(DATA_FILE))
      existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));

    const merged = [...existing, ...imported];
    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2));
    fs.unlinkSync(filePath);
    res.json({ ok: true, added: imported.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
});
