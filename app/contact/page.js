"use client";

import React, { useState } from 'react';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('Sending...');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus('Message sent successfully!');
                setName('');
                setEmail('');
                setMessage('');
            } else {
                setStatus('Failed to send: ' + data.error);
            }
        } catch (error) {
            setStatus('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="main-headline" style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>
                Contact Us
            </h1>

            <section className="login-card" style={{ width: '100%', maxWidth: '600px', padding: '3rem', minHeight: 'auto' }}>
                <div className="login-banner">Get in Touch</div>
                
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <i className="fa-regular fa-user"></i>
                        <input 
                            type="text" 
                            placeholder="Your Name" 
                            required 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <i className="fa-solid fa-at"></i>
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <i className="fa-regular fa-comment-dots"></i>
                        <textarea 
                            placeholder="How can we help you?" 
                            required 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '1rem 1rem 1rem 3rem', 
                                borderRadius: '20px', 
                                border: 'none', 
                                outline: 'none', 
                                minHeight: '150px',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.95rem'
                            }}
                        ></textarea>
                    </div>

                    <button type="submit" className="login-btn" disabled={loading} style={{ width: '100%', transform: 'none', boxShadow: 'none', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'SENDING...' : 'SEND MESSAGE'}
                    </button>
                    {status && <p style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{status}</p>}
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontWeight: '800', color: 'var(--sub-bg-darkblue)' }}>
                    Direct Email: devshopsmart123@yahoo.com
                </p>
            </section>
        </main>
    );
}
