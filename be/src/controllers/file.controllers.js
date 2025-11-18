const fs = require("fs");
const fileOpen = require("../utils/fileOpenUtils");
const fileUtils = require("../configs/fileConfig");
const { Resource } = require("../constants/appConstants");

module.exports = {
  // GET LIST
  getPaths(req, res) {
    if (!fileUtils.fileExists(Resource.filePath)) return res.json([]);
    const data = fileUtils.readJson(Resource.filePath);
    res.json(data);
  },

  // SAVE LIST
  savePaths(req, res) {
    const list = (req.body || []).map((item) => ({
      ...item,
      path: fileUtils.normalizePath(item.path),
    }));

    fileUtils.writeJson(Resource.filePath, list);
    res.json({ ok: true });
  },

  // OPEN FILE (Windows)
  openFile(req, res) {
    let filePath = fileUtils.toWindowsPath(req.body.path);

    if (!fileUtils.fileExists(filePath))
      return res.status(400).json({ error: "File not found" });

    fileOpen.addActiveFile(filePath);
    fileOpen.openWindowsFile(filePath);

    res.json({ ok: true });
  },

  // CHECK OPEN STATUS
  async isOpen(req, res) {
    const results = await fileOpen.checkOpenStatus();
    res.json(results);
  },

  // IMPORT JSON
  importJson(req, res) {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;

    try {
      let raw = fileUtils.readText(filePath);

      // Fix Windows path
      if (raw.includes("\\") && !raw.includes("\\\\")) {
        raw = raw.replace(/\\/g, "\\\\");
      }

      const imported = JSON.parse(raw);

      if (!Array.isArray(imported)) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: "JSON must be an array" });
      }

      const normalized = imported.map((item) => ({
        path: fileUtils.normalizePath(item.path ?? item),
      }));

      let existing = fileUtils.fileExists(Resource.filePath)
        ? fileUtils.readJson(Resource.filePath)
        : [];

      const merged = [...existing, ...normalized];

      fileUtils.writeJson(Resource.filePath, merged);
      fs.unlinkSync(filePath);

      res.json({ ok: true, added: normalized.length, total: merged.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
