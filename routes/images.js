import { Storage } from "@google-cloud/storage";
import { Router } from "express";
const router = Router();
import { projectId, keyFilename } from "../creds.js";
const storage = new Storage({ projectId, keyFilename });

router.get("/", async (req, res) => {
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

export default router;
