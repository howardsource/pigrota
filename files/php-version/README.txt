THE BLUE PIG - VOLUNTEER ROTA
PHP/MySQL Version
================================

REQUIREMENTS:
- PHP 7.4 or higher
- MySQL 5.7 or higher (or MariaDB)
- A web server (Apache, Nginx, etc.)

INSTALLATION:
1. Upload all files to your web server

2. Create the database:
   - Open phpMyAdmin or MySQL command line
   - Run the contents of setup.sql to create the database and tables

3. Configure the database connection:
   - Open config.php
   - Update DB_HOST, DB_NAME, DB_USER, and DB_PASS with your MySQL credentials

4. Access the application:
   - Navigate to index.php in your browser
   - e.g., http://yourserver.com/rota/index.php

FILES:
- index.php      - Main application file
- api.php        - API endpoints for AJAX requests
- config.php     - Database configuration
- styles.css     - Application styles
- app.js         - JavaScript functionality
- setup.sql      - Database setup script
- README.txt     - This file

FEATURES:
- Three views: List, Week, and Month
- Add/remove volunteer shifts
- Add/remove events
- Role selection (Bar Staff, Line Cleaning, Custom)
- Color-coded shifts by role
- Regular opening days highlighted (Wed, Fri, Sat, Sun)
- Past days are locked (read-only)
- PDF export for month view
- Mobile responsive design

SUPPORT:
For issues or questions, contact the developer.
