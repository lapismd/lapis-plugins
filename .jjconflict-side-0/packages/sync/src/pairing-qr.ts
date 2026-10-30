import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import {
  BinaryBitmap,
  HybridBinarizer,
  QRCodeReader,
  RGBLuminanceSource,
} from "@zxing/library";
import QRCode from "qrcode";

export const PAIRING_QR_MARGIN_MODULES = 4;

export function pairingQrDataUrl(value: string, width = 320): Promise<string> {
  return QRCode.toDataURL(value, {
    width,
    margin: PAIRING_QR_MARGIN_MODULES,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export function decodePairingQrMatrix(value: string): string {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const scale = 4;
  const size = qr.modules.size;
  const width = (size + PAIRING_QR_MARGIN_MODULES * 2) * scale;
  const luminance = new Uint8ClampedArray(width * width);
  luminance.fill(255);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (!qr.modules.get(row, column)) continue;
      const startX = (column + PAIRING_QR_MARGIN_MODULES) * scale;
      const startY = (row + PAIRING_QR_MARGIN_MODULES) * scale;
      for (let y = 0; y < scale; y += 1) {
        for (let x = 0; x < scale; x += 1) {
          luminance[(startY + y) * width + startX + x] = 0;
        }
      }
    }
  }
  const bitmap = new BinaryBitmap(
    new HybridBinarizer(new RGBLuminanceSource(luminance, width, width)),
  );
  return new QRCodeReader().decode(bitmap).getText();
}

export async function scanPairingQr(
  video: HTMLVideoElement,
  onResult: (value: string) => void,
  onError: (error: Error) => void,
): Promise<IScannerControls> {
  const reader = new BrowserQRCodeReader(undefined, {
    delayBetweenScanAttempts: 100,
    delayBetweenScanSuccess: 500,
  });
  return reader.decodeFromVideoDevice(undefined, video, (result, error) => {
    if (result) onResult(result.getText());
    else if (error && error.name !== "NotFoundException") onError(error);
  });
}
