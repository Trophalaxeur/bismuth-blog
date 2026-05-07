import sharp from 'sharp'

const src = 'docs/bismuth.png'
const dest = 'public/favicon'

const sizes = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 },
]

await Promise.all(
  sizes.map(({ file, size }) =>
    sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(`${dest}/${file}`)
      .then(() => console.log(`✓ ${file}`)),
  ),
)
