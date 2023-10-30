let express = require("express");
let path = require("path");
let app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let port = 3000;
let hostname = "localhost";

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, hostname, () => {
    console.log(`http://${hostname}:${port}`);
});  