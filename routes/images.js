import { Storage } from "@google-cloud/storage";
import { Router } from "express";
import fs from "fs";
import path from "path";
const router = Router();
import { projectId, keyFilename } from "../creds.js";
const storage = new Storage({ projectId, keyFilename });
const bucketName = "image-repo-bucket";
const sampleImageLocation = path.resolve("../sample_images/diabolo.jpg");

router.get("/", async (req, res) => {
  await testUpload();
  res.send("Image Route Reached");
});

router.get("/all", async (req, res) => {
  await listBuckets();
  res.send("Image Route Reached");
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
  const imageRepoBucket = storage.bucket(bucketName);
}

async function testUpload() {
  const imageRepoBucket = storage.bucket(bucketName);
  // Need to write the file onto disk temporarily to upload
  console.log(imageRepoBucket.name);
  imageRepoBucket.upload(sampleImageLocation);
  // imageRepoBucket.upload()
}

export default router;
