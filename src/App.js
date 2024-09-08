import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [images, setImages] = useState([]);
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await axios.get('http://localhost:8000/images');
        setImages(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch images');
      }
    };
    fetchImages();
  }, []);

  const analyzeImage = async (imageName) => {
    try {
      const { data } = await axios.post('http://localhost:8000/analyze', {
        prompt,
        imageName,
      });
      setResponses((prevResponses) => [...prevResponses, { imageName, message: data }]);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze image');
    }
  };

  const uploadImage = async (event) => {
    const formData = new FormData();
    formData.append('file', event.target.files[0]);
    try {
      const { data } = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages((prevImages) => [...prevImages, data.path.split('/').pop()]);
    } catch (err) {
      console.error(err);
      setError('Failed to upload image');
    }
  };

  return (
    <div className="app">
      <h1>Trading Chart Analyzer</h1>
      {error && <p>{error}</p>}
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt here"
      />
      <input type="file" onChange={uploadImage} />
      <div className="images-container">
        {images.map((image, index) => (
          <div key={index} className="image-item">
            <img src={`images/${image}`} alt={`Chart ${index}`} />
            <button onClick={() => analyzeImage(image)}>Analyze</button>
          </div>
        ))}
      </div>
      <div className="responses-container">
        {responses.map((response, index) => (
          <div key={index} className="response-item">
            <h3>Analysis for {response.imageName}</h3>
            <p>{response.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
