const https = require("https");
const http = require("http");
const Announcement = require("../models/Announcement");
const NotificationService = require("./notificationService");

class AnnouncementService {
    static async create(data, imagePath) {
        const id = await Announcement.create({
            title: data.title,
            category: data.category,
            message: data.message,
            datePosted: data.date,
            imagePath: imagePath || null,
            sourceUrl: data.source_url || null,
            sourceTitle: data.source_title || null,
            sourceImage: data.source_image || null,
            sourceSite: data.source_site || null,
            createdBy: data.createdBy || null
        });

        await NotificationService.create({
            title: "New Announcement",
            message: data.title,
            notificationType: "announcement",
            referenceId: id
        });

        return { success: true, id };
    }

    static async update(id, data, imagePath, removeImage) {
        await Announcement.update(id, {
            title: data.title,
            category: data.category,
            message: data.message,
            datePosted: data.date,
            imagePath: imagePath || null,
            sourceUrl: data.source_url || null
        });

        if (removeImage && !imagePath) {
            await Announcement.clearImage(id);
        }

        return { success: true };
    }

    // Minimal Open Graph scraper for the "paste a link" preview feature.
    // Only reads <meta property="og:*"> tags from the first ~100KB of HTML;
    // this is a lightweight preview, not a full scraper.
    static async fetchLinkPreview(url) {
        return new Promise((resolve, reject) => {
            let parsed;
            try {
                parsed = new URL(url);
            } catch {
                return reject(new Error("Invalid URL."));
            }

            if (!["http:", "https:"].includes(parsed.protocol)) {
                return reject(new Error("Only http/https URLs are supported."));
            }

            const client = parsed.protocol === "https:" ? https : http;
            const request = client.get(url, { timeout: 5000 }, (response) => {
                if (response.statusCode >= 400) {
                    response.resume();
                    return reject(new Error("Could not read that link."));
                }

                let html = "";
                response.on("data", (chunk) => {
                    html += chunk;
                    if (html.length > 100000) response.destroy();
                });

                response.on("end", () => {
                    const getMeta = (property) => {
                        const regex = new RegExp(
                            `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
                            "i"
                        );
                        const match = html.match(regex);
                        return match ? match[1] : null;
                    };

                    resolve({
                        title: getMeta("og:title"),
                        image: getMeta("og:image"),
                        site: getMeta("og:site_name") || parsed.hostname
                    });
                });
            });

            request.on("error", () => reject(new Error("Could not reach that link.")));
            request.on("timeout", () => {
                request.destroy();
                reject(new Error("Request timed out."));
            });
        });
    }
}

module.exports = AnnouncementService;
