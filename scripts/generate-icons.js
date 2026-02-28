const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// CRC32 implementation
const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF]
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length, 0)
  const crcVal = Buffer.allocUnsafe(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([len, typeBytes, data, crcVal])
}

function createIcon(size) {
  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.42
  const innerR = size * 0.34

  // Color palette matching the app (#09090b dark, #F59E0B amber)
  const BG    = [9, 9, 11]
  const RING  = [161, 104, 5]   // dark amber ring
  const GOLD  = [245, 158, 11]  // #F59E0B amber fill
  const SHINE = [253, 224, 71]  // lighter shine

  const raw = Buffer.allocUnsafe(size * (1 + size * 3))
  let offset = 0

  for (let y = 0; y < size; y++) {
    raw[offset++] = 0 // PNG filter byte: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      let col
      if (dist <= innerR) {
        // Gold coin face — add subtle top-left shine
        const shineFactor = Math.max(0, (-dx - dy) / (innerR * 1.4))
        col = [
          Math.min(255, Math.round(GOLD[0] + shineFactor * (SHINE[0] - GOLD[0]))),
          Math.min(255, Math.round(GOLD[1] + shineFactor * (SHINE[1] - GOLD[1]))),
          Math.min(255, Math.round(GOLD[2] + shineFactor * (SHINE[2] - GOLD[2]))),
        ]
      } else if (dist <= outerR) {
        col = RING
      } else {
        col = BG
      }

      raw[offset++] = col[0]
      raw[offset++] = col[1]
      raw[offset++] = col[2]
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 })

  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ])
}

const publicDir = path.join(__dirname, '..', 'public')

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createIcon(192))
console.log('✓ icon-192.png')

fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createIcon(512))
console.log('✓ icon-512.png')
