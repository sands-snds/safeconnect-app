-- ========================================
-- SAFECONNECT DATABASE SCHEMA
-- ========================================
-- Rebuilt to match the actual application code (models/controllers/frontend),
-- not the older phpMyAdmin export. Run with: mysql -u root -p < safeconnect_db.sql
--
-- Database name matches backend/.env (DB_NAME=safeconnect).

DROP DATABASE IF EXISTS safeconnect;
CREATE DATABASE safeconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE safeconnect;

-- --------------------------------------------------------
-- registered_users
-- --------------------------------------------------------
CREATE TABLE registered_users (
  id INT(11) NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) DEFAULT NULL,
  contact_number VARCHAR(20) DEFAULT NULL,
  email_address VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL, -- bcrypt hash
  role VARCHAR(20) NOT NULL DEFAULT 'resident', -- 'resident' | 'admin'
  photo_url TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Active', -- Active / Pending / Suspended / Closed
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
  report_reference VARCHAR(50) DEFAULT NULL,
  reporter_id INT(11) DEFAULT NULL,
  time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  emergency_type VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  incident_details TEXT NOT NULL,
  number_of_people_affected VARCHAR(20) DEFAULT NULL,
  special_needs TEXT DEFAULT NULL,
  photo_url LONGTEXT DEFAULT NULL,
  media_type VARCHAR(20) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Received',
  assigned_to INT(11) DEFAULT NULL,
  assigned_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY reporter_id (reporter_id),
  CONSTRAINT fk_emergency_reporter FOREIGN KEY (reporter_id) REFERENCES registered_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- assistance_requests
-- --------------------------------------------------------
CREATE TABLE assistance_requests (
  id INT(11) NOT NULL AUTO_INCREMENT,
  report_reference VARCHAR(50) DEFAULT NULL,
  reporter_id INT(11) DEFAULT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_assistance_type VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50) NOT NULL,
  email_address VARCHAR(255) DEFAULT NULL,
  current_location TEXT NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  number_of_people_needing_help INT(11) DEFAULT 1,
  urgency_level VARCHAR(50) NOT NULL,
  describe_your_situation TEXT NOT NULL,
  special_needs TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Received', -- Received -> In Progress -> Resolved (forward-only)
  PRIMARY KEY (id),
  KEY reporter_id (reporter_id),
  CONSTRAINT fk_assistance_reporter FOREIGN KEY (reporter_id) REFERENCES registered_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- petty_crimes
-- --------------------------------------------------------
CREATE TABLE petty_crimes (
  id INT(11) NOT NULL AUTO_INCREMENT,
  report_reference VARCHAR(50) DEFAULT NULL,
  reporter_id INT(11) DEFAULT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  crime_type VARCHAR(100) NOT NULL,
  reporter_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(50) DEFAULT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  description TEXT NOT NULL,
  suspect_info TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Received',
  PRIMARY KEY (id),
  KEY reporter_id (reporter_id),
  CONSTRAINT fk_pettycrime_reporter FOREIGN KEY (reporter_id) REFERENCES registered_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- announcements
-- --------------------------------------------------------
CREATE TABLE announcements (
  id INT(11) NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  date_posted DATE NOT NULL,
  image_path TEXT DEFAULT NULL,
  source_url TEXT DEFAULT NULL,
  source_title VARCHAR(255) DEFAULT NULL,
  source_image TEXT DEFAULT NULL,
  source_site VARCHAR(255) DEFAULT NULL,
  created_by INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY created_by (created_by),
  CONSTRAINT fk_announcement_author FOREIGN KEY (created_by) REFERENCES registered_users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- notifications
-- --------------------------------------------------------
CREATE TABLE notifications (
  id INT(11) NOT NULL AUTO_INCREMENT,
  user_id INT(11) DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(100) DEFAULT NULL,
  reference_id INT(11) DEFAULT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY user_id (user_id),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES registered_users (id) ON DELETE CASCADE
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


-- --------------------------------------------------------
-- admin account
-- --------------------------------------------------------
INSERT INTO registered_users
(full_name, username, contact_number, email_address, password, role, status)
VALUES (
  'admin',
  'admin',
  NULL,
  'admin@safeconnect.org',
  '$2b$10$ctsjB6pqsfYIQqsUM5IW3uGszwUhw9P/0i0I9pthQiP87brjfTTpG',
  'admin',
  'Active'
);