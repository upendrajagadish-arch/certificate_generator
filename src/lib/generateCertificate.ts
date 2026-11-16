import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/** High-res template (2× original) for sharper PDF output. */
const TEMPLATE_WIDTH = 2048;
const TEMPLATE_HEIGHT = 1536;

/** Gold divider at 53.65% from top — name baseline sits on the line. */
const GOLD_LINE_Y_FROM_TOP = 0.5365;
const NAME_MAX_WIDTH_RATIO = 0.58;
const NAME_BASE_SIZE = 108; // 54 × 2 for 2× template

export function normalizeCertificateName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

export async function generateCertificatePdf(fullName: string): Promise<Uint8Array> {
  const [templateRes, fontRes] = await Promise.all([
    fetch('/certificate-template.jpg'),
    fetch('/fonts/GreatVibes-Regular.ttf'),
  ]);

  if (!templateRes.ok) throw new Error('Could not load certificate template');
  if (!fontRes.ok) throw new Error('Could not load certificate font');

  const templateBytes = new Uint8Array(await templateRes.arrayBuffer());
  const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const image = await doc.embedJpg(templateBytes);
  const font = await doc.embedFont(fontBytes, { subset: true });

  const pageWidth = TEMPLATE_WIDTH;
  const pageHeight = TEMPLATE_HEIGHT;
  const page = doc.addPage([pageWidth, pageHeight]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  // Exact same normalized text as the soft-copy preview
  const name = normalizeCertificateName(fullName);

  let size = NAME_BASE_SIZE;
  const maxWidth = pageWidth * NAME_MAX_WIDTH_RATIO;
  while (size > 44 && font.widthOfTextAtSize(name, size) > maxWidth) {
    size -= 1;
  }

  const textWidth = font.widthOfTextAtSize(name, size);
  const x = (pageWidth - textWidth) / 2;
  const y = pageHeight * (1 - GOLD_LINE_Y_FROM_TOP);

  // Single drawText = natural font spacing (matches preview)
  page.drawText(name, {
    x,
    y,
    size,
    font,
    color: rgb(0.12, 0.1, 0.18),
  });

  return doc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
