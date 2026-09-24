const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // Azure Database for MySQL requires encrypted connections; local XAMPP
    // MySQL usually doesn't support them, so it's opt-in via DB_SSL=true.
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;