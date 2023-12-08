let express = require("express");
let path = require("path");
let pg = require("pg");
let bcrypt = require("bcrypt");
let request = require("request");
let crypto = require("crypto");
let cors = require("cors");
let querystring = require("querystring");
let cookieParser = require("cookie-parser");
let ejs = require("ejs");

let env = require("../env.json");

let client_id = env.CLIENT_ID;
let client_secret = env.CLIENT_SECRET;
let redirect_uri = env.REDIRECT_URI;

let generateRandomString = (length) => {
  return crypto.randomBytes(60).toString("hex").slice(0, length);
};

let stateKey = "spotify_auth_state";
let app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app
  .use(express.static(__dirname + "/public"))
  .use(cors())
  .use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

let port = 3000;
let hostname = "localhost";

let { response } = require("express");
let { parseArgs } = require("util");
let Pool = pg.Pool;
let pool = new Pool(env);
pool.connect().then(function () {
  console.log(`Connected to database ${env.database}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", function (req, res) {
  let state = generateRandomString(16);
  res.cookie(stateKey, state);

  let scope = "user-read-private user-read-email";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

app.get("/callback", function (req, res) {
  // application requests refresh and access tokens
  // after checking the state parameter

  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    res.clearCookie(stateKey);
    let authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        let access_token = body.access_token,
          refresh_token = body.refresh_token;

        // Use the access token to get user details
        let options = {
          url: "https://api.spotify.com/v1/me",
          headers: { Authorization: "Bearer " + access_token },
          json: true,
        };

        request.get(options, async function (error, response, userBody) {
          if (!error && response.statusCode === 200) {
            // Save user details and access token to the database
            try {
              let result = await pool.query(
                "INSERT INTO accountinfo (spotify_id, display_name, access_token, refresh_token) VALUES ($1, $2, $3, $4) ON CONFLICT (spotify_id) DO NOTHING RETURNING *",
                [
                  userBody.id,
                  userBody.display_name,
                  access_token,
                  refresh_token,
                ]
              );
              //console.log(userBody);
              res.cookie("id", userBody.id);
              //res.render("feed", { user: userBody });
              res.redirect("/timeline");
            } catch (dbError) {
              console.error(
                "Error saving user details to the database:",
                dbError
              );
              res.redirect(
                "/#" +
                  querystring.stringify({
                    error: "db_error",
                  })
              );
            }
          } else {
            res.redirect(
              "/#" +
                querystring.stringify({
                  error: "invalid_user_data",
                })
            );
          }
        });
      } else {
        res.redirect(
          "/#" +
            querystring.stringify({
              error: "invalid_token",
            })
        );
      }
    });
  }
});

app.get("/refresh_token", function (req, res) {
  let refresh_token = req.query.refresh_token;
  let authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      let access_token = body.access_token,
        refresh_token = body.refresh_token;
      res.send({
        access_token: access_token,
        refresh_token: refresh_token,
      });
    }
  });
});

async function getUserDetailsFromDatabase(userId) {
    try {
        let queryResult = await pool.query(
            "SELECT * FROM accountinfo WHERE spotify_id = $1",
            [userId]
        );

        if (queryResult.rows.length > 0) {
            return queryResult.rows[0];
        } else {
            throw new Error("User not found");
        }
    } catch (error) {
        throw error;
    }
}

app.get("/feed", async (req, res) => {
    try {
        let posts = await pool.query("SELECT * FROM posts");
        res.status(200).json(posts.rows);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/timeline", async (req, res) => {
    try {
      let userId = req.cookies.id;
  
      if (!userId) {
        return res.status(401).send("User not authenticated");
      }
  
      let user = await getUserDetailsFromDatabase(userId);
  
      let userPosts = await pool.query(
        "SELECT spotify_id, post FROM posts WHERE spotify_id = $1",
        [userId]
      );
  
      res.render("feed", { user, userPosts });
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).send("Internal Server Error");
    }
});

app.post("/feed", (req, res) => {
  console.log("POST request body: ", req.body);
  let post = req.body.post;
  console.log(post);

  pool
    .query(
      `INSERT INTO posts (post, spotify_id) 
       VALUES ($1, $2)
       RETURNING *`,
      [post, req.cookies.id]
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

app.get("/profile", async (req, res) => {
    //console.log("hello");
    try {
      let userId = req.cookies.id;

      //console.log("id number: " + id);

      if (!userId) {
        return res.status(401).send("User not authenticated");
      }
  
      let user = await getUserDetailsFromDatabase(userId);

      let userPosts = await pool.query(
        "SELECT spotify_id, post FROM posts WHERE spotify_id = $1",
        [userId]
      );
      
      res.render("profile", { user, userPosts });

    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).send("Internal Server Error");
    }
});  

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
