require("dotenv").config();


// const db = require("./config/db");
// db();
const app = require("./app");
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server  runing on 3000`);
});
