DROP DATABASE IF EXISTS userdata;
CREATE DATABASE userdata;
\c userdata
CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	post VARCHAR(250)
);
CREATE TABLE accountinfo (
    id SERIAL PRIMARY KEY,
    spotify_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    access_token VARCHAR(255),
    refresh_token VARCHAR(255)
);