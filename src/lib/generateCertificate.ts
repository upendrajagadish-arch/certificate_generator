import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

/** High-res template (2× original) for sharper PDF output. */
const TEMPLATE_WIDTH = 2048;
const TEMPLATE_HEIGHT = 1536;

/** Gold divider densest row ~825px → 53.71% from top. */
const GOLD_LINE_Y_FROM_TOP = 0.5371;
/** Lift baseline above the gold line so script rests ON the line. */
const BASELINE_NUDGE_PX = 16;
const NAME_MAX_WIDTH_RATIO = 0.62;
const NAME_BASE_SIZE = 124;
const NAME_COLOR = rgb(0.04, 0.03, 0.09);

/**
 * Allura reads clearer than Great Vibes (less stroke pile-up).
 * Keep joining features off so pdf-lib doesn't invent odd gaps/overlaps.
 */
const FONT_FEATURES = {
  liga: false,
  dlig: false,
  clig: false,
  calt: false,
  curs: false,
} as const;

export function normalizeCertificateName(fullName: string): string {
  return fullName
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function generateCertificatePdf(fullName: string): Promise<Uint8Array> {
  const [templateRes, fontRes] = await Promise.all([
    fetch('/certificate-template.jpg'),
    fetch('/fonts/Allura-Regular.ttf'),
  ]);

  if (!templateRes.ok) throw new Error('Could not load certificate template');
  if (!fontRes.ok) throw new Error('Could not load certificate font');

  const templateBytes = new Uint8Array(await templateRes.arrayBuffer());
  const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const image = await doc.embedJpg(templateBytes);
  const font = await doc.embedFont(fontBytes, {
    subset: false,
    features: { ...FONT_FEATURES },
  });

  const pageWidth = TEMPLATE_WIDTH;
  const pageHeight = TEMPLATE_HEIGHT;
  const page = doc.addPage([pageWidth, pageHeight]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  const name = normalizeCertificateName(fullName);

  let size = NAME_BASE_SIZE;
  const maxWidth = pageWidth * NAME_MAX_WIDTH_RATIO;
  while (size > 52 && font.widthOfTextAtSize(name, size) > maxWidth) {
    size -= 1;
  }

  const textWidth = font.widthOfTextAtSize(name, size);
  const x = (pageWidth - textWidth) / 2;
  const y = pageHeight * (1 - GOLD_LINE_Y_FROM_TOP) + BASELINE_NUDGE_PX;

  // One natural draw — no manual tracking (that caused letter overlaps)
  page.drawText(name, {
    x,
    y,
    size,
    font,
    color: NAME_COLOR,
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
