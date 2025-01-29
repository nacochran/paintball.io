DROP DATABASE IF EXISTS paintball_db;
CREATE DATABASE paintball_db;

USE paintball_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO users (name, email) VALUES 
('John Doe', 'john@example.com'), 
('Jane Smith', 'jane@example.com');