let express = require("express");
let path = require("path");
let pg = require("pg");
let app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let port = 3000;
let hostname = "localhost";

let env = require("../env.json");
let { response } = require("express");
let Pool = pg.Pool;
let pool = new Pool(env);
pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/feed", (req, res) => {
  console.log("POST request body: ", req.body);
  let post = req.body.post;
  console.log(post);

  pool
    .query(
      `INSERT INTO posts (post) 
       VALUES ($1)
       RETURNING *`,
      [post]
    )
    .then((result) => {
      res.status(200).send();
      console.log("Inserted:");
      console.log(result.rows);
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
