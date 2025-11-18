const app = require("./src/app");
require("dotenv").config();

const port = process.env.PORT || 2502;

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
