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

const upload = multer({ storage: storage }).single('file');

// Endpoint for image upload
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json(err);
    }
    const filePath = req.file.path;
    res.status(200).json({ message: 'File uploaded successfully', path: filePath });
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

// Endpoint to analyze images
app.post('/analyze', async (req, res) => {
  try {
    const { prompt, imageName } = req.body;
    const imagePath = path.join(__dirname, 'public/images', imageName);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const imageAsBase64 = fs.readFileSync(imagePath, 'base64');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageAsBase64}` } },
          ],
        },
      ],
    });
    res.send(response.choices[0].message.content);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
