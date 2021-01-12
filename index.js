import express from "express";
import cors from "cors";
import imageRouter from "./routes/images.js";
import storageRouter from './routes/storage.js';
import bodyParser from "body-parser";
import dotenv from 'dotenv';
const app = express();
const PORT = process.env.PORT || 5000;
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "pug");
app.use(bodyParser.json());

app.use('/', express.static('public'));
// Routes
app.use("/images", imageRouter);
app.use("/storage", storageRouter);

app.get("/", async (req, res) => {
  res.send("Default Route Reached");
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
