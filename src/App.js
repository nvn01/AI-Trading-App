// src/App.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, Route, Routes } from "react-router-dom";
import History from "./History";

const App = () => {
  const [images, setImages] = useState([]);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/images");
        setImages(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch images");
      }
    };
    fetchImages();
  }, []);

  const analyzeImages = async (selectedImages) => {
    try {
      const { data } = await axios.post("http://localhost:8000/analyze", {
        imageNames: selectedImages,
        customPrompt,
      });
      setResponses((prevResponses) => [
        ...prevResponses,
        { images: selectedImages, message: data },
      ]);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze images");
    }
  };

  // **Ensure the uploadImages function is defined**
  const uploadImages = async (event) => {
    const formData = new FormData();
    Array.from(event.target.files).forEach((file) =>
      formData.append("files", file)
    );

    try {
      const { data } = await axios.post(
        "http://localhost:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setImages((prevImages) => [...prevImages, ...data.files]);
    } catch (err) {
      console.error(err);
      setError("Failed to upload images");
    }
  };

  return (
    <div className="app">
      <h1>Bitcoin Chart Analyzer - Trading Instructions</h1>
      <nav>
        <Link to="/">Home</Link> |{" "}
        <Link to="/history">AI Response History</Link>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <div>
              {error && <p style={{ color: "red" }}>{error}</p>}
              <div style={{ marginTop: "20px" }}>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Optional: Enter custom prompt"
                  style={{ width: "300px", padding: "8px" }}
                />
              </div>
              <div style={{ marginTop: "20px" }}>
                <input
                  type="file"
                  multiple
                  onChange={uploadImages}
                  accept="image/*"
                />
              </div>
              <div className="images-container" style={{ marginTop: "20px" }}>
                {images.length === 0 ? (
                  <p>No images uploaded yet.</p>
                ) : (
                  images.map((image, index) => (
                    <div
                      key={index}
                      className="image-item"
                      style={{
                        display: "inline-block",
                        margin: "10px",
                        border: "1px solid #ccc",
                        padding: "10px",
                      }}
                    >
                      <img
                        src={`images/${image}`}
                        alt={`Chart ${index}`}
                        style={{ width: "200px", height: "auto" }}
                      />
                      <p>{image}</p>
                    </div>
                  ))
                )}
              </div>
              <div style={{ marginTop: "20px" }}>
                <button onClick={() => analyzeImages(images)}>
                  Get Trading Instructions
                </button>
              </div>
              <div
                className="responses-container"
                style={{ marginTop: "20px" }}
              >
                {responses.length === 0 ? (
                  <p>No trading instructions yet.</p>
                ) : (
                  responses.map((response, index) => (
                    <div
                      key={index}
                      className="response-item"
                      style={{
                        border: "1px solid #ccc",
                        padding: "10px",
                        marginBottom: "10px",
                      }}
                    >
                      <h3>Trading Instructions:</h3>
                      <pre>{response.message}</pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          }
        />
        <Route path="/history" element={<History />} />
      </Routes>
    </div>
  );
};

export default App;
