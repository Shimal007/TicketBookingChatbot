import React, { useState, useEffect, useRef } from 'react';
import assistantImage from './assistant.png'; // Import images
import manImage from './man.png';
import microphoneImage from './microphone.png';
import './Chatbot.css';

// A simple sanitization function to prevent XSS (basic example)
const sanitizeHTML = (html) => {
  const allowedTags = /<a\s+href="[^"]*"\s*target="_blank"[^>]*>.*?<\/a>/gi;
  const allowedAttributes = /href="[^"]*"|target="_blank"/gi;

  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitized;

  const elements = tempDiv.getElementsByTagName('*');
  let result = sanitized;

  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (element.tagName.toLowerCase() !== 'a') {
      result = result.replace(element.outerHTML, element.textContent);
    } else {
      const attributes = element.outerHTML.match(/<a[^>]*>/)[0];
      if (!attributes.match(allowedAttributes)) {
        result = result.replace(element.outerHTML, element.textContent);
      }
    }
  }

  return result;
};

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([{ type: 'bot', text: "I'm Museo. How can I help you?" }]); // Default message when opening
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { type: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');

    try {
      const response = await fetch('http://127.0.0.1:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userInput }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...newMessages, { type: 'bot', text: data.answer }]);
      } else {
        setMessages([...newMessages, { type: 'bot', text: 'Error: Server responded with an error.' }]);
      }
    } catch (error) {
      setMessages([...newMessages, { type: 'bot', text: 'Error: Unable to connect to the server.' }]);
    }
  };

  const startVoiceInput = () => {
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      alert('Sorry, your browser does not support speech recognition.');
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
    };

    recognition.onerror = (event) => {
      alert('Voice recognition error: ' + event.error);
    };

    recognition.onspeechend = () => {
      recognition.stop();
    };

    recognition.start();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  if (!isOpen) return null;

  return (
    <div className="chat-container">
      <div className="chat-header">
        Museo Bot <img src={assistantImage} alt="Assistant" style={{ height: '30px', width: '30px', marginLeft: '10px' }} />
        <button onClick={onClose} style={{ float: 'right', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
          ✕
        </button>
      </div>
      <div id="chat-history" className="chat-history" ref={chatHistoryRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="bubble">
              <img
                src={message.type === 'user' ? manImage : assistantImage}
                alt={message.type === 'user' ? 'User' : 'Assistant'}
                style={{ height: '30px', width: '30px', marginLeft: '10px', marginRight: '10px' }}
              />
              {message.type === 'bot' ? (
                <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(message.text) }} />
              ) : (
                message.text
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <img
          src={microphoneImage}
          alt="Microphone"
          style={{ height: '30px', width: '30px', marginLeft: '5px', cursor: 'pointer' }}
          onClick={startVoiceInput}
          aria-label="Start voice input"
        />
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
        />
        <button className="send-btn" onClick={sendMessage} aria-label="Send message">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
