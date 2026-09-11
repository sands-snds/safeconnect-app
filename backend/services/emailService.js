const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM = `"SafeConnect – Barangay Santa Fe" <${process.env.SMTP_USER}>`;

// ── Shared HTML wrapper ──────────────────────────────────────────────────────
const wrap = (bodyHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f1f2;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1f2;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6B2C3E,#8B3A52);padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#FFC107;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
              Barangay Santa Fe
            </p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.01em;">
              SafeConnect
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f7;padding:20px 36px;text-align:center;border-top:1px solid #efe8ea;">
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;">
              This is an automated message from SafeConnect.<br/>
              Barangay Santa Fe, Dasmariñas, Cavite, Philippines.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── 1. OTP email ─────────────────────────────────────────────────────────────
const sendOtpEmail = async (toEmail, otp) => {
    const html = wrap(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111;font-weight:800;">
            Verify your email address
        </h2>
        <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.7;">
            Use the code below to complete your SafeConnect registration.
            It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#fdf0f3;border:1.5px solid #f5c6d0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-size:12px;color:#999;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">
                Your verification code
            </p>
            <p style="margin:0;font-size:40px;font-weight:900;color:#6B2C3E;letter-spacing:0.18em;">
                ${otp}
            </p>
        </div>
        <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
            If you did not request this, you can safely ignore this email.
        </p>
    `);

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: `${otp} is your SafeConnect verification code`,
        html,
    });
};

// ── 2. Welcome email ─────────────────────────────────────────────────────────
const sendWelcomeEmail = async (toEmail, fullName) => {
    const html = wrap(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111;font-weight:800;">
            Welcome to SafeConnect, ${fullName}!
        </h2>
        <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7;">
            Your account has been created successfully. You're now part of the
            Barangay Santa Fe SafeConnect community.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;width:100%;">
          ${[
            ["bi-exclamation-triangle-fill","Report Emergencies","Submit fire, flood, or medical emergencies instantly."],
            ["bi-life-preserver","Request Assistance","Ask for food, shelter, or disaster support."],
            ["bi-megaphone-fill","View Announcements","Stay updated with real-time barangay news."],
          ].map(([,title,desc]) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f5f5f5;">
                <p style="margin:0;font-size:14px;font-weight:700;color:#111;">${title}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#888;">${desc}</p>
              </td>
            </tr>
          `).join("")}
        </table>
        <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
            Sign in anytime at your barangay's SafeConnect portal to get started.
        </p>
    `);

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: "Welcome to SafeConnect – Barangay Santa Fe",
        html,
    });
};

// ── 3. Sign-in notification ──────────────────────────────────────────────────
const sendSigninNotification = async (toEmail, fullName) => {
    const now = new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        dateStyle: "full",
        timeStyle: "short",
    });

    const html = wrap(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111;font-weight:800;">
            New sign-in to your account
        </h2>
        <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7;">
            Hi <strong>${fullName}</strong>, we noticed a new sign-in to your SafeConnect account.
        </p>
        <div style="background:#fdf0f3;border:1.5px solid #f5c6d0;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:12px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
                Sign-in time
            </p>
            <p style="margin:0;font-size:15px;font-weight:700;color:#6B2C3E;">${now}</p>
        </div>
        <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
            If this was you, no action is needed. If you did not sign in,
            please contact your barangay administrator immediately.
        </p>
    `);

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: "New sign-in to your SafeConnect account",
        html,
    });
};

// ── 4. Announcement notification ────────────────────────────────────────────
const sendAnnouncementEmail = async (toEmail, fullName, announcement) => {
    const html = wrap(`
        <h2 style="margin:0 0 8px;font-size:20px;color:#111;font-weight:800;">
            New announcement from Barangay Santa Fe
        </h2>
        <p style="margin:0 0 20px;font-size:14px;color:#666;line-height:1.7;">
            Hi <strong>${fullName}</strong>, your barangay has posted a new announcement.
        </p>
        <div style="border:1.5px solid #f0e4e7;border-radius:12px;overflow:hidden;margin-bottom:24px;">
            <div style="background:#6B2C3E;padding:14px 20px;">
                <span style="display:inline-block;background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:3px 10px;border-radius:20px;">
                    ${announcement.category || "Announcement"}
                </span>
            </div>
            <div style="padding:20px;">
                <h3 style="margin:0 0 10px;font-size:17px;font-weight:800;color:#111;line-height:1.3;">
                    ${announcement.title}
                </h3>
                <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
                    ${announcement.message}
                </p>
            </div>
        </div>
        <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
            Sign in to SafeConnect for the full announcement and any updates.
        </p>
    `);

    await transporter.sendMail({
        from: FROM,
        to: toEmail,
        subject: `📢 ${announcement.title} – Barangay Santa Fe SafeConnect`,
        html,
    });
};

// ── Batch send to many residents (used for announcements) ────────────────────
// Sends individually so one bad address doesn't block the rest.
const sendAnnouncementToAll = async (residents, announcement) => {
    const results = await Promise.allSettled(
        residents.map((r) =>
            sendAnnouncementEmail(r.email_address, r.full_name, announcement)
        )
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
        console.warn(`[emailService] ${failed}/${residents.length} announcement emails failed.`);
    }
};

module.exports = {
    sendOtpEmail,
    sendWelcomeEmail,
    sendSigninNotification,
    sendAnnouncementToAll,
};