// src/utils/fillApplicationForm.js
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import download from "downloadjs";
import { apiFetch } from "./apiFetch";
// ฟังก์ชันแปลงชื่อเต็มเป็นคำย่อ
function mapLevel(level) {
  if (!level) return "";
  if (level.includes("สูง")) return "ปวส";   // ประกาศนียบัตรวิชาชีพชั้นสูง
  if (level.includes("ประกาศนียบัตรวิชาชีพ")) return "ปวช"; // ประกาศนียบัตรวิชาชีพ
  return level; // กรณีอื่นๆ
}

export async function fillApplicationForm(candidate) {
  try {
    // โหลด template PDF และฟอนต์
    const [templateBytes, fontBytes] = await Promise.all([
      fetch("/forms/application-template.pdf").then((res) => res.arrayBuffer()),
      fetch("/fonts/THSarabunNew.ttf").then((res) => res.arrayBuffer()),
    ]);

    // โหลด PDF ก่อน แล้วค่อยใช้
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes);
    const page = pdfDoc.getPages()[0];

    const fontSize = 16;
    const black = rgb(0, 0, 0);

    // โหลดและแทรกรูปผู้สมัคร
    if (candidate.photo && candidate.photo.startsWith("/uploads")) {
      try {
        const imageBytes = await fetch(
          `${candidate.photo}`
        ).then((res) => res.arrayBuffer());

        let candidateImage;
        if (candidate.photo.toLowerCase().endsWith(".png")) {
          candidateImage = await pdfDoc.embedPng(imageBytes);
        } else {
          candidateImage = await pdfDoc.embedJpg(imageBytes);
        }

        page.drawImage(candidateImage, {
          x: 450,
          y: 673,
          width: 83,
          height: 95,
        });
      } catch (err) {
        console.error("โหลดรูปผู้สมัครไม่สำเร็จ:", err);
      }
    }

    // ตัดคำว่า "แผนกวิชา" ออก
    const cleanDepartment = (candidate.department || "-")
      .replace(/^แผนกวิชา/, "")
      .trim();

    // แยกชื่อ-นามสกุล
    const fullName = candidate.name || "- -";
    const [firstName = "-", lastName = "-"] = fullName.trim().split(" ");




    // --------------------------
    // วางข้อมูลลงในฟอร์ม
    // --------------------------
    page.drawText(firstName, {
      x: 140,
      y: 530,
      size: fontSize,
      font: customFont,
      color: black,
    });

    page.drawText(lastName, {
      x: 280,
      y: 530,
      size: fontSize,
      font: customFont,
      color: black,
    });

    page.drawText(cleanDepartment, {
      x: 110,
      y: 508,
      size: 14,
      font: customFont,
      color: black,
    });


    page.drawText(candidate.college || "อาชีวศึกษายะลา", {
      x: 275,
      y: 605,
      size: fontSize,
      font: customFont,
      color: black,
    });

    page.drawText(candidate.college || "อาชีวศึกษายะลา", {
      x: 187,
      y: 467,
      size: fontSize,
      font: customFont,
      color: black,
    });

    page.drawText("วิทยาลัย" + (candidate.college || "อาชีวศึกษายะลา"), {
      x: 384,
      y: 508,
      size: fontSize,
      font: customFont,
      color: black,
    });

    // หมายเลขผู้สมัคร
    page.drawText(candidate.number?.toString() || "-", {
      x: 440,
      y: 560,
      size: 18,
      font: customFont,
      color: black,
    });

    // // ชั้นปี (ใช้คำย่อ)
    // const shortLevel = mapLevel(candidate.level);
    // page.drawText(
    //   shortLevel && candidate.year ? `${shortLevel}${candidate.year}` : "-",
    //   {
    //     x: 230,
    //     y: 508,
    //     size: fontSize,
    //     font: customFont,
    //     color: black,
    //   }
    // );

    // ส่วนก่อนหน้า
    const levelRaw = candidate.level ?? candidate.level_name ?? "";
    const yearRaw = candidate.year ?? candidate.year_number ?? "";

    // ใช้ตัวแปร shortLevel เดิม (ถ้ามีแล้ว ไม่ต้อง let/const ใหม่อีก)
   const shortLevel = mapLevel(String(levelRaw)); // อย่าใส่ const ซ้ำ
    const yearText = String(yearRaw).replace(/\D/g, "");

    // วาด "ชั้นปี"
    page.drawText(
      yearText ? `${shortLevel}${yearText}` : "-",
      { x: 230, y: 508, size: fontSize, font: customFont, color: black }
    );


    // ลายเซ็น
    page.drawText(fullName, {
      x: 230,
      y: 280,
      size: fontSize,
      font: customFont,
      color: black,
    });

    // ปีการศึกษา (แปลงเป็น พ.ศ.)
    const today = new Date();
    const formattedDate = `${today.getFullYear() + 543}`;
    page.drawText(formattedDate, {
      x: 450,
      y: 467,
      size: fontSize,
      font: customFont,
      color: black,
    });

    // -
    page.drawText("-", {
      x: 465,
      y: 530,
      size: 18,
      font: customFont,
      color: black,
    });

    // ✅ ดาวน์โหลด
    const pdfBytes = await pdfDoc.save();

    // ตั้งชื่อไฟล์ PDF ตามชื่อและชั้นปี
    const fileName = `${candidate.name || "application"}_${shortLevel || ""}${candidate.year || ""}.pdf`;
    download(pdfBytes, fileName, "application/pdf");

    console.log("PDF generated successfully");
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}
