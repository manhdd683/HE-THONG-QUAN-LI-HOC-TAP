import * as nodemailer from 'nodemailer';

let testAccount: nodemailer.TestAccount | null = null;
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  // Use environment variables if provided
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return transporter;
  }

  // Otherwise fallback to Ethereal Email (for testing)
  if (!testAccount) {
    testAccount = await nodemailer.createTestAccount();
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  return transporter;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: '"Hệ thống Quản lý Học tập" <noreply@tutormanager.com>',
      to,
      subject,
      html
    });

    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL: %s', previewUrl);
    }
    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
  }
};

export const sendHomeworkNotification = async (parentEmail: string, studentName: string, homeworkTitle: string, dueDate: Date | null) => {
  const subject = `[Thông báo] Bài tập mới cho học sinh ${studentName}`;
  const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : 'Không giới hạn';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #1F5C4E;">Thông báo Bài tập mới</h2>
      <p>Kính gửi Phụ huynh,</p>
      <p>Gia sư vừa giao một bài tập mới cho học sinh <strong>${studentName}</strong>.</p>
      <div style="background-color: #FAF7F0; padding: 15px; border-left: 4px solid #E08E45; margin: 15px 0;">
        <p style="margin: 0;"><strong>Tiêu đề:</strong> ${homeworkTitle}</p>
        <p style="margin: 5px 0 0 0;"><strong>Hạn nộp:</strong> ${dueDateStr}</p>
      </div>
      <p>Phụ huynh vui lòng nhắc nhở học sinh hoàn thành bài tập đúng hạn.</p>
      <p>Trân trọng,<br>Hệ thống Quản lý Học tập</p>
    </div>
  `;
  return sendEmail(parentEmail, subject, html);
};

export const sendTuitionNotification = async (parentEmail: string, studentName: string, cycleName: string) => {
  const subject = `[Xác nhận] Đã thu đủ học phí cho học sinh ${studentName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #1F5C4E;">Xác nhận Thu đủ Học phí</h2>
      <p>Kính gửi Phụ huynh,</p>
      <p>Chúng tôi xin xác nhận đã thu đủ học phí cho học sinh <strong>${studentName}</strong>.</p>
      <div style="background-color: #FAF7F0; padding: 15px; border-left: 4px solid #1F5C4E; margin: 15px 0;">
        <p style="margin: 0;"><strong>Chu kỳ học phí:</strong> ${cycleName}</p>
        <p style="margin: 5px 0 0 0;"><strong>Trạng thái:</strong> Đã thanh toán đầy đủ</p>
      </div>
      <p>Cảm ơn sự đồng hành của Phụ huynh trong quá trình học tập của học sinh.</p>
      <p>Trân trọng,<br>Hệ thống Quản lý Học tập</p>
    </div>
  `;
  return sendEmail(parentEmail, subject, html);
};

export const sendSessionFeedbackNotification = async (parentEmail: string, studentName: string, sessionDate: Date, comments: string) => {
  const subject = `[Nhận xét] Buổi học ngày ${new Date(sessionDate).toLocaleDateString('vi-VN')} của học sinh ${studentName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #1F5C4E;">Nhận xét Buổi học</h2>
      <p>Kính gửi Phụ huynh,</p>
      <p>Gia sư vừa cập nhật nhận xét cho buổi học ngày <strong>${new Date(sessionDate).toLocaleDateString('vi-VN')}</strong> của học sinh <strong>${studentName}</strong>.</p>
      <div style="background-color: #FAF7F0; padding: 15px; border-left: 4px solid #E08E45; margin: 15px 0;">
        <p style="margin: 0;"><strong>Nhận xét từ Gia sư:</strong></p>
        <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${comments}</p>
      </div>
      <p>Phụ huynh có thể đăng nhập vào hệ thống để xem chi tiết tình hình học tập của con.</p>
      <p>Trân trọng,<br>Hệ thống Quản lý Học tập</p>
    </div>
  `;
  return sendEmail(parentEmail, subject, html);
};

export const sendScoreBoardNotification = async (parentEmail: string, studentName: string, subjectName: string) => {
  const subject = `[Thông báo] Bảng điểm môn ${subjectName} của học sinh ${studentName} đã được cập nhật`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h2 style="color: #1F5C4E;">Bảng điểm Mới được Công bố</h2>
      <p>Kính gửi Phụ huynh,</p>
      <p>Gia sư vừa công bố bảng điểm mới môn <strong>${subjectName}</strong> của học sinh <strong>${studentName}</strong>.</p>
      <div style="background-color: #FAF7F0; padding: 15px; border-left: 4px solid #E08E45; margin: 15px 0;">
        <p style="margin: 0;">Phụ huynh vui lòng đăng nhập vào hệ thống để xem chi tiết điểm số, nhận xét và quá trình học tập của con em mình.</p>
      </div>
      <p>Trân trọng,<br>Hệ thống Quản lý Học tập</p>
    </div>
  `;
  return sendEmail(parentEmail, subject, html);
};
