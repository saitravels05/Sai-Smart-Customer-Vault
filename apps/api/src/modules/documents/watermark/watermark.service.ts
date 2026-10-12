import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

export interface WatermarkOptions {
  staffName?: string;
  branchName?: string;
  documentId?: string;
  timestamp?: Date;
}

@Injectable()
export class WatermarkService {
  private readonly logger = new Logger(WatermarkService.name);

  async applyPdfWatermark(pdfBuffer: Buffer, options: WatermarkOptions = {}): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const timestampStr = (options.timestamp || new Date()).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
      });
      const staffInfo = options.staffName || 'AUTHORIZED STAFF';
      const branchInfo = options.branchName || 'SAI TOURS & TRAVELS';
      const docIdSnippet = options.documentId ? `[VAULT-REF: ${options.documentId.slice(0, 8)}]` : '';

      const diagonalText = `CONFIDENTIAL — SAI TOURS & TRAVELS — ${timestampStr} — ${staffInfo}`;
      const footerText = `SAI SMART VAULT ${docIdSnippet} • Verified for Official Travel Processing • ${branchInfo} • User: ${staffInfo} • ${timestampStr}`;

      for (const page of pages) {
        const { width, height } = page.getSize();

        // 1. Diagonal Watermark in Center
        const fontSize = Math.max(14, Math.min(24, Math.floor(width / 32)));
        page.drawText(diagonalText, {
          x: width * 0.12,
          y: height * 0.45,
          size: fontSize,
          font: helveticaBold,
          color: rgb(0.8, 0.2, 0.2),
          opacity: 0.2,
          rotate: degrees(-38),
        });

        // 2. Security Footer Banner at bottom
        page.drawRectangle({
          x: 0,
          y: 0,
          width: width,
          height: 18,
          color: rgb(0.04, 0.1, 0.17), // Deep navy
          opacity: 0.85,
        });

        page.drawText(footerText, {
          x: 10,
          y: 5,
          size: 7.5,
          font: helvetica,
          color: rgb(1, 1, 1),
          opacity: 0.95,
        });
      }

      const modifiedBytes = await pdfDoc.save();
      return Buffer.from(modifiedBytes);
    } catch (err: any) {
      this.logger.warn(`Failed to apply PDF watermark: ${err.message}. Returning original buffer.`);
      return pdfBuffer;
    }
  }
}
