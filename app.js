let express = require("express");
let path = require("path");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let bcrypt = require("bcrypt");

let app = express();
app.use(express.json());

module.exports = app;

let dbPath = path.join(__dirname, "userData.db");

let db = null;

let initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running Successfully...!!!");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  let checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = "${username}";
    `;
  let dbUser = await db.get(checkUserQuery);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let addUserQuery = `
            INSERT INTO user
            (username, name, password, gender, location)
            VALUES ("${username}", "${name}", "${hashedPassword}", "${gender}", "${location}");
        `;
      await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    console.log(dbUser);
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = "${username}";
    `;
  let dbUser = await db.get(checkUserQuery);

  if (dbUser === undefined) {
    console.log(dbUser);
    response.status(400);
    response.send("Invalid user");
  } else {
    let isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  let { username, oldPassword, newPassword } = request.body;
  let checkUserQuery = `
        SELECT *
        FROM user
        WHERE username = "${username}";
    `;
  let dbUser = await db.get(checkUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        let newHashedPassword = await bcrypt.hash(newPassword, 10);
        let updatePasswordQuery = `
                UPDATE user
                SET password = "${newHashedPassword}"
                WHERE username = "${username}";
            `;

        await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

