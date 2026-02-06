<?php
/**
 * The Blue Pig - Volunteer Rota
 * Database Configuration
 * 
 * Update these settings to match your MySQL server
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'blue_pig_rota');
define('DB_USER', 'root');
define('DB_PASS', '');

// Create database connection
function getDB() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        die("Database connection failed: " . $e->getMessage());
    }
}
