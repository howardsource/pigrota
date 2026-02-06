-- The Blue Pig - Volunteer Rota
-- Database Setup Script
-- Run this in phpMyAdmin or MySQL command line

CREATE DATABASE IF NOT EXISTS blue_pig_rota;
USE blue_pig_rota;

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    volunteer_name VARCHAR(255),
    subtitle VARCHAR(255),
    date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL,
    custom_start_time VARCHAR(10),
    custom_end_time VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_events_date ON events(date);
