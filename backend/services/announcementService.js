const https = require("https");
const http = require("http");
const Announcement = require("../models/Announcement");
const NotificationService = require("./notificationService");
const { sendAnnouncementToAll } = require("./emailService");
const db = require("../config/db");

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
            createdBy: data.createdBy || null,
        });

        await NotificationService.create({
            title: "New Announcement",
            message: data.title,
            notificationType: "announcement",
            referenceId: id,
        });

        // Email all active residents (non-blocking — don't fail if email errors)
        AnnouncementService._emailAllResidents({
            title: data.title,
            category: data.category,
            message: data.message,
        }).catch((err) =>
            console.error("[AnnouncementService] Bulk email failed:", err)
        );

        return { success: true, id };
    }

    // Fetch all active residents and send them the announcement email.
    static async _emailAllResidents(announcement) {
        const [rows] = await db.query(
            `SELECT full_name, email_address
             FROM registered_users
             WHERE role = 'resident' AND status = 'Active'`
        );
        if (!rows || rows.length === 0) return;
        await sendAnnouncementToAll(rows, announcement);
    }

    static async update(id, data, imagePath, removeImage) {
        await Announcement.update(id, {
            title: data.title,
            category: data.category,
            message: data.message,
            datePosted: data.date,
            imagePath: imagePath || null,
            sourceUrl: data.source_url || null,
            sourceTitle: data.source_title || null,
            sourceImage: data.source_image || null,
            sourceSite: data.source_site || null,
        });

        if (removeImage && !imagePath) {
            await Announcement.clearImage(id);
        }

        return { success: true };
    }

    static async fetchLinkPreview(url, redirectsLeft = 3) {
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
            const request = client.get(
                url,
                {
                    timeout: 5000,
                    headers: {
                        // Many real-world sites (Wikipedia, government sites
                        // behind a WAF/CDN, etc.) reject a request outright
                        // with 403/406 if it has no User-Agent at all -- this
                        // was rejecting essentially every URL that wasn't
                        // trivially simple.
                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                        Accept: "text/html,application/xhtml+xml"
                    }
                },
                (response) => {
                    // Follow redirects ourselves -- the raw http/https
                    // modules don't do this automatically, and this is
                    // exactly how something like Wikipedia's "Random
                    // article" link is designed to work (a 30x redirect to
                    // the actual page), not an edge case.
                    if (
                        response.statusCode >= 300 &&
                        response.statusCode < 400 &&
                        response.headers.location &&
                        redirectsLeft > 0
                    ) {
                        response.resume();
                        const nextUrl = new URL(response.headers.location, url).toString();
                        resolve(AnnouncementService.fetchLinkPreview(nextUrl, redirectsLeft - 1));
                        return;
                    }

                    if (response.statusCode >= 400) {
                        response.resume();
                        return reject(new Error("Could not read that link."));
                    }

                    let html = "";
                    let finished = false;
                    response.setEncoding("utf8");
                    response.on("data", (chunk) => {
                        html += chunk;
                        // The <head> meta tags are all we need. Stop reading
                        // big pages early -- destroy() emits "close", not
                        // "end", so both are handled below.
                        if (html.length > 300000 || /<\/head>/i.test(chunk)) response.destroy();
                    });

                    const finish = () => {
                        if (finished) return;
                        finished = true;
                        const decode = (s) =>
                            s
                                .replace(/&amp;/g, "&")
                                .replace(/&quot;/g, '"')
                                .replace(/&#0?39;|&apos;/g, "'")
                                .replace(/&lt;/g, "<")
                                .replace(/&gt;/g, ">");

                        // Sites put the attributes in either order and use
                        // property= (Open Graph) or name= (Twitter cards).
                        const getMeta = (...keys) => {
                            const tags = html.match(/<meta\b[^>]*>/gi) || [];
                            for (const key of keys) {
                                for (const tag of tags) {
                                    const attr = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i);
                                    if (!attr || attr[1].toLowerCase() !== key) continue;
                                    const content = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
                                    if (content && content[2].trim()) return decode(content[2].trim());
                                }
                            }
                            return null;
                        };

                        const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
                        let image = getMeta("og:image", "og:image:url", "twitter:image", "twitter:image:src");
                        if (image) {
                            try {
                                image = new URL(image, url).toString();
                            } catch {
                                image = null;
                            }
                        }

                        resolve({
                            title: getMeta("og:title", "twitter:title") || (titleTag ? decode(titleTag[1].trim()) : null),
                            image,
                            site: getMeta("og:site_name") || parsed.hostname.replace(/^www\./, ""),
                        });
                    };

                    response.on("end", finish);
                    response.on("close", finish);
                }
            );

            request.on("error", () => reject(new Error("Could not reach that link.")));
            request.on("timeout", () => {
                request.destroy();
                reject(new Error("Request timed out."));
            });
        });
    }
}

module.exports = AnnouncementService;