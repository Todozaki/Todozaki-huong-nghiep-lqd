import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";
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

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email và OTP là bắt buộc" });
  }

  try {
    const docRef = doc(db, "verification_codes", email);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(400).json({ error: "Không tìm thấy mã xác minh cho email này" });
    }

    const storedData = docSnap.data();

    if (Date.now() > storedData.expires) {
      await deleteDoc(docRef);
      return res.status(400).json({ error: "Mã xác minh đã hết hạn" });
    }

    if (storedData.code !== otp) {
      return res.status(400).json({ error: "Mã xác minh không chính xác" });
    }

    // Success - clean up
    await deleteDoc(docRef);
    res.json({ success: true, message: "Xác minh thành công" });
  } catch (error) {
    console.error("Lỗi xác minh:", error);
    res.status(500).json({ error: "Không thể xử lý yêu cầu xác minh." });
  }
}
