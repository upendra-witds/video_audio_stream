require("dotenv").config();


// const db = require("./config/db");
// db();
const app = require("./app");
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server  runing on 3000`);
});
