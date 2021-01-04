import { Router } from "express";
import { createBucket, bucketExists } from '../storage/storage.js';
const router = Router();
import { Storage } from "@google-cloud/storage";
import { projectId, keyFilename } from "../creds.js";
const storage = new Storage({ projectId, keyFilename });
const location = 'us-east4';
const storageClass = 'standard';

// Check if the bucket already exists
router.get("/", async (req, res) => {
    const exists = await bucketExists('image-repo-bucket');
    res.json(exists);
});

router.get("/createBucket", async (req, res) => {
    const bucketName = "good-morning-cane-9";
    try {
        const [bucket] = await storage.createBucket(bucketName, {
            location,
            [storageClass]: true,
        });
        console.log(`${bucket.name} created with ${storageClass} class in ${location}.`);
        return res.send(bucket);
    } catch (err) {
        console.error(err);
        return res.send(err);
    }
});
export default router