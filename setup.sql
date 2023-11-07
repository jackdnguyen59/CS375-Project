CREATE DATABASE userdata;
\c userdata
CREATE TABLE posts (
	id SERIAL PRIMARY KEY,
	post VARCHAR(250)
)
