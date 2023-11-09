# CS375-Project: Musify
Getting Started:
- Download repo
- Open CS375-Project/env_sample.json and replace USERNAME and PASSWORD with your Postgres username/password (if you didn’t choose a password when installing Postgres, it’ll be the empty string). If your Postgres username isn’t postgres, replace the username in the package.json “setup” command as well.
- Open CS375-Project/app/server.js and change this line: `let env = require("../env.json");` to `let env = require("../env_sample.json");`
- cd into CS375-Project/
- Run `npm i`
- Run `npm run setup`
- Run `npm run start`