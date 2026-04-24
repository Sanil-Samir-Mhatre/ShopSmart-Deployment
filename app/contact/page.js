"use client";

import React, { useState } from 'react';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const subject = "Regarding feedback or any complaint";
        const bodyText = `Name: ${name}\nEmail: ${email}\n\nFeedback/Message:\n${message}`;
        window.location.href = `mailto:devshopsmart123@yahoo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
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

                    <button type="submit" className="login-btn" style={{ width: '100%', transform: 'none', boxShadow: 'none', marginTop: '1rem' }}>
                        SEND MESSAGE
                    </button>
                </form>

                <p style={{ marginTop: '2rem', textAlign: 'center', fontWeight: '800', color: 'var(--sub-bg-darkblue)' }}>
                    Direct Email: devshopsmart123@yahoo.com
                </p>
            </section>
        </main>
    );
}
