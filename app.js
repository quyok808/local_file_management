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

function normalizePath(p) {
  if (!p || typeof p !== "string") return "";

  p = p.replace(/^['"]|['"]$/g, "");

  p = p.replaceAll("\\", "/");

  if (/^[A-Za-z]:[^/]/.test(p)) {
    p = p[0] + ":/" + p.slice(2);
  }

  return p;
}

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
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;

  try {
    let rawContent = fs.readFileSync(filePath, "utf-8").trim();

    if (rawContent.includes("\\") && !rawContent.includes("\\\\")) {
      rawContent = rawContent.replace(/\\/g, "\\\\");
    }

    const imported = JSON.parse(rawContent);
    if (!Array.isArray(imported)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "JSON must be an array" });
    }

    const normalized = imported
      .map((item) => {
        if (item && typeof item === "object" && typeof item.path === "string") {
          return { ...item, path: normalizePath(item.path) };
        }
        if (typeof item === "string") {
          return { path: normalizePath(item) };
        }
        return null;
      })
      .filter(Boolean);

    let existing = [];
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8").trim();
      if (data) existing = JSON.parse(data);
    }

    const merged = [...existing, ...normalized];
    fs.writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), "utf-8");
    fs.unlinkSync(filePath);

    res.json({ ok: true, added: normalized.length, total: merged.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
});
