import React, { useState } from 'react';
import InteractiveCodeRunner from './InteractiveCodeRunner';

export default function AppCombined() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImages(Array.from(e.target.files));
      setUploadMessage('');
    }
  };

  const handleImageRemove = (indexToRemove) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleImageUpload = async () => {
    if (selectedImages.length === 0) {
      setUploadMessage('Please select at least one image.');
      return;
    }
    const formData = new FormData();
    selectedImages.forEach((image) => {
      formData.append('images', image);
    });

    try {
      const response = await fetch('http://localhost:5000/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadMessage(data.message);
      } else {
        setUploadMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setUploadMessage('Upload failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row p-4 gap-4 bg-gray-100 font-sans">
      {/* Left side: Image upload */}
      <div className="md:w-1/2 bg-white rounded-lg shadow p-6 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Upload Images</h2>
        <input
          multiple
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mb-4"
        />
        {selectedImages.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 max-h-64 overflow-auto border rounded p-2">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Selected ${index + 1}`}
                  className="max-h-24 object-contain rounded"
                />
                <button
                  onClick={() => handleImageRemove(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={handleImageUpload}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Upload
        </button>
        {uploadMessage && (
          <p className="mt-4 text-sm text-gray-700">{uploadMessage}</p>
        )}
      </div>

      {/* Right side: Python code compiler */}
      <div className="md:w-1/2 bg-white rounded-lg shadow p-6 flex flex-col">
        <InteractiveCodeRunner />
      </div>
    </div>
  );
}
