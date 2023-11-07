DROP DATABASE IF EXISTS musify;
CREATE DATABASE musify;
\c musify;
CREATE TABLE userdata (
    id SERIAL PRIMARY KEY,
    username VARCHAR(15),
    hashedPassword VARCHAR(100)
);