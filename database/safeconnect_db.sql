-- ========================================
-- SAFECONNECT DATABASE SCHEMA (REBUILT)
-- ========================================
-- Run this in phpMyAdmin (or `mysql -u root -p < schema.sql`)
-- This DROPS and recreates the database from scratch.

DROP DATABASE IF EXISTS safeconnect_db;
CREATE DATABASE safeconnect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE safeconnect_db;

-- --------------------------------------------------------
-- registered_users
-- --------------------------------------------------------
CREATE TABLE registered_users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) DEFAULT NULL,
  contact_number VARCHAR(20) DEFAULT NULL,
  email_address VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL, -- stores a bcrypt hash, not plaintext
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email_address (email_address),
  UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- emergency_reports
-- --------------------------------------------------------
CREATE TABLE emergency_reports (
  id INT(11) NOT NULL AUTO_INCREMENT,
  time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  emergency_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  location TEXT NOT NULL,
  incident_details TEXT NOT NULL,
  number_of_people_affected INT(11) DEFAULT 0,
  photo_url TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Received',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- assistance_requests
-- --------------------------------------------------------
CREATE TABLE assistance_requests (
  id INT(11) NOT NULL AUTO_INCREMENT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_assistance_type VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  current_location TEXT NOT NULL,
  number_of_people_needing_help INT(11) DEFAULT 1,
  urgency_level VARCHAR(50) NOT NULL,
  describe_your_situation TEXT NOT NULL,
  special_needs TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- announcements (new)
-- --------------------------------------------------------
CREATE TABLE announcements (
  id INT(11) NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  date_posted DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- petty_crimes
-- --------------------------------------------------------
CREATE TABLE petty_crimes (
  id INT(11) NOT NULL AUTO_INCREMENT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crime_type VARCHAR(100) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50) DEFAULT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  suspect_info TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Received',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- signin_logs
-- --------------------------------------------------------
CREATE TABLE signin_logs (
  id INT(11) NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) DEFAULT NULL,
  email_address VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- admin_logs
-- --------------------------------------------------------
CREATE TABLE admin_logs (
  id INT(11) NOT NULL AUTO_INCREMENT,
  email_address VARCHAR(255) NOT NULL,
  login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;