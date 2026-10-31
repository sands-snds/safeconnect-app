
















const { isAdminRole } = require("../utils/roles");

const clients = new Set(); // { res, userId, isAdmin }

const HEARTBEAT_MS = 25 * 1000; // below Azure's ~230 s idle timeout

function send(client, type) {
    try {
        client.res.write(`event: ${type}\ndata: {}\n\n`);
    } catch {
        clients.delete(client);
    }
}



function subscribe(req, res, { role } = {}) {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
    });
    res.write(": connected\n\n");

    const client = { res, userId: Number(req.user.id), isAdmin: isAdminRole(role) };
    clients.add(client);

    const heartbeat = setInterval(() => {
        try { res.write(": ping\n\n"); } catch { /* closed */ }
    }, HEARTBEAT_MS);

    req.on("close", () => {
        clearInterval(heartbeat);
        clients.delete(client);
    });
}

const notifyUser = (userId, type) => {
    const id = Number(userId);
    for (const c of clients) if (c.userId === id) send(c, type);
};

const notifyAdmins = (type) => {
    for (const c of clients) if (c.isAdmin) send(c, type);
};

const notifyAll = (type) => {
    for (const c of clients) send(c, type);
};


const afterSuccess = (fn) => (req, res, next) => {
    res.on("finish", () => {
        if (res.statusCode < 400) {
            try { fn(req); } catch (err) { console.error("Live update failed:", err.message); }
        }
    });
    next();
};

module.exports = { subscribe, notifyUser, notifyAdmins, notifyAll, afterSuccess };
