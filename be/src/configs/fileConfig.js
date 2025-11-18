const fs = require("fs");
const path = require("path");

module.exports = {
  // ==========================
  // 1) Chuẩn hóa đường dẫn
  // ==========================
  normalizePath(p) {
    if (!p || typeof p !== "string") return "";
    p = p.replace(/^['"]|['"]$/g, ""); // bỏ dấu ngoặc
    p = p.replaceAll("\\", "/"); // Windows → Unix
    if (/^[A-Za-z]:[^/]/.test(p)) {
      p = p[0] + ":/" + p.slice(2);
    }
    return p.trim();
  },

  ensureDir(file) {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  },
  // ==========================
  // 2) Liên quan đến Windows open file
  // ==========================
  toWindowsPath(p) {
    let result = p.replaceAll("/", "\\");
    if (/^[A-Za-z]:[^\\]/.test(result)) {
      result = result[0] + ":\\" + result.slice(2);
    }
    return result;
  },

  // ==========================
  // 3) Đọc JSON từ file (trả về array/object)
  // ==========================
  readJson(file, defaultValue = null) {
    if (!fs.existsSync(file)) return defaultValue;
    const text = fs.readFileSync(file, "utf-8").trim();
    return this.safeParse(text) ?? defaultValue;
  },

  // ==========================
  // 4) Ghi JSON vào file
  // ==========================
  writeJson(file, data) {
    try {
      this.ensureDir(file);
      fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (err) {
      console.error("Write JSON Error:", err);
      return false;
    }
  },

  // ==========================
  // 5) Đọc text thuần
  // ==========================
  readText(file) {
    if (!fs.existsSync(file)) return "";
    return fs.readFileSync(file, "utf-8").trim();
  },

  // ==========================
  // 6) Kiểm tra tồn tại
  // ==========================
  fileExists(file) {
    return fs.existsSync(file);
  },

  // ==========================
  // 7) Xóa file
  // ==========================
  deleteFile(file) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  },

  // ==========================
  // 8) Parse JSON an toàn
  // ==========================
  safeParse(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  },

  // ==========================
  // 9) Merge 2 list JSON
  // ==========================
  mergeJson(oldList, newList) {
    return [...oldList, ...newList];
  },

  // ==========================
  // 10) Lọc trùng theo field path
  // ==========================
  removeDuplicates(list, key = "path") {
    const map = {};
    return list.filter((item) => {
      const value = item[key];
      if (!value) return false;
      const k = value.toString().toLowerCase();
      if (map[k]) return false;
      map[k] = true;
      return true;
    });
  },

  // ==========================
  // 11) Validate JSON Array
  // ==========================
  validateJsonArray(json) {
    return Array.isArray(json);
  },
};
