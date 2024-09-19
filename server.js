const fs = require("fs");
const path = require("path");

// Define the path for the history JSON file
const historyFilePath = path.join(__dirname, "ai-response-history.json");

// Helper function to save history to JSON file
const saveHistory = (history) => {
  fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
};

// Helper function to read history from JSON file
const readHistory = () => {
  if (!fs.existsSync(historyFilePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(historyFilePath);
  return JSON.parse(fileContent);
};

// Endpoint to get AI response history
app.get("/history", (req, res) => {
  const history = readHistory();
  res.status(200).json(history);
});

// Endpoint to analyze Bitcoin chart images and save history
app.post("/analyze", async (req, res) => {
  try {
    const { imageNames, customPrompt } = req.body;
    const imagePaths = imageNames.map((name) =>
      path.join(__dirname, "public/images", name)
    );

    const imagesAsBase64 = imagePaths.map((imagePath) =>
      fs.readFileSync(imagePath, "base64")
    );

    const imageUrls = imagesAsBase64.map((base64) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${base64}` },
    }));

    const promptMessage = customPrompt
      ? customPrompt
      : "Analyze the following Bitcoin chart images and provide trading instructions:";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI that analyzes Bitcoin price chart images with indicators like MACD, RSI, and Moving Averages.",
        },
        {
          role: "user",
          content: [
            promptMessage,
            "Decision: Long or Short",
            "Entry Price: Based on the current price in the image",
            "Take Profit: Set based on resistance levels",
            "Stop Loss: Set based on support levels",
            ...imageUrls,
          ],
        },
      ],
    });

    // Save the response and request to history
    const history = readHistory();
    const newEntry = {
      images: imageNames,
      prompt: customPrompt || promptMessage,
      response: response.choices[0].message.content,
      timestamp: new Date().toISOString(),
    };
    history.push(newEntry);
    saveHistory(history);

    res.send(response.choices[0].message.content);
  } catch (err) {
    console.error("Error processing request:", err);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
});
