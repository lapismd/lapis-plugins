---
"@lapis-notes/pdf": patch
---

Resolve the PDFium WASM asset through the public `@embedpdf/pdfium` package export (`@embedpdf/pdfium/pdfium.wasm`) instead of a hard-coded `node_modules/.pnpm` path, so the portable package and archive builds complete.