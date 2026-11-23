import { apiRequest } from "./api";

export type UploadedAttachment = {
  url: string;
  type: "image" | "video";
  name: string;
};

export const uploadService = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<UploadedAttachment>("/Uploads", {
      method: "POST",
      body: formData,
    });
  },
};