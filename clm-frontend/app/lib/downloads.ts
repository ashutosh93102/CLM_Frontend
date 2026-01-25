import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function sanitizeForWinAnsi(input: string): string {
  // pdf-lib standard fonts use WinAnsi encoding; many unicode symbols (e.g. ☐) will crash.
  // We intentionally normalize to safe ASCII for production reliability.
  const s = (input || '')
    .replace(/\u2610/g, '[ ]') // ☐
    .replace(/\u2611/g, '[x]') // ☑
    .replace(/\u2705/g, '[x]') // ✅
    .replace(/\u2713|\u2714/g, 'x') // ✓ ✔
    .replace(/[\u2022\u25CF\u25A0]/g, '*') // bullets
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-') // dashes
    .replace(/[\u2018\u2019\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201F\u2033]/g, '"')
    .replace(/\u00A0/g, ' '); // nbsp

  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    // Keep common ASCII + whitespace.
    if (ch === '\n' || ch === '\r' || ch === '\t') {
      out += ch;
      continue;
    }
    if (code >= 0x20 && code <= 0x7e) {
      out += ch;
      continue;
    }
    // Replace anything else with a space to preserve layout.
    out += ' ';
  }
  return out;
}

function wrapText(params: {
  text: string;
  maxWidth: number;
  font: any;
  fontSize: number;
}): string[] {
  const { text, maxWidth, font, fontSize } = params;

  const lines: string[] = [];
  const paragraphs = (text || '').replace(/\r\n/g, '\n').split('\n');

  for (const para of paragraphs) {
    if (!para) {
      lines.push('');
      continue;
    }

    const words = para.split(/\s+/g);
    let current = '';

    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      const width = font.widthOfTextAtSize(next, fontSize);
      if (width <= maxWidth) {
        current = next;
        continue;
      }

      if (current) lines.push(current);

      // Extremely long token: hard-break.
      let token = w;
      while (font.widthOfTextAtSize(token, fontSize) > maxWidth && token.length > 1) {
        let cut = Math.max(1, Math.floor((maxWidth / font.widthOfTextAtSize(token, fontSize)) * token.length));
        cut = Math.min(token.length - 1, cut);
        lines.push(token.slice(0, cut));
        token = token.slice(cut);
      }
      current = token;
    }

    if (current) lines.push(current);
  }

  return lines;
}

export async function downloadTextAsPdf(params: {
  filename: string;
  title?: string;
  text: string;
}): Promise<void> {
  const filenameBase = (params.filename || 'template').replace(/\.txt$/i, '');
  const outName = `${filenameBase}.pdf`;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // US Letter
  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 54;
  const marginTop = 64;
  const marginBottom = 54;
  const fontSize = 11;
  const leading = 16;

  const maxTextWidth = pageWidth - marginX * 2;
  const safeText = sanitizeForWinAnsi(params.text);
  const lines = wrapText({ text: safeText, maxWidth: maxTextWidth, font, fontSize });

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  // Header
  const title = (params.title || filenameBase).trim();
  if (title) {
    page.drawText(title.toUpperCase(), {
      x: marginX,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.06, 0.08, 0.12),
    });
    y -= 26;
    page.drawLine({
      start: { x: marginX, y },
      end: { x: pageWidth - marginX, y },
      thickness: 1,
      color: rgb(0.85, 0.87, 0.9),
    });
    y -= 18;
  }

  for (const line of lines) {
    if (y <= marginBottom) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginTop;
    }

    page.drawText(line, {
      x: marginX,
      y,
      size: fontSize,
      font,
      color: rgb(0.08, 0.1, 0.14),
    });

    y -= leading;
  }

  const pdfBytes = await pdfDoc.save();
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = outName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
