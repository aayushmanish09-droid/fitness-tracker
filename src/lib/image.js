// Read an image File and return a downscaled, center-cropped square JPEG
// data URL — keeps avatars small (localStorage-friendly) and consistent.
export function readImageAsAvatar(file, size = 400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'))
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'))

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("That image couldn't be loaded."))
      img.onload = () => {
        try {
          resolve(squareCrop(img, size, quality))
        } catch (e) {
          reject(e)
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Center-crop any image source (HTMLImageElement or HTMLVideoElement) to a
// square and return a JPEG data URL. `mirror` flips horizontally (selfie).
export function squareCrop(source, size = 400, quality = 0.85, mirror = false) {
  const w = source.videoWidth || source.naturalWidth || source.width
  const h = source.videoHeight || source.naturalHeight || source.height
  const side = Math.min(w, h)
  const sx = (w - side) / 2
  const sy = (h - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (mirror) {
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', quality)
}
