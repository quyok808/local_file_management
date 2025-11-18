const fs = require("fs");
const fileUtils = require("../configs/fileConfig");
const { Resource } = require("../constants/appConstants");

module.exports = {
  getQR(req, res) {
    if (!fileUtils.fileExists(Resource.qrPath)) return res.json([]);
    res.json(fileUtils.readJson(Resource.qrPath));
  },

  saveQR(req, res) {
    const list = Array.isArray(req.body) ? req.body : [];
    fileUtils.writeJson(Resource.qrPath, list);
    res.json({ ok: true });
  },

  importQR(req, res) {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const filePath = req.file.path;
      const imported = fileUtils.safeParse(fileUtils.readText(filePath));

      if (!Array.isArray(imported))
        return res.status(400).json({ error: "JSON must be an array" });

      let existing = fileUtils.fileExists(Resource.qrPath)
        ? fileUtils.readJson(Resource.qrPath)
        : [];

      const merged = [...existing, ...imported];

      fileUtils.writeJson(Resource.qrPath, merged);
      fileUtils.deleteFile(filePath);

      res.json({ ok: true, added: imported.length, total: merged.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
