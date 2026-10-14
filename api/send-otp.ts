import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email là bắt buộc" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  try {
    // Save to Firestore
    await setDoc(doc(db, "verification_codes", email), {
      code: otp,
      expires: expires
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"LQD Future" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Mã xác minh LQD Future",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Xác minh tài khoản LQD Future</h2>
          <p>Chào bạn,</p>
          <p>Mã xác minh (OTP) của bạn là:</p>
          <div style="background: #f3f4f6; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #888;">Đây là email tự động, vui lòng không phản hồi.</p>
        </div>
      `,
    });

    res.json({ success: true, message: "Mã OTP đã được gửi" });
  } catch (error) {
    console.error("Lỗi:", error);
    res.status(500).json({ error: "Không thể xử lý yêu cầu. Vui lòng kiểm tra lại cấu hình." });
  }
}
