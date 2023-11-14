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
let redirect_uri = 'http://localhost:3000/callback';

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

app.get('/callback', function(req, res) {
    // application requests refresh and access tokens
    // after checking the state parameter

    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;
  
    if (state === null || state !== storedState) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      res.clearCookie(stateKey);
      let authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            let access_token = body.access_token,
                refresh_token = body.refresh_token;

            // Use the access token to get user details
            let options = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
            };

            request.get(options, async function(error, response, userBody) {
                if (!error && response.statusCode === 200) {
                    // Save user details and access token to the database
                    try {
                        let result = await pool.query(
                            'INSERT INTO accountinfo (spotify_id, display_name, access_token, refresh_token) VALUES ($1, $2, $3, $4) ON CONFLICT (spotify_id) DO NOTHING RETURNING *',
                            [userBody.id, userBody.display_name, access_token, refresh_token]
                        );                        
                        res.redirect('/feed.html');
                    } catch (dbError) {
                        console.error('Error saving user details to the database:', dbError);
                        res.redirect('/#' +
                            querystring.stringify({
                                error: 'db_error'
                            }));
                    }
                } else {
                    res.redirect('/#' +
                        querystring.stringify({
                            error: 'invalid_user_data'
                        }));
                }
            });
        } else {
            res.redirect('/#' +
                querystring.stringify({
                    error: 'invalid_token'
                }));
            }
        });
    }
});

app.get('/refresh_token', function(req, res) {
    let refresh_token = req.query.refresh_token;
    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 
        'content-type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) 
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        let access_token = body.access_token,
            refresh_token = body.refresh_token;
        res.send({
          'access_token': access_token,
          'refresh_token': refresh_token
        });
      }
    });
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
