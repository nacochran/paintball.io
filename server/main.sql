DROP DATABASE IF EXISTS paintball_db;
CREATE DATABASE paintball_db;

USE paintball_db;

-- Users who are registered but not verified yet
CREATE TABLE unverified_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    verification_code CHAR(6) NOT NULL,
    token_expires_at DATETIME NOT NULL,  -- Token expires in 5 minutes
    created_at DATETIME NOT NULL DEFAULT NOW()  -- User expires in 7 days
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);