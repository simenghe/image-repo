import { Storage } from "@google-cloud/storage";
import { format } from "util";
import { Router } from "express";
import Multer from "multer";
import { createBucket, bucketExists } from "../storage/storage.js";
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

router.get("/getuserurls", async (req, res) => {
  const fileconfig = {
    action: "read",
    expires: "03-17-2025",
  };
  try {
    let curBucket = bucket;
    if (req.headers.uid && req.headers.publicupload == "false") {
      const uid = req.headers.uid.toLowerCase();
      console.log(`Authenticated with bucket ${uid}`);
      curBucket = storage.bucket(uid);
    }
    const files = await curBucket.getFiles();
    const fileList = files[0];
    const fileUrls = [];
    for (const file of fileList) {
      const signedUrl = await file.getSignedUrl(fileconfig);
      const metadata = await file.getMetadata();
      const timeUpdated = metadata[0].updated;
      fileUrls.push({
        signedUrl: signedUrl[0],
        id: file.id,
        name: file.name,
        date: timeUpdated,
      });
      // console.log(signedUrl[0]);
    }
    return res.send(fileUrls);
  } catch (err) {
    console.log(err);
    return res.send(401).json(err);
  }
});


router.get("/getfilesurls", async (req, res) => {
  const googleBucketURL = `https://storage.googleapis.com/`;
  try {
    if (req.headers.publicupload == "false" && req.headers.uid) {
      console.log(`Authenticated with uid ${req.headers.uid}`)
      files = await getImageURLs(req.headers.uid.toLowerCase());
    } else {
      files = await getImages();
    }
    const filesURLs = files.map(
      (file) => `${googleBucketURL}${file.bucket.id}/${file.id}`
    );
    return res.send(filesURLs);
  } catch (err) {
    return res.send(403).json("Getting File Error!");
  }
});

// Process the file upload and upload to Google Cloud Storage.
router.post("/upload", multer.single("file"), (req, res, next) => {
  console.log(req.headers.uid);
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  console.log(token);
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
  res.redirect("/");
});

router.post("/uploadmultiple", multer.any(), async (req, res) => {
  if (!req.files) {
    return res.status(400).send("No file uploaded.");
  }
  let curBucket = bucket;
  const uid = req.headers.uid.toLowerCase();
  const publicupload = req.headers.publicupload;
  if (uid && publicupload == "false") {
    try {
      const exists = await bucketExists(uid);
      if (!exists) {
        await createBucket(uid);
      }
      curBucket = storage.bucket(uid);
    } catch (err) {
      console.error(err);
    }
  }
  console.log(req.files.length);
  for (let i = 0; i < req.files.length; i++) {
    const blob = curBucket.file(req.files[i].originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on("error", (err) => {
      next(err);
    });

    blobStream.on("finish", () => {
      // The public URL can be used to directly access the file via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${curBucket.name}/${blob.name}`
      );
      console.log(publicUrl);
      // res.status(200).send(publicUrl);
    });

    blobStream.end(req.files[i].buffer);
  }
  // Create a new blob in the bucket and upload the file data.
  return res.send(req.files);
});


router.delete("/delete/:id", async (req, res) => {
  const uid = req.headers.uid.toLowerCase();
  const publicupload = req.headers.publicupload;
  console.log(req.params.id);
  if (uid && publicupload == "false" && req.params.id) {
    try {
      const exists = await bucketExists(uid);
      if (!exists) {
        await createBucket(uid);
      }
      const curBucket = storage.bucket(uid);
      const deleted = await curBucket.file(req.params.id).delete();
      console.log(deleted)
      return res.send(deleted);
    } catch (err) {
      console.error(err);
      return res.send(401).json(err)
    }
  }
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
  return files;
}

async function getImageURLs(bucketName) {
  const curBucket = storage.bucket(bucketName);
  try {
    const [files, queryForPage2] = await curBucket.getFiles();
    return files;
  } catch (err) {
    console.error(err);
  }
}

export default router;
