/** Reduce una foto del celular (3–5 MB) a WebP de ~1200 px y menos de ~200 KB. */
export async function compressImage(file: Blob, maxSide = 1200, targetBytes = 200_000): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * scale)
  const h = Math.round(bmp.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  let quality = 0.82
  let blob = await toBlob(canvas, quality)
  while (blob.size > targetBytes && quality > 0.45) {
    quality -= 0.1
    blob = await toBlob(canvas, quality)
  }
  return blob
}

function toBlob(c: HTMLCanvasElement, q: number): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo comprimir'))), 'image/webp', q))
}
