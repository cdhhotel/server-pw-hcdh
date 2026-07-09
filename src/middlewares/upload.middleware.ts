import multer from "multer";
import path from "path";
import fs from "fs";

/** Fábrica genérica: crea un diskStorage apuntando a la subcarpeta indicada */
function makeStorage(subfolder: string) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), `uploads/${subfolder}`);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
}

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no válido. Solo se permiten imágenes (.jpg, .jpeg, .png, .webp)"), false);
  }
};

const LIMIT = { fileSize: 5 * 1024 * 1024 }; // 5 MB

export const uploadRoomImages = multer({
  storage: makeStorage("rooms"),
  fileFilter,
  limits: LIMIT,
});

export const uploadItineraryImages = multer({
  storage: makeStorage("itinerary"),
  fileFilter,
  limits: LIMIT,
});
