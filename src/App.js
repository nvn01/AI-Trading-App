import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [images, setImages] = useState([]);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  const analyzeImages = async () => {
    setResponse("");
    if (images.length === 0) {
      setError("Please upload at least one image.");
      return;
    }

    try {
      const results = await Promise.all(images.map(async (image) => {
        const formData = new FormData();
        formData.append("file", image);
        const { data } = await axios.post("http://localhost:8000/upload", formData);
        const prompt = "Analyze this trading chart.";
        const { data: openaiResponse } = await axios.post("http://localhost:8000/openai", {
          message: prompt,
          imageUrl: data.path,  // Assuming your backend returns the path
          assistant_id: process.env.REACT_APP_OPENAI_ASSISTANT_ID,
        });
        return openaiResponse.message;
      }));

      setResponse(results.join("\n"));
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="app">
      <h1>Trading Chart Analyzer</h1>
      <input type="file" accept="image/*" multiple onChange={handleFiles} />
      <button onClick={analyzeImages}>Analyze</button>
      {error && <p>{error}</p>}
      {response && <div>
        <h2>Analysis Results</h2>
        <p>{response}</p>
      </div>}
    </div>
  );
};

export default App;
