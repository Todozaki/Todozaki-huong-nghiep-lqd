import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, pdfBase64 } = req.body;

  if (!email || !pdfBase64) {
    return res.status(400).json({ error: "Email và PDF data là bắt buộc" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Remove the data URL prefix if present
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

    await transporter.sendMail({
      from: `"LQD Future" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Báo cáo Định hướng Nghề nghiệp - LQD Future",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <p>Chào bạn, đây là báo cáo chi tiết từ LQD Future mà bạn vừa tải xuống. Chúc bạn thành công!</p>
        </div>
      `,
      attachments: [
        {
          filename: "Bao_cao_LQD_Future.pdf",
          content: base64Data,
          encoding: "base64",
        },
      ],
    });

    res.json({ success: true, message: "PDF đã được gửi qua email" });
  } catch (error) {
    console.error("Nodemailer Error (PDF):", error);
    res.status(500).json({ error: "Không thể gửi email đính kèm PDF." });
  }
}
