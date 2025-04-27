import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function InteractiveCodeRunner() {
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputValue, setInputValue] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Connected to interactive backend');
    });

    socketRef.current.on('output', (data) => {
      setOutput((prev) => prev + data.text);
    });

    socketRef.current.on('input_request', (data) => {
      setInputPrompt(data.prompt || 'Input:');
    });

    socketRef.current.on('execution_complete', () => {
      setIsRunning(false);
      setInputPrompt('');
      setInputValue('');
    });

    socketRef.current.on('error', (data) => {
      setErrors(data.error || 'Error occurred');
      setIsRunning(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleRun = () => {
    setOutput('');
    setErrors('');
    setIsRunning(true);
    socketRef.current.emit('run_code', { code });
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    socketRef.current.emit('input_response', { input: inputValue });
    setInputValue('');
    setInputPrompt('');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col md:w-1/2">
      <h2 className="text-2xl font-semibold mb-4">Interactive Python Code Runner</h2>
      <textarea
        value={code}
        onChange={handleCodeChange}
        placeholder="Write your Python code here..."
        className="flex-grow border rounded p-2 mb-4 font-mono text-sm resize-none"
        rows={15}
        disabled={isRunning}
      />
      <button
        onClick={handleRun}
        className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
        disabled={isRunning}
      >
        {isRunning ? 'Running...' : 'Run Code'}
      </button>
      {inputPrompt && (
        <form onSubmit={handleInputSubmit} className="mt-4 flex gap-2">
          <label className="font-semibold">{inputPrompt}</label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="border rounded p-1 flex-grow"
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition"
          >
            Send
          </button>
        </form>
      )}
      <div className="mt-4">
        <h3 className="font-semibold">Output:</h3>
        <pre className="bg-gray-100 p-2 rounded min-h-[100px] whitespace-pre-wrap">
          {output}
        </pre>
        {errors && (
          <>
            <h3 className="font-semibold mt-4 text-red-600">Errors:</h3>
            <pre className="bg-gray-100 p-2 rounded min-h-[100px] whitespace-pre-wrap text-red-600">
              {errors}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
