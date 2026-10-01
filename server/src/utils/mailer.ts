import * as nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

/**
 * Get (or lazily create) the nodemailer transporter.
 *
 * Priority:
 *  1. Gmail SMTP via SMTP_HOST/SMTP_USER/SMTP_PASS env vars
 *  2. Ethereal fake-email (development fallback)
 */
const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) return transporter;

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,   // smtp.gmail.com
      port,
      secure: port === 465,          // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS  // Gmail App Password (16 chars)
      },
      tls: {
        rejectUnauthorized: false    // avoid self-signed cert issues on some hosts
      }
    });

    console.log(`✅ Mailer: using SMTP (${process.env.SMTP_HOST}:${port})`);
    return transporter;
  }

  // ── Fallback: Ethereal fake-email for development ──
  console.warn('⚠️  Mailer: SMTP_HOST/USER/PASS not set → using Ethereal (fake) email');
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  return transporter;
};

/** Sender display name — reads from env or falls back to a sensible default */
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Hệ thống Quản lý Học tập';
const FROM_ADDR = process.env.SMTP_USER      || 'noreply@edumanager.vn';

/**
 * Core send function.
 * Returns the Nodemailer info object (contains messageId, etc.)
 */
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<any> => {
  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: `"${FROM_NAME}" <${FROM_ADDR}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, '') // plain-text fallback
    });

    console.log(`📨 Email sent → ${to} | id: ${info.messageId}`);

    // Show preview link when running against Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Preview: ${previewUrl}`);
    }

    return info;
  } catch (error: any) {
    console.error('❌ Email send error:', error?.message || error);
    // Don't crash the main flow — just log and return
    return null;
  }
};

/* ─────────────────────────────────────────────────────────────
   Notification helpers
   ───────────────────────────────────────────────────────────── */

/** Wrapper for the branded HTML email shell */
const emailShell = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#9b8bf4,#f472b6);padding:28px 32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:800;letter-spacing:0.5px;">
                🎓 HỆ THỐNG GIÁO DỤC
              </h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">
                Thông báo từ Gia sư
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 32px;border-top:1px solid #eee;text-align:center;">
              <p style="color:#888;font-size:12px;margin:0;">
                Email này được gửi tự động từ Hệ thống Quản lý Học tập.<br/>
                Vui lòng không trả lời email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/* ── 1. Thông báo bài tập mới ── */
export const sendHomeworkNotification = async (
  parentEmail: string,
  studentName: string,
  homeworkTitle: string,
  dueDate: Date | null
) => {
  const subject = `📚 Bài tập mới cho học sinh ${studentName}`;
  const dueDateStr = dueDate
    ? new Date(dueDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Không có hạn';

  const body = `
    <h2 style="color:#9b8bf4;margin:0 0 16px;">Bài tập mới được giao</h2>
    <p style="color:#444;line-height:1.7;">Kính gửi Phụ huynh,</p>
    <p style="color:#444;line-height:1.7;">
      Gia sư vừa giao bài tập mới cho học sinh <strong>${studentName}</strong>.
    </p>
    <div style="background:#faf5ff;border-left:4px solid #9b8bf4;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#555;"><strong>📝 Tiêu đề:</strong> ${homeworkTitle}</p>
      <p style="margin:0;color:#555;"><strong>⏰ Hạn nộp:</strong> ${dueDateStr}</p>
    </div>
    <p style="color:#444;line-height:1.7;">
      Phụ huynh vui lòng nhắc nhở học sinh hoàn thành bài tập đúng hạn.
    </p>
    <p style="color:#888;margin-top:24px;">Trân trọng,<br/><strong>Hệ thống Quản lý Học tập</strong></p>
  `;

  return sendEmail(parentEmail, subject, emailShell(subject, body));
};

/* ── 2. Xác nhận học phí ── */
export const sendTuitionNotification = async (
  parentEmail: string,
  studentName: string,
  cycleName: string
) => {
  const subject = `✅ Xác nhận đã thu đủ học phí — ${studentName}`;

  const body = `
    <h2 style="color:#10b981;margin:0 0 16px;">Xác nhận Thu đủ Học phí</h2>
    <p style="color:#444;line-height:1.7;">Kính gửi Phụ huynh,</p>
    <p style="color:#444;line-height:1.7;">
      Chúng tôi xin xác nhận đã thu đủ học phí cho học sinh <strong>${studentName}</strong>.
    </p>
    <div style="background:#f0fdf4;border-left:4px solid #10b981;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#555;"><strong>📋 Chu kỳ:</strong> ${cycleName}</p>
      <p style="margin:0;color:#10b981;font-weight:600;"><strong>✅ Trạng thái: Đã thanh toán đầy đủ</strong></p>
    </div>
    <p style="color:#444;line-height:1.7;">
      Cảm ơn Phụ huynh đã đồng hành cùng chúng tôi trong hành trình học tập của con em.
    </p>
    <p style="color:#888;margin-top:24px;">Trân trọng,<br/><strong>Hệ thống Quản lý Học tập</strong></p>
  `;

  return sendEmail(parentEmail, subject, emailShell(subject, body));
};

/* ── 3. Nhận xét buổi học ── */
export const sendSessionFeedbackNotification = async (
  parentEmail: string,
  studentName: string,
  sessionDate: Date,
  comments: string
) => {
  const dateStr = new Date(sessionDate).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const subject = `📝 Nhận xét buổi học ${dateStr} — ${studentName}`;

  const body = `
    <h2 style="color:#9b8bf4;margin:0 0 16px;">Nhận xét Buổi học</h2>
    <p style="color:#444;line-height:1.7;">Kính gửi Phụ huynh,</p>
    <p style="color:#444;line-height:1.7;">
      Gia sư vừa cập nhật nhận xét cho buổi học <strong>${dateStr}</strong>
      của học sinh <strong>${studentName}</strong>.
    </p>
    <div style="background:#faf5ff;border-left:4px solid #9b8bf4;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#555;font-weight:600;">💬 Nhận xét từ Gia sư:</p>
      <p style="margin:0;color:#444;line-height:1.7;white-space:pre-wrap;">${comments}</p>
    </div>
    <p style="color:#444;line-height:1.7;">
      Phụ huynh có thể đăng nhập vào hệ thống để xem chi tiết tình hình học tập của con.
    </p>
    <p style="color:#888;margin-top:24px;">Trân trọng,<br/><strong>Hệ thống Quản lý Học tập</strong></p>
  `;

  return sendEmail(parentEmail, subject, emailShell(subject, body));
};

/* ── 4. Công bố bảng điểm ── */
export const sendScoreBoardNotification = async (
  parentEmail: string,
  studentName: string,
  subjectName: string
) => {
  const subject = `🏆 Bảng điểm môn ${subjectName} của ${studentName} đã được công bố`;

  const body = `
    <h2 style="color:#f59e0b;margin:0 0 16px;">Bảng điểm Mới được Công bố</h2>
    <p style="color:#444;line-height:1.7;">Kính gửi Phụ huynh,</p>
    <p style="color:#444;line-height:1.7;">
      Gia sư vừa công bố bảng điểm mới môn <strong>${subjectName}</strong>
      của học sinh <strong>${studentName}</strong>.
    </p>
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;color:#555;">
        📊 Phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết điểm số,
        nhận xét và quá trình học tập của con em mình.
      </p>
    </div>
    <p style="color:#888;margin-top:24px;">Trân trọng,<br/><strong>Hệ thống Quản lý Học tập</strong></p>
  `;

  return sendEmail(parentEmail, subject, emailShell(subject, body));
};
