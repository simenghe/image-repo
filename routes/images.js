import { Storage } from "@google-cloud/storage";
import { format } from "util";
import { Router } from "express";
import publicimagemodel from "../models/publicImage.js";
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

// Go through by bucket
router.get("/getpublicurls", async (req, res) => {
  try {
    const buckets = await storage.getBuckets();
    const publicFiles = [];
    console.log(buckets);
    for (const buck of buckets[0]) {
      const files = await buck.getFiles();
      for (const file of files[0]) {
        const isPublic = await file.isPublic();
        console.log(isPublic[0]);
        if (isPublic[0]) {
          publicFiles.push({
            id: file.id,
            name: file.name,
            url: file.publicUrl(),
            date: file.metadata.updated,
            size: file.metadata.size,
          })
        }
      }
    }
    return res.send(publicFiles);
  } catch (err) {
    console.error(err);
    return res.send(401).json(err);
  }
});

// Signs all of the user's images, including public facing ones.
router.get("/getuserurls", async (req, res) => {
  let expiryDate = new Date();
  // Set the expiry to tommorow
  expiryDate.setDate(expiryDate.getDate() + 1);
  const fileconfig = {
    action: "read",
    expires: expiryDate,
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

router.post("/uploadmultiple", multer.array('images', 10), async (req, res) => {
  if (!req.files) {
    return res.status(400).send("No file uploaded.");
  }
  const uid = req.headers.uid.toLowerCase();
  let curBucket = storage.bucket(uid);
  const publicupload = req.headers.publicupload;
  let publicUpload = true;
  if (uid && publicupload == "false") {
    publicUpload = false;
  }
  try {
    const exists = await bucketExists(uid);
    if (!exists) {
      await createBucket(uid);
    }
    curBucket = storage.bucket(uid);
  } catch (err) {
    console.error(err);
  }

  console.log(req.files.length);
  for (let i = 0; i < req.files.length; i++) {
    const blob = curBucket.file(req.files[i].originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on("error", (err) => {
      next(err);
    });

    blobStream.on("finish", async () => {
      // The public URL can be used to directly access the file via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${curBucket.name}/${blob.name}`
      );
      if (publicUpload) {
        console.log("Public file being created!");
        try {
          await blob.makePublic();
          console.log("Made Public!");
        } catch (err) {
          console.error(err);
        }
      }
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

router.post("/deletebatch", async (req, res) => {
  const uid = req.headers.uid.toLowerCase();
  try {
    if (req.body.ids && uid) {
      for (const id of req.body.ids) {

      }
    }
  } catch (err) {
    console.error(err);
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
