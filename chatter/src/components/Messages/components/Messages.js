import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);

function Messages() {
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);
  const messageListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [botTyping, setBotTyping] = useState(false);


  const onChangeMessage = (e) => {
    setMessage(e.target.value);
  }

  const sendMessage = useCallback(() => {
    if (message.trim() === '') return;

    const userMessage = { id: Date.now(), message, user: 'me' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setLatestMessage(message);
    socket.emit('user-message', { message });
    playSend();

    // Clear input field
    setMessage('');
  }, [message, setMessages, setMessage, setLatestMessage, playSend]);

  useEffect(() => {
    socket.on('bot-typing', () => {
      setBotTyping(true);
    });

    socket.on('bot-message', (message) => {
      setBotTyping(false);
      const botMessage = { id: Date.now(), message, user: 'bot' };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      setLatestMessage(botMessage.message);
      playReceive();
    });

    return () => {
      socket.off('bot-typing');
      socket.off('bot-message');
    };
  }, [setMessages, setLatestMessage, setBotTyping, playReceive]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className='messages'>
      <Header />
      <div className='messages__list' id='message-list' ref={messageListRef}>
        { messages.map((msg, index) => (
            <Message
              key={msg.id}
              message={msg}
              nextMessage={messages[index + 1]}
              botTyping={botTyping}
            />
          ))}
        {botTyping && <TypingMessage />}
      </div>
      <Footer message={message} sendMessage={sendMessage} onChangeMessage={onChangeMessage} />
    </div>
  );
}

export default Messages;
