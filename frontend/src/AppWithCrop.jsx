import React, { useState } from 'react';
import ImageCropper from './ImageCropper';

export default function AppWithCrop() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setCroppedImage(null);
    }
  };

  const handleCropComplete = (croppedImgUrl) => {
    setCroppedImage(croppedImgUrl);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Image Cropper Demo</h1>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-6"
      />
      {selectedImage && (
        <ImageCropper imageSrc={selectedImage} onCropComplete={handleCropComplete} />
      )}
      {croppedImage && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Cropped Image Preview:</h2>
          <img src={croppedImage} alt="Cropped" className="rounded shadow max-w-full" />
        </div>
      )}
    </div>
  );
}
