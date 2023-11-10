let express = require("express");
let path = require("path");
let pg = require("pg");
let bcrypt = require("bcrypt");
let request = require('request');
let crypto = require('crypto');
let cors = require('cors');
let querystring = require('querystring');
let cookieParser = require('cookie-parser');

let client_id = '096e467573ed4dd8aa8bb1e452cb0996';
let client_secret = '234f5df19988444e840d92b7f61a6648';
let redirect_uri = 'http://localhost:8888/callback';

let generateRandomString = (length) => {
    return crypto
    .randomBytes(60)
    .toString('hex')
    .slice(0, length);
}
  
let stateKey = 'spotify_auth_state';
let app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

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

app.get('/login', function(req, res) {

    let state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    let scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
  });

/*
app.post("/login", (req, res) => {
    let { username, password } = req.body;

    pool.query('SELECT * FROM accountinfo WHERE username = $1', [username])
        .then((result) => {
            let user = result.rows[0];

            if (!user) {
                res.status(401).send({error: "Invalid credentials"});
            } else {
                bcrypt.compare(password, user.hashedpassword, (err, result) => {
                    if (result) {
                        res.status(200).send({message: "Login successful"});
                    } else {
                        res.status(401).send({error: "Invalid credentials"});
                    }
                });
            }
        })
        .catch((error) => {
            console.log(error);
            res.status(500).send();
        });
});
*/

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

let saltRounds = 10;

app.post("/signup", (req, res) => {
    let username = req.body.username;
    let plaintextPassword = req.body.plaintextPassword;
    let confirmPassword = req.body.confirmPassword;

    if (!username instanceof String || !plaintextPassword instanceof String) {
        console.log("not string");
        res.status(401).send();
    }
    else if (username.length < 4 || username.length > 15) {
        console.log("invalid username length");
        res.status(401).send();
    }
    else if (plaintextPassword.length < 4) {
        console.log("invalid password length");
        res.status(401).send();
    }
    else if (plaintextPassword != confirmPassword) {
        console.log("passwords dont match");
        res.status(401).send();
    }
    else {
        bcrypt
        .hash(plaintextPassword, saltRounds)
        .then((hashedPassword) => {
            pool
                .query(
                    "INSERT INTO accountinfo (username, hashedPassword) VALUES ($1, $2)",
                    [username, hashedPassword],
                )
                .then(() => {
                    console.log(username, "account created");
                    res.status(200).send();
                })
                .catch((error) => {
                    console.log(error);
                    res.status(500).send();
                });
        }).catch((error) => {
            console.log(error);
            res.status(500).send();
        });
    }
})

app.listen(port, hostname, () => {
  console.log(`http://${hostname}:${port}`);
});
