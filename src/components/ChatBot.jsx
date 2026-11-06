import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatBot.module.css';
import { imagesByTopic } from '../data/slides.js';

// Remount each user's chat so history and in-flight requests stay with that user.
export default function ChatBot({ tissueContext, tissueId, attachedImageId }) {
    const { user } = useAuth();
    return <ChatSession key={user?.uid || 'guest'} tissueContext={tissueContext} tissueId={tissueId} attachedImageId={attachedImageId} />;
}

function ChatSession({ tissueContext, tissueId, attachedImageId }) {
    const { user, signInWithGoogle, getIdToken, authError, signingIn } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [remaining, setRemaining] = useState(100);
    const [error, setError] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [includeSlide, setIncludeSlide] = useState(false);
    const abortRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const scrollIntervalRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Gentle reading-speed auto-scroll during streaming
    useEffect(() => {
        if (isStreaming && messagesContainerRef.current) {
            // Clear any existing interval
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }

            // Scroll at comfortable reading speed: ~4px every 50ms = 80px/sec
            scrollIntervalRef.current = setInterval(() => {
                const container = messagesContainerRef.current;
                if (container) {
                    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                    // Only auto-scroll if user is near bottom (not scrolled up)
                    if (distanceFromBottom < 150 && distanceFromBottom > 0) {
                        container.scrollTop += 4;
                    }
                }
            }, 50);
        } else {
            // Stop scrolling when streaming ends
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, [isStreaming]);

    useEffect(() => () => abortRef.current?.abort(), []);

    // Fetch current usage count on mount
    useEffect(() => {
        const controller = new AbortController();
        const fetchUsage = async () => {
            if (!user) return;
            try {
                const token = await getIdToken();
                const response = await fetch('/api/usage', {
                    headers: { 'Authorization': `Bearer ${token}` }, signal: controller.signal,
                });
                if (response.ok) {
                    const data = await response.json();
                    setRemaining(data.remaining);
                }
            } catch (err) {
                console.error('Failed to fetch usage:', err);
            }
        };
        fetchUsage();
        return () => controller.abort();
    }, [user, getIdToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading || signingIn) return;
        if (!user) {
            setIsExpanded(true);
            signInWithGoogle();
            return;
        }
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input.trim(), imageTitle: includeSlide && attachedImageId ? imagesByTopic.get(tissueId)?.find(image => image.id === attachedImageId)?.title : null };
        const startIndex = messages.length;
        let characters = userMessage.content.length;
        const history = [];
        for (const message of [...messages].reverse()) {
            if (message.failed || !message.content.trim()) continue;
            if (history.length >= 9 || characters + message.content.length > 24000) break;
            history.unshift(message);
            characters += message.content.length;
        }
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        // Scroll to bottom immediately when user sends message
        setTimeout(() => scrollToBottom(), 50);

        try {
            const controller = new AbortController();
            abortRef.current = controller;
            const token = await getIdToken();
            const response = await fetch('/api/chat', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [...history, userMessage].map(({ role, content }) => ({ role, content })),
                    topicId: tissueId, imageId: attachedImageId, includeImage: includeSlide && Boolean(attachedImageId),
                })
            });

            if (response.status === 429) {
                setRemaining(0);
                throw new Error("You've reached your monthly limit of 100 messages. Come back next month!");
            }

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || 'Chat is temporarily unavailable. Please try again.');
            }

            // Update remaining count from header
            const remainingHeader = response.headers.get('X-Messages-Remaining');
            if (remainingHeader) setRemaining(parseInt(remainingHeader));

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessage = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
            setIsStreaming(true); // Start reading-speed scroll

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    assistantMessage += decoder.decode();
                    if (!assistantMessage.trim()) throw new Error('No response received. Please try again.');
                    setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: assistantMessage }]);
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                assistantMessage += chunk;

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: assistantMessage
                    };
                    return newMessages;
                });
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('Chat error:', err);
            setError(err.message || 'The response was interrupted. Please try again.');
            setMessages(prev => prev.map((message, index) => index >= startIndex ? { ...message, failed: true } : message));
        } finally {
            setIsLoading(false);
            setIsStreaming(false); // Stop reading-speed scroll
        }
    };

    const handleInputFocus = () => {
        setIsExpanded(true);
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setIsExpanded(false);
    };

    return (
        <div className={`${styles.chatContainer} ${isExpanded ? styles.expanded : ''}`}>
            {isExpanded && (
                <div className={styles.messagesArea}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <span className={styles.title}>🔬 Meded AI</span>
                            {user && (
                                <img
                                    src={user.photoURL}
                                    alt={user.displayName}
                                    className={styles.userAvatar}
                                    title={user.displayName}
                                />
                            )}
                        </div>
                        <div className={styles.headerRight}>
                            <span className={styles.remaining}>{remaining}/100</span>
                            <button onClick={handleClose} className={styles.closeBtn} aria-label="Close chat">×</button>
                        </div>
                    </div>
                    <div
                        className={styles.messages}
                        ref={messagesContainerRef}
                        role="log"
                        aria-live="polite"
                        aria-atomic="false"
                        tabIndex={0}
                    >
                        {messages.length === 0 && (
                            <div className={styles.welcomeMessage}>
                                <div className={styles.welcomeIcon}>🧬</div>
                                <p>Ask me anything about <strong>{tissueContext?.split('\n')[0]?.replace('Tissue: ', '') || 'this condition'}</strong>!</p>
                                <p className={styles.welcomeHint}>I can explain features, functions, clinical correlations, and exam tips.</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                                {msg.role === 'assistant' ? <Markdown skipHtml>{msg.content}</Markdown> : <>{msg.content}{msg.imageTitle && <small className="pd-attachment-caption">Image: {msg.imageTitle}</small>}</>}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={styles.typing}>
                                <span></span><span></span><span></span>
                            </div>
                        )}
                        {(error || authError) && <p role="alert" className={styles.error}>{error || authError}</p>}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {isExpanded && <label className={styles.slideOption}>
                <input type="checkbox" checked={includeSlide && Boolean(attachedImageId)} onChange={event => setIncludeSlide(event.target.checked)} disabled={isLoading || !attachedImageId} />
                Include current slide image
            </label>}
            <form onSubmit={handleSubmit} className={styles.inputArea}>
                <label htmlFor="chat-message-input" className={styles.srOnly}>
                    {user ? "Ask a question about this condition" : "Sign in to ask questions"}
                </label>
                <input
                    ref={inputRef}
                    id="chat-message-input"
                    name="chat-message"
                    type="text"
                    maxLength={4000}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder={user ? "Ask about this condition..." : "Sign in to ask questions..."}
                    className={styles.input}
                    disabled={remaining === 0}
                />
                <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={isLoading || signingIn || remaining === 0}
                    aria-label={
                        !user
                            ? "Sign in to chat"
                            : isLoading
                                ? "Sending message..."
                                : "Send message"
                    }
                >
                    {!user ? (
                        <span className={styles.lockIcon} aria-hidden="true">🔐</span>
                    ) : isLoading ? (
                        <span className={styles.loadingDots} aria-hidden="true">...</span>
                    ) : (
                        <span className={styles.sendIcon} aria-hidden="true">→</span>
                    )}
                </button>
            </form>
        </div>
    );
}
