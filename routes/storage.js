import { Router } from "express";
import { createBucket, bucketExists } from '../storage/storage.js';
const router = Router();

router.get("/", async (req, res) => {
    await createBucket('image-repo-buck');
    res.json("Hello");
});
export default router