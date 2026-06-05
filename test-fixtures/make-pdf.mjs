// Generates a small, valid multi-page text PDF (correct xref offsets) used to
// manually test Distill's digital-PDF extraction path. Not shipped.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));

function line(size, x, y, text) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${text.replace(/([()\\])/g, "\\$1")}) Tj ET\n`;
}

const page1 =
  line(26, 72, 720, "Distill Test Report") +
  line(11, 72, 688, "This is the first paragraph of the document. It contains enough real,") +
  line(11, 72, 674, "embedded text that it should be extracted directly without any OCR at") +
  line(11, 72, 660, "all, which is fast, free, and perfectly accurate.") +
  line(16, 72, 624, "Why tokens matter") +
  line(11, 72, 598, "Sending a page as an image is expensive. The same page as text is far") +
  line(11, 72, 584, "cheaper for a language model to read.") +
  line(13, 72, 552, "Key points") +
  line(11, 72, 528, "- Digital PDFs keep their real text inside them") +
  line(11, 72, 514, "- That text is tiny compared to an image of the page") +
  line(11, 72, 500, "- Clean Markdown is the friendliest format for AI");

const page2 =
  line(16, 72, 720, "Page Two") +
  line(11, 72, 694, "A second page proves that multi-page documents are stitched together") +
  line(11, 72, 680, "into a single Markdown result.");

const objects = [];
objects.push("<< /Type /Catalog /Pages 2 0 R >>");
objects.push("<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>");
objects.push(
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
);
objects.push(`<< /Length ${page1.length} >>\nstream\n${page1}endstream`);
objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
objects.push(
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 7 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
);
objects.push(`<< /Length ${page2.length} >>\nstream\n${page2}endstream`);

let pdf = "%PDF-1.4\n";
const offsets = [];
objects.forEach((body, i) => {
  offsets[i] = pdf.length;
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});

const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((off) => {
  pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
});
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

const out = join(dir, "sample-digital.pdf");
writeFileSync(out, pdf, "latin1");
console.log("wrote", out, `(${pdf.length} bytes, ${objects.length} objects)`);
