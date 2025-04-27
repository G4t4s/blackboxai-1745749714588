import React, { useState } from 'react';

export default function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [ocrTexts, setOcrTexts] = useState({});
  const [code, setCode] = useState('');
  const [compileOutput, setCompileOutput] = useState('');
  const [compileErrors, setCompileErrors] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setSelectedImages((prev) => [...prev, ...newImages]);
      setUploadMessage('');
    }
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
        setOcrTexts(data.ocr_texts || {});
      } else {
        setUploadMessage(data.error || 'Upload failed');
      }
    } catch (error) {
      setUploadMessage('Upload failed: ' + error.message);
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleCompile = async () => {
    setCompileOutput('');
    setCompileErrors('');
    try {
      const response = await fetch('http://localhost:5000/compile-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (response.ok) {
        setCompileOutput(data.output || '');
        setCompileErrors(data.errors || '');
      } else {
        setCompileErrors(data.error || 'Compilation failed');
      }
    } catch (error) {
      setCompileErrors('Compilation failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row p-4 gap-4 bg-gray-100 font-sans">
      {/* Left side: Image upload */}
      <div className="md:w-1/2 bg-white rounded-lg shadow p-6 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Upload Image</h2>
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
              <div key={index} className="relative mb-4">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Selected ${index + 1}`}
                  className="max-h-24 object-contain rounded"
                />
                <button
                  onClick={() => {
                    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
                    setOcrTexts((prev) => {
                      const newOcr = {...prev};
                      delete newOcr[image.name];
                      return newOcr;
                    });
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  &times;
                </button>
                {ocrTexts[image.name] && (
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-sm whitespace-pre-wrap max-h-40 overflow-auto">
                    {ocrTexts[image.name]}
                  </pre>
                )}
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
        <h2 className="text-2xl font-semibold mb-4">Python Code Compiler</h2>
        <textarea
          value={code}
          onChange={handleCodeChange}
          placeholder="Write your Python code here..."
          className="flex-grow border rounded p-2 mb-4 font-mono text-sm resize-none"
          rows={15}
        />
        <button
          onClick={handleCompile}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
        >
          Compile & Run
        </button>
        <div className="mt-4">
          <h3 className="font-semibold">Output:</h3>
          <pre className="bg-gray-100 p-2 rounded min-h-[100px] whitespace-pre-wrap">
            {compileOutput}
          </pre>
          {compileErrors && (
            <>
              <h3 className="font-semibold mt-4 text-red-600">Errors:</h3>
              <pre className="bg-gray-100 p-2 rounded min-h-[100px] whitespace-pre-wrap text-red-600">
                {compileErrors}
              </pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
