class FileModel {
  constructor({ id, title, path, lastAccess }) {
    this.id = id;
    this.title = title;
    this.path = path;
    this.lastAccess = lastAccess ?? "";
  }
}

export default FileModel;
