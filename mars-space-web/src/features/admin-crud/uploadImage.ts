import { http } from '@/shared/api/axios-instance';
import { endpoints } from '@/shared/api/endpoints';

export interface UploadedFile {
  id: string;
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

/** POST an image file to the uploads endpoint (multipart field name: `file`). */
export async function uploadImage(file: File): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  return http.post<UploadedFile>(endpoints.admin.uploadImage, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
