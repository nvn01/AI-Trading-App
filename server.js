const PORT = 8000;
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage }).array('files', 10); // For multiple images

// Endpoint for image upload (multiple images)
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json(err);
    }
    const filePaths = req.files.map(file => file.path);
    const fileNames = filePaths.map(path => path.split('/').pop());
    res.status(200).json({ message: 'Files uploaded successfully', files: fileNames });
  });
});

// Endpoint to get images
app.get('/images', (req, res) => {
  const directoryPath = path.join(__dirname, 'public/images');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading images directory:', err);
      return res.status(500).send('Unable to scan directory: ' + err);
    }
    res.status(200).json(files);
  });
});

// Endpoint to analyze Bitcoin chart images and generate trading instructions
app.post('/analyze', async (req, res) => {
  try {
    const { imageNames } = req.body; // Array of image names
    const imagePaths = imageNames.map(name => path.join(__dirname, 'public/images', name));

    // Ensure all images exist
    for (const imagePath of imagePaths) {
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ error: 'One or more images not found' });
      }
    }

    // Convert images to base64
    const imagesAsBase64 = imagePaths.map(imagePath => fs.readFileSync(imagePath, 'base64'));

    // Build the message for OpenAI
    const imageUrls = imagesAsBase64.map(base64 => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }));

    // Create the OpenAI request to generate structured trading instructions
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Keep your model here
      messages: [
        {
          role: 'system',
          content: "You are an AI that analyzes Bitcoin price chart images (15M, 1H, or 4H) with indicators like MACD, RSI, and Moving Averages, and provides structured trading instructions."
        },
        {
          role: 'user',
          content: [
            "Analyze the following Bitcoin chart images and provide trading instructions with the following structure:",
            "Decision: Long or Short",
            "Entry Price: Based on the current price in the image",
            "Take Profit: Set based on resistance levels or positive momentum from indicators",
            "Stop Loss: Set based on support levels or negative momentum",
            ...imageUrls
          ]
        }
      ],
    });

    // Send back the structured trading instructions
    res.send(response.choices[0].message.content);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
