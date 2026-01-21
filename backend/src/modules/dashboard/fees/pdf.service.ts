import PDFDocument from "pdfkit";
import { ReceiptWithRelations } from "./types";

interface InstitutionInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
}

const INSTITUTION: InstitutionInfo = {
  name: "CipherLearn Academy",
  address: "123 Education Lane, Knowledge City - 400001",
  phone: "+91 98765 43210",
  email: "fees@cipherlearn.edu",
  website: "www.cipherlearn.edu",
};

/**
 * Generate a professional PDF receipt
 */
export function generateReceiptPDF(receipt: ReceiptWithRelations): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
    info: {
      Title: `Fee Receipt - ${receipt.receiptNumber}`,
      Author: INSTITUTION.name,
      Subject: `Fee Receipt for ${receipt.student.fullname}`,
      CreationDate: new Date(),
    },
  });

  const pageWidth = doc.page.width - 100;
  const leftMargin = 50;

  // Colors
  const primaryColor = "#111827"; // Dark gray
  const accentColor = "#6366f1"; // Indigo
  const lightGray = "#9ca3af";
  const successColor = "#10b981"; // Emerald
  const warningColor = "#f59e0b"; // Amber
  const errorColor = "#ef4444"; // Red

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return successColor;
      case "PARTIAL":
        return warningColor;
      case "PENDING":
        return accentColor;
      case "OVERDUE":
        return errorColor;
      default:
        return primaryColor;
    }
  };

  // Helper for formatting currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Helper for formatting date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper for month name
  const getMonthName = (month: number) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months[month - 1];
  };

  let y = 50;

  // ============================================
  // HEADER - Institution Info
  // ============================================

  // Institution name
  doc
    .fillColor(primaryColor)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(INSTITUTION.name, leftMargin, y, { align: "center" });
  y += 30;

  // Address and contact
  doc
    .fillColor(lightGray)
    .fontSize(9)
    .font("Helvetica")
    .text(INSTITUTION.address, leftMargin, y, { align: "center" });
  y += 14;
  doc.text(
    `Tel: ${INSTITUTION.phone} | Email: ${INSTITUTION.email}`,
    leftMargin,
    y,
    { align: "center" }
  );
  y += 30;

  // Divider line
  doc
    .strokeColor(lightGray)
    .lineWidth(0.5)
    .moveTo(leftMargin, y)
    .lineTo(pageWidth + leftMargin, y)
    .stroke();
  y += 20;

  // ============================================
  // RECEIPT TITLE
  // ============================================

  doc
    .fillColor(primaryColor)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("FEE RECEIPT", leftMargin, y, { align: "center" });
  y += 35;

  // ============================================
  // RECEIPT INFO SECTION (Two columns)
  // ============================================

  const colWidth = pageWidth / 2;
  const leftColX = leftMargin;
  const rightColX = leftMargin + colWidth + 20;

  // Left column - Receipt details
  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("RECEIPT NUMBER", leftColX, y);
  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(receipt.receiptNumber, leftColX, y + 12);

  // Right column - Status
  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("STATUS", rightColX, y);

  // Status badge
  const statusText = receipt.status;
  doc
    .fillColor(getStatusColor(statusText))
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(statusText, rightColX, y + 12);

  y += 40;

  // Date row
  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("GENERATED DATE", leftColX, y);
  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font("Helvetica")
    .text(formatDate(receipt.createdAt), leftColX, y + 12);

  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("DUE DATE", rightColX, y);
  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font("Helvetica")
    .text(formatDate(receipt.dueDate), rightColX, y + 12);

  y += 40;

  // Academic period
  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("ACADEMIC PERIOD", leftColX, y);
  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font("Helvetica")
    .text(
      `${getMonthName(receipt.academicMonth)} ${receipt.academicYear}`,
      leftColX,
      y + 12
    );

  if (receipt.paymentDate) {
    doc
      .fillColor(lightGray)
      .fontSize(8)
      .font("Helvetica")
      .text("PAYMENT DATE", rightColX, y);
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica")
      .text(formatDate(receipt.paymentDate), rightColX, y + 12);
  }

  y += 50;

  // ============================================
  // STUDENT INFO SECTION
  // ============================================

  // Section header
  doc
    .fillColor(accentColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("STUDENT INFORMATION", leftColX, y);
  y += 20;

  // Student details box
  doc
    .fillColor("#f9fafb")
    .roundedRect(leftColX, y, pageWidth, 70, 4)
    .fill();

  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("NAME", leftColX + 15, y + 12);
  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(receipt.student.fullname, leftColX + 15, y + 24);

  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("EMAIL", leftColX + 15, y + 42);
  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font("Helvetica")
    .text(receipt.student.email, leftColX + 15, y + 54);

  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("BATCH", rightColX + 15, y + 12);
  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(receipt.batch.name, rightColX + 15, y + 24);

  y += 90;

  // ============================================
  // FEE BREAKDOWN SECTION
  // ============================================

  doc
    .fillColor(accentColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("FEE BREAKDOWN", leftColX, y);
  y += 20;

  // Table header
  doc
    .fillColor("#f3f4f6")
    .rect(leftColX, y, pageWidth, 25)
    .fill();

  doc
    .fillColor(primaryColor)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("DESCRIPTION", leftColX + 15, y + 8)
    .text("AMOUNT", leftColX + pageWidth - 100, y + 8, { width: 85, align: "right" });
  y += 25;

  // Fee items
  const feeItems = [
    { label: "Fee Amount", amount: receipt.totalAmount },
  ];

  if (receipt.discountAmount > 0) {
    feeItems.push({ label: "Discount", amount: -receipt.discountAmount });
  }

  if (receipt.lateFeeAmount > 0) {
    feeItems.push({ label: "Late Fee", amount: receipt.lateFeeAmount });
  }

  feeItems.forEach((item) => {
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(0.5)
      .moveTo(leftColX, y)
      .lineTo(leftColX + pageWidth, y)
      .stroke();

    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica")
      .text(item.label, leftColX + 15, y + 10);
    doc
      .fillColor(item.amount < 0 ? successColor : primaryColor)
      .fontSize(10)
      .font("Helvetica")
      .text(
        item.amount < 0 ? `- ${formatCurrency(Math.abs(item.amount))}` : formatCurrency(item.amount),
        leftColX + pageWidth - 100,
        y + 10,
        { width: 85, align: "right" }
      );
    y += 30;
  });

  // Net amount
  const netAmount =
    receipt.totalAmount - receipt.discountAmount + receipt.lateFeeAmount;

  doc
    .fillColor("#f3f4f6")
    .rect(leftColX, y, pageWidth, 35)
    .fill();

  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("NET PAYABLE", leftColX + 15, y + 12)
    .text(formatCurrency(netAmount), leftColX + pageWidth - 100, y + 12, {
      width: 85,
      align: "right",
    });
  y += 50;

  // ============================================
  // PAYMENT DETAILS
  // ============================================

  doc
    .fillColor(accentColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("PAYMENT DETAILS", leftColX, y);
  y += 20;

  // Payment summary box
  const boxHeight = 100;
  doc
    .fillColor("#f0fdf4")
    .roundedRect(leftColX, y, pageWidth, boxHeight, 4)
    .fill();

  // Amount Paid
  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("AMOUNT PAID", leftColX + 15, y + 12);
  doc
    .fillColor(successColor)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(formatCurrency(receipt.paidAmount), leftColX + 15, y + 24);

  // Balance Due
  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text("BALANCE DUE", rightColX + 15, y + 12);
  doc
    .fillColor(receipt.remainingAmount > 0 ? errorColor : successColor)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(formatCurrency(receipt.remainingAmount), rightColX + 15, y + 24);

  // Payment mode
  if (receipt.paymentMode) {
    doc
      .fillColor(lightGray)
      .fontSize(8)
      .font("Helvetica")
      .text("PAYMENT MODE", leftColX + 15, y + 55);
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica")
      .text(receipt.paymentMode.replace("_", " "), leftColX + 15, y + 67);
  }

  // Transaction ID / Cheque Number
  if (receipt.transactionId) {
    doc
      .fillColor(lightGray)
      .fontSize(8)
      .font("Helvetica")
      .text("TRANSACTION ID", rightColX + 15, y + 55);
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica")
      .text(receipt.transactionId, rightColX + 15, y + 67);
  } else if (receipt.chequeNumber) {
    doc
      .fillColor(lightGray)
      .fontSize(8)
      .font("Helvetica")
      .text("CHEQUE NUMBER", rightColX + 15, y + 55);
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica")
      .text(
        `${receipt.chequeNumber}${receipt.bankName ? ` (${receipt.bankName})` : ""}`,
        rightColX + 15,
        y + 67
      );
  }

  y += boxHeight + 30;

  // ============================================
  // NOTES (if any)
  // ============================================

  if (receipt.paymentNotes) {
    doc
      .fillColor(accentColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("NOTES", leftColX, y);
    y += 15;
    doc
      .fillColor(lightGray)
      .fontSize(9)
      .font("Helvetica")
      .text(receipt.paymentNotes, leftColX, y, { width: pageWidth });
    y += 40;
  }

  // ============================================
  // FOOTER
  // ============================================

  // Divider
  doc
    .strokeColor(lightGray)
    .lineWidth(0.5)
    .moveTo(leftMargin, y)
    .lineTo(pageWidth + leftMargin, y)
    .stroke();
  y += 20;

  // Generated info
  doc
    .fillColor(lightGray)
    .fontSize(8)
    .font("Helvetica")
    .text(
      `Generated by: ${receipt.generatedBy || "System"} | Generated on: ${formatDate(new Date())}`,
      leftColX,
      y,
      { align: "center" }
    );
  y += 15;

  // Disclaimer
  doc
    .fillColor(lightGray)
    .fontSize(7)
    .font("Helvetica")
    .text(
      "This is a computer-generated receipt. No signature is required.",
      leftColX,
      y,
      { align: "center" }
    );

  return doc;
}
