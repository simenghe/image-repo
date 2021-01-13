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

router.post("/testauth", async (req, res) => {
    console.log(req.headers.uid);
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    console.log(token);
    console.log(req.body);
    return res.send(req.headers.Authorization);
});

export default router