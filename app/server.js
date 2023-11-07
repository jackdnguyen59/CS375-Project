let express = require("express");
let { Pool } = require("pg");
let bcrypt = require("bcrypt");
let env = require("../env.json");

let path = require("path");
let app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let port = 3000;
let hostname = "localhost";

let pool = new Pool(env);
pool.connect().then(() => {
    console.log("Connected to database");
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
                    "INSERT INTO userdata (username, hashedPassword) VALUES ($1, $2)",
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

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});  