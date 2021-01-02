import { Storage } from "@google-cloud/storage";
import { format } from "util";
import { Router } from "express";
import Multer from "multer";
const router = Router();
import { projectId, keyFilename } from "../creds.js";
const storage = new Storage({ projectId, keyFilename });
const bucket = storage.bucket("image-repo-bucket");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", async (req, res) => {
  res.send("Image Route Reached");
});

router.get("/all", async (req, res) => {
  const files = await getImages();
  res.send(files);
});

// Process the file upload and upload to Google Cloud Storage.
router.post("/upload", multer.single("file"), (req, res, next) => {
  if (!req.file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  // Create a new blob in the bucket and upload the file data.
  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on("error", (err) => {
    next(err);
  });

  blobStream.on("finish", () => {
    // The public URL can be used to directly access the file via HTTP.
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    // res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer);
  res.redirect('/');
});

async function listBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log("Buckets:");
    buckets.forEach((bucket) => {
      console.log(bucket.name);
    });
  } catch (err) {
    console.error("ERROR:", err);
  }
}

async function getImages() {
  const [files, queryForPage2] = await bucket.getFiles();
  console.log(files);
  console.log(queryForPage2);
  return files;
}

export default router;
