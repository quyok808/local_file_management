const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

let activeFiles = [];

module.exports = {
  openWindowsFile(filePath) {
    exec(`start "" "${filePath}"`);
  },

  addActiveFile(filePath) {
    if (!activeFiles.includes(filePath)) activeFiles.push(filePath);
  },

  async checkOpenStatus() {
    const results = await Promise.all(
      activeFiles.map(async (file) => {
        let filePath = path.normalize(file);

        try {
          const fd = fs.openSync(
            Buffer.from(filePath, "utf8").toString(),
            "r+"
          );
          fs.closeSync(fd);

          activeFiles = activeFiles.filter((f) => f !== file);
          return { filePath: filePath.replaceAll("\\", "/"), isOpen: false };
        } catch (err) {
          if (err.code === "EPERM" || err.code === "EBUSY") {
            return { filePath: filePath.replaceAll("\\", "/"), isOpen: true };
          } else {
            activeFiles = activeFiles.filter((f) => f !== file);
            return { filePath: filePath.replaceAll("\\", "/"), isOpen: false };
          }
        }
      })
    );

    return results;
  },
};
