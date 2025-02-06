import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// For ESM, determine the current directory:
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from public/images
app.use("/images", express.static(path.join(__dirname, "public", "images")));

// Set up multer for file uploads to public/images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public", "images"));
  },
  filename: function (req, file, cb) {
    // Prepend a timestamp to the original filename to avoid collisions
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

// GET endpoint to list images in public/images
app.get("/images", (req, res) => {
  const imagesDir = path.join(__dirname, "public", "images");
  fs.readdir(imagesDir, (err, files) => {
    if (err) {
      console.error("Error reading images folder:", err);
      return res.status(500).json({ error: "Unable to scan images folder" });
    }
    res.json(files);
  });
});

// POST endpoint to handle image uploads
app.post("/upload", upload.array("files"), (req, res) => {
  const files = req.files.map((file) => file.filename);
  res.json({ files });
});

// POST endpoint to analyze an image with the prompt "What is in this image?"
app.post("/analyze", async (req, res) => {
  try {
    const { imageNames, customPrompt } = req.body;
    if (!imageNames || imageNames.length === 0) {
      return res.status(400).json({ error: "No image provided" });
    }

    // For demonstration, analyze only the first image in the array.
    const imageName = imageNames[0];
    const imagePath = path.join(__dirname, "public", "images", imageName);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Read and encode the image as Base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Use the provided custom prompt if available; otherwise default to "What is in this image?"
    const promptText = customPrompt || "What is in this image?";

    // Construct the message payload as expected by the experimental OpenAI image API
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: promptText,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ];

    // Call the OpenAI API (ensure your account/model supports image inputs)
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini", // Adjust the model if necessary
      messages: messages,
    });

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error during analysis:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
