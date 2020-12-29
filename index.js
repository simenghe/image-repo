import express from "express";
import cors from "cors";
import imageRouter from "./routes/images.js";
import bodyParser from "body-parser";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "pug");
app.use(bodyParser.json());

// Routes
app.use("/images", imageRouter);

app.get("/", async (req, res) => {
  res.send("Default Route Reached");
});

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
});
