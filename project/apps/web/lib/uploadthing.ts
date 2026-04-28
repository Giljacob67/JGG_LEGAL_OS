import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuthUser } from "./auth";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "32MB", maxFileCount: 5 },
    image: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "4MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const user = await getAuthUser();
      if (!user) throw new Error("Não autenticado");
      return { userId: user.id, userEmail: user.email };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload completo por", metadata.userEmail);
      console.log("Arquivo:", file.name, file.url);
      return { uploadedBy: metadata.userId, url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
