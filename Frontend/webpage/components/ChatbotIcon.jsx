import React from 'react';
import './ChatbotIcon.css';
import chatbotImg from './chatbot.png';  // Import the image

const ChatbotIcon = ({ onClick, isOpen }) => {
  return (
    <div className={`chatbot-icon ${isOpen ? 'open' : ''}`} onClick={onClick}>
      {isOpen ? (
        <span className="close-icon">✕</span>
      ) : (
        <img src={chatbotImg} alt="Chat Icon" className="chat-img" />
      )}
    </div>
  );
};

export default ChatbotIcon;