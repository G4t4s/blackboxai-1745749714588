from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import base64
import sys
import traceback
import os
from PIL import Image
import pytesseract
from io import BytesIO
from flask_socketio import SocketIO, emit
import threading
import queue

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

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

# Interactive code execution with SocketIO

input_queues = {}

@socketio.on('run_code')
def handle_run_code(data):
    code = data.get('code')
    sid = request.sid
    if not code:
        socketio.emit('error', {'error': 'No code provided'}, room=sid)
        return

    input_queue = queue.Queue()
    input_queues[sid] = input_queue

    def input_func(prompt=''):
        socketio.emit('input_request', {'prompt': prompt}, room=sid)
        user_input = input_queue.get()
        return user_input

    def output_func(text):
        socketio.emit('output', {'text': text}, room=sid)

    def run_user_code():
        import builtins
        original_input = builtins.input
        original_print = builtins.print

        def patched_input(prompt=''):
            return input_func(prompt)

        def patched_print(*args, **kwargs):
            text = ' '.join(str(arg) for arg in args) + '\\n'
            output_func(text)

        builtins.input = patched_input
        builtins.print = patched_print

        try:
            exec(code, {})
        except Exception:
            tb = traceback.format_exc()
            output_func(f'Error:\\n{tb}')
        finally:
            builtins.input = original_input
            builtins.print = original_print
            socketio.emit('execution_complete', {}, room=sid)
            input_queues.pop(sid, None)

    socketio.start_background_task(run_user_code)

@socketio.on('input_response')
def handle_input_response(data):
    sid = request.sid
    user_input = data.get('input')
    if user_input is not None and sid in input_queues:
        input_queues[sid].put(user_input)

if __name__ == '__main__':
    socketio.run(app, debug=True)
