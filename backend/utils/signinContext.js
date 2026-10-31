




const https = require("https");

/* ---------------------------------------------------------------- IP ---- */

const cleanIp = (ip) => {
    if (!ip) return null;
    let v = String(ip).trim();
    
    const bracketed = v.match(/^\[([^\]]+)\](?::\d+)?$/);
    if (bracketed) v = bracketed[1];
    else if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(v)) v = v.split(":")[0];
    if (v.startsWith("::ffff:")) v = v.slice(7); // IPv4 written as IPv6
    return v || null;
};




const getClientIp = (req) => {
    const fromAzure = req.headers["x-client-ip"];
    if (fromAzure) return cleanIp(fromAzure);

    const forwarded = String(req.headers["x-forwarded-for"] || "")
        .split(",").map((s) => s.trim()).filter(Boolean);
    if (forwarded.length) return cleanIp(forwarded[forwarded.length - 1]);

    return cleanIp(req.socket?.remoteAddress);
};

const isPrivateIp = (ip) =>
    !ip
    || ip === "::1"
    || /^127\./.test(ip)
    || /^10\./.test(ip)
    || /^192\.168\./.test(ip)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
    || /^(fc|fd|fe80)/i.test(ip);

/* ------------------------------------------------------------ Device ---- */





const ANDROID_BRANDS = [
    [/^(SM-|SAMSUNG|Galaxy)/i, "Samsung"],
    [/^(Redmi|POCO|Mi |MI |M2\d{3}|2\d{3}[A-Z0-9]{4,}|Xiaomi)/i, "Xiaomi"],
    [/^(CPH|OPPO)/i, "OPPO"],
    [/^(vivo|V2\d{3})/i, "vivo"],
    [/^(RMX|realme)/i, "realme"],
    [/^Pixel/i, "Google Pixel"],
    [/^Infinix/i, "Infinix"],
    [/^TECNO/i, "TECNO"],
    [/^(HUAWEI|ELE-|VOG-|MAR-|ANE-|JNY-|NOH-)/i, "Huawei"],
    [/^(HONOR|HNR)/i, "Honor"],
    [/^(ONEPLUS|OnePlus|IN20|KB20|LE21|NE22|CPH25)/i, "OnePlus"],
    [/^(moto|Motorola|XT\d)/i, "Motorola"],
    [/^Nokia/i, "Nokia"],
    [/^(ASUS|ASUS_)/i, "ASUS"],
    [/^(LM-|LG-)/i, "LG"]
];

const brandFromModel = (model) => {
    if (!model) return null;
    const hit = ANDROID_BRANDS.find(([re]) => re.test(model.trim()));
    return hit ? hit[1] : null;
};

const browserName = (ua) => {
    if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
    if (/Edg\//i.test(ua)) return "Edge";
    if (/OPR\/|Opera/i.test(ua)) return "Opera";
    if (/Firefox\/|FxiOS/i.test(ua)) return "Firefox";
    if (/CriOS|Chrome\//i.test(ua)) return "Chrome";
    if (/Safari\//i.test(ua)) return "Safari";
    return null;
};




const describeDevice = (userAgent = "", hints = {}) => {
    const ua = String(userAgent);
    if (!ua) return null;

    const isIpad = /iPad/.test(ua) || (/Macintosh/.test(ua) && hints.mobile === true);
    const isTablet = isIpad || /Tablet|SM-T\d|Tab\b/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const isPhone = !isTablet && (/Mobi|iPhone|Android/i.test(ua) || hints.mobile === true);
    const type = isTablet ? "Tablet" : isPhone ? "Phone" : "Computer";

    let brand = null;
    let os = null;

    if (/iPhone/.test(ua)) {
        brand = "Apple iPhone";
        const v = ua.match(/OS (\d+[_\d]*)/);
        os = `iOS${v ? " " + v[1].replace(/_/g, ".") : ""}`;
    } else if (isIpad) {
        brand = "Apple iPad";
        os = "iPadOS";
    } else if (/Android/i.test(ua)) {
        const uaModel = ((ua.match(/Android [^;)]*;\s*([^;)]+?)(?:\s+Build\/|\)|;)/i) || [])[1] || "").trim();
        const reducedUa = uaModel === "K";
        const v = ua.match(/Android (\d+(?:\.\d+)?)/i);
        const version = hints.platformVersion
            ? String(hints.platformVersion).split(".")[0]
            : (!reducedUa && v ? v[1] : null);
        os = `Android${version ? " " + version : ""}`;
        
        const model = [hints.model, uaModel]
            .map((m) => (m || "").trim())
            .find((m) => m && m !== "K" && !/^(Mobile|Tablet|rv:|wv\b|Linux|U\b)/i.test(m));
        const maker = brandFromModel(model);
        brand = maker ? `${maker}${model && !model.toLowerCase().startsWith(maker.toLowerCase()) ? " " + model : ""}` : (model || null);
    } else if (/Windows/i.test(ua)) {
        os = "Windows";
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
        brand = "Apple Mac";
        os = "macOS";
    } else if (/CrOS/i.test(ua)) {
        os = "ChromeOS";
    } else if (/Linux/i.test(ua)) {
        os = "Linux";
    }

    return [type, brand, os, browserName(ua)].filter(Boolean).join(" · ").slice(0, 120);
};

/* ---------------------------------------------------------- Location ---- */




const lookupLocation = (ip) => new Promise((resolve) => {
    if (isPrivateIp(ip)) return resolve(null);

    const req = https.get(
        `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
        { timeout: 4000, headers: { "User-Agent": "SafeConnect/1.0" } },
        (res) => {
            let body = "";
            res.on("data", (c) => { body += c; if (body.length > 20000) res.destroy(); });
            res.on("end", () => {
                try {
                    const d = JSON.parse(body);
                    if (d.error) return resolve(null);
                    const place = [d.city, d.region, d.country_name].filter(Boolean).join(", ");
                    const text = [place, d.org].filter(Boolean).join(" · ");
                    resolve(text ? text.slice(0, 160) : null);
                } catch {
                    resolve(null);
                }
            });
        }
    );
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.on("error", () => resolve(null));
});



const signinContext = (req) => {
    const hints = req.body && typeof req.body.device === "object" ? req.body.device : {};
    return {
        ip: getClientIp(req),
        device: describeDevice(req.headers["user-agent"], {
            model: typeof hints.model === "string" ? hints.model.slice(0, 60) : null,
            platformVersion: typeof hints.platformVersion === "string" ? hints.platformVersion.slice(0, 20) : null,
            mobile: hints.mobile === true
        })
    };
};

module.exports = {
    getClientIp,
    describeDevice,
    lookupLocation,
    signinContext,
    isPrivateIp
};
