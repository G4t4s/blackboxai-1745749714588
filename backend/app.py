from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import base64
import subprocess
import sys
import traceback
import os
from PIL import Image
import pytesseract
from io import BytesIO

app = Flask(__name__)
CORS(app)

# MongoDB connection string from environment variable
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    raise Exception("MONGO_URI environment variable not set. Please set it to your MongoDB Atlas connection string.")
client = MongoClient(MONGO_URI)
db = client['image_upload_db']
images_collection = db['images']

@app.route('/upload-image', methods=['POST'])
def upload_image():
    try:
        files = request.files.getlist('images')
        if not files or len(files) == 0:
            return jsonify({'error': 'No image files provided'}), 400
        inserted_files = []
        ocr_results = {}
        for file in files:
            file.seek(0)
            image_bytes = file.read()
            encoded_string = base64.b64encode(image_bytes).decode('utf-8')
            images_collection.insert_one({'filename': file.filename, 'data': encoded_string})
            inserted_files.append(file.filename)

            # OCR processing
            image = Image.open(BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            ocr_results[file.filename] = text

        return jsonify({'message': f'{len(inserted_files)} images uploaded successfully', 'files': inserted_files, 'ocr_texts': ocr_results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/compile-code', methods=['POST'])
def compile_code():
    try:
        data = request.get_json()
        code = data.get('code')
        if not code:
            return jsonify({'error': 'No code provided'}), 400

        # Save code to a temporary file
        with open('temp_code.py', 'w') as f:
            f.write(code)

        # Execute the code using subprocess and capture output and errors
        result = subprocess.run([sys.executable, 'temp_code.py'], capture_output=True, text=True, timeout=5)

        output = result.stdout
        errors = result.stderr

        # Remove the temporary file
        os.remove('temp_code.py')

        return jsonify({'output': output, 'errors': errors})
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Code execution timed out'}), 408
    except Exception as e:
        tb = traceback.format_exc()
        return jsonify({'error': str(e), 'traceback': tb}), 500

if __name__ == '__main__':
    app.run(debug=True)
