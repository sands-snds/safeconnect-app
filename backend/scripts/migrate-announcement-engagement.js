// One-off migration: creates the announcement_likes and announcement_comments
// tables used by the News section's shared Like/Comment feature.
//
// Run once with:  node backend/scripts/migrate-announcement-engagement.js
require("dotenv").config();
const db = require("../config/db");

const run = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS announcement_likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_announcement_user (announcement_id, user_id),
                CONSTRAINT fk_like_announcement FOREIGN KEY (announcement_id)
                    REFERENCES announcements(id) ON DELETE CASCADE,
                CONSTRAINT fk_like_user FOREIGN KEY (user_id)
                    REFERENCES registered_users(id) ON DELETE CASCADE
            )
        `);
        console.log("announcement_likes ready.");

        await db.query(`
            CREATE TABLE IF NOT EXISTS announcement_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                user_id INT NOT NULL,
                comment_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_comment_announcement FOREIGN KEY (announcement_id)
                    REFERENCES announcements(id) ON DELETE CASCADE,
                CONSTRAINT fk_comment_user FOREIGN KEY (user_id)
                    REFERENCES registered_users(id) ON DELETE CASCADE
            )
        `);
        console.log("announcement_comments ready.");

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err.message);
        process.exit(1);
    }
};

run();
