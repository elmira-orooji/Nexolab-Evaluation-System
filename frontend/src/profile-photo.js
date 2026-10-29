export async function preparePhoto(file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error('فایل PNG، JPG یا WebP با حجم حداکثر ۵ مگابایت انتخاب کنید.');
  }
  let image;
  try {
    // Decode the File directly: blob: image URLs are disallowed by the server CSP.
    image = await createImageBitmap(file, {imageOrientation: 'from-image'});
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 192;
    const context = canvas.getContext('2d');
    if (!context || !image.width || !image.height) throw new Error('Invalid image');
    const size = Math.min(image.width, image.height);
    context.drawImage(image, (image.width-size)/2, (image.height-size)/2, size, size, 0, 0, 192, 192);
    return canvas.toDataURL('image/png').split(',')[1];
  } catch {
    throw new Error('تصویر باز نمی‌شود؛ یک فایل PNG، JPG یا WebP سالم انتخاب کنید.');
  } finally { image?.close(); }
}
