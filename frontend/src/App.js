import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Create a local preview URL
      setResult(null);
      setError(null);
    }
  };

  // Handle file upload to Node.js backend
  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image first!");
      return;
    }

    const formData = new FormData();
    formData.append('image', image); // Matches upload.single('image') in server.js

    setLoading(true);
    setError(null);

    try {
      // Send POST request to the Express server
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("Error analyzing the image. Make sure the backend server (port 5000) is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Visual Product Matcher (CLIP)</h2>
      
      <div style={{ margin: '20px 0' }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>

      {preview && (
        <div style={{ marginBottom: '20px' }}>
          <img src={preview} alt="Uploaded Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }} />
        </div>
      )}

      <button onClick={handleUpload} disabled={loading} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
        {loading ? 'Analyzing with AI...' : 'Upload & Identify Product'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}

      {result && result.success && (
        <div style={{ marginTop: '30px', textAlign: 'left', background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ margin: '0 0 15px 0' }}>Top Match: <span style={{ color: '#28a745' }}>{result.top_match.toUpperCase()}</span></h3>
          <h4 style={{ margin: '0 0 10px 0' }}>Similarity Scores:</h4>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {result.all_predictions.map((pred, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                <strong>{pred.product}</strong> - {(pred.similarity_score * 100).toFixed(1)}% match
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
