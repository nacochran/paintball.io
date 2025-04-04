DROP DATABASE IF EXISTS paintball_db;
CREATE DATABASE paintball_db;

\c paintball_db;

-- Users who are registered but not verified yet
CREATE TABLE unverified_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    token_expires_at TIMESTAMPTZ NOT NULL,  -- Token expires in 5 minutes
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP  -- User expires in 7 days
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE arenas (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(100) UNIQUE NOT NULL,
    arena_creator VARCHAR(300) NOT NULL,
    state VARCHAR(25) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

