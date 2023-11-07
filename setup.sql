DROP DATABASE IF EXISTS userdata;
CREATE DATABASE userdata;
\c userdata
CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	post VARCHAR(250)
);
CREATE TABLE accountinfo (
    id SERIAL PRIMARY KEY,
    username VARCHAR(15),
    hashedPassword VARCHAR(100)
);