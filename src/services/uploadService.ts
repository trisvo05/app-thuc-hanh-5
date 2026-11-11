const CLOUDINARY_CLOUD_NAME = '';
const CLOUDINARY_UNSIGNED_PRESET = '';

/** Uploads a resized local image URI using an unsigned preset. Never put an API secret in the app. */
export async function uploadImage(uri: string, mimeType = 'image/jpeg') {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UNSIGNED_PRESET) {throw new Error('Hãy cấu hình Cloudinary cloud name và unsigned upload preset trong uploadService.ts.');}
  const form = new FormData();
  form.append('file', {uri, type: mimeType, name: `chat-${Date.now()}.jpg`} as unknown as Blob);
  form.append('upload_preset', CLOUDINARY_UNSIGNED_PRESET);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {method: 'POST', body: form});
  const result = await response.json();
  if (!response.ok || !result.secure_url) {throw new Error(result.error?.message ?? 'Tải ảnh lên thất bại.');}
  return result.secure_url as string;
}
