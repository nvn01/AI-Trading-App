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

  const analyzeImages = async (selectedImages) => {
    try {
      const { data } = await axios.post('http://localhost:8000/analyze', {
        imageNames: selectedImages,  // Send selected image names
      });
      setResponses((prevResponses) => [...prevResponses, { images: selectedImages, message: data }]);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze images');
    }
  };

  const uploadImages = async (event) => {
    const formData = new FormData();
    Array.from(event.target.files).forEach(file => formData.append('files', file));

    try {
      const { data } = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImages((prevImages) => [...prevImages, ...data.files]);
    } catch (err) {
      console.error(err);
      setError('Failed to upload images');
    }
  };

  return (
    <div className="app">
      <h1>Bitcoin Chart Analyzer - Trading Instructions</h1>
      {error && <p>{error}</p>}
      <input type="file" multiple onChange={uploadImages} />
      <div className="images-container">
        {images.map((image, index) => (
          <div key={index} className="image-item">
            <img src={`images/${image}`} alt={`Chart ${index}`} />
          </div>
        ))}
      </div>
      <button onClick={() => analyzeImages(images)}>Get Trading Instructions</button>
      <div className="responses-container">
        {responses.map((response, index) => (
          <div key={index} className="response-item">
            <h3>Trading Instructions:</h3>
            <p>{response.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
