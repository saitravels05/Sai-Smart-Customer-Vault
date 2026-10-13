const fs = require('fs');
const path = require('path');

// Generate a valid 16x16 ICO file with Sai Tours & Travels branded colors (Dark Navy & Orange)
function createIco() {
  const width = 16;
  const height = 16;
  const bpp = 32;
  const imageSize = 40 + (width * height * 4); // BITMAPINFOHEADER (40) + pixel data
  const fileSize = 6 + 16 + imageSize;

  const buf = Buffer.alloc(fileSize);

  // ICONDIR
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // ICO type
  buf.writeUInt16LE(1, 4); // 1 image

  // ICONDIRENTRY
  buf.writeUInt8(width, 6);
  buf.writeUInt8(height, 7);
  buf.writeUInt8(0, 8); // Color palette
  buf.writeUInt8(0, 9); // Reserved
  buf.writeUInt16LE(1, 10); // Color planes
  buf.writeUInt16LE(bpp, 12); // Bits per pixel
  buf.writeUInt32LE(imageSize, 14); // Image data size
  buf.writeUInt32LE(22, 18); // Offset to image data

  // BITMAPINFOHEADER
  let offset = 22;
  buf.writeUInt32LE(40, offset); // Header size
  buf.writeInt32LE(width, offset + 4); // Width
  buf.writeInt32LE(height * 2, offset + 8); // Height * 2 for mask
  buf.writeUInt16LE(1, offset + 12); // Planes
  buf.writeUInt16LE(bpp, offset + 14); // BPP
  buf.writeUInt32LE(0, offset + 16); // BI_RGB (no compression)
  buf.writeUInt32LE(width * height * 4, offset + 20); // Raw image size
  buf.writeInt32LE(0, offset + 24); // XPelsPerMeter
  buf.writeInt32LE(0, offset + 28); // YPelsPerMeter
  buf.writeUInt32LE(0, offset + 32); // ClrUsed
  buf.writeUInt32LE(0, offset + 36); // ClrImportant

  // Pixel data: bottom-to-top RGBA (BGRA format)
  // Branded colors: Orange (#E85A18 -> B:0x18, G:0x5A, R:0xE8, A:0xFF)
  offset += 40;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Draw a neat filled square with rounded border in orange
      const isBorder = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      const isInner = x >= 2 && x <= width - 3 && y >= 2 && y <= height - 3;
      if (isInner) {
        // Deep Navy center (#0B192C)
        buf.writeUInt8(0x2C, offset); // Blue
        buf.writeUInt8(0x19, offset + 1); // Green
        buf.writeUInt8(0x0B, offset + 2); // Red
        buf.writeUInt8(0xFF, offset + 3); // Alpha
      } else {
        // Vibrant Orange (#E85A18)
        buf.writeUInt8(0x18, offset); // Blue
        buf.writeUInt8(0x5A, offset + 1); // Green
        buf.writeUInt8(0xE8, offset + 2); // Red
        buf.writeUInt8(0xFF, offset + 3); // Alpha
      }
      offset += 4;
    }
  }

  const targetPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'favicon.ico');
  fs.writeFileSync(targetPath, buf);
  console.log('✅ Generated favicon.ico at:', targetPath);
}

createIco();
