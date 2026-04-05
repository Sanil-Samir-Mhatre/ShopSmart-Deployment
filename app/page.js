"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/context/SearchContext';
import Link from 'next/link';

export default function Home() {
    const { user, setUser } = useSearch();
    const router = useRouter();
    
    const [authMode, setAuthMode] = useState('register');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [errorMsg, setErrorMsg] = useState('');
    const [history, setHistory] = useState([]);

    const stores = [
        { name: "Amazon", logo: "/logos/Amazon.png" },
        { name: "Flipkart", logo: "/logos/Flipkart.png" },
        { name: "Meesho", logo: "/logos/Meesho.png" },
        { name: "Myntra", logo: "/logos/Myntra.png" },
        { name: "JioMart", logo: "/logos/JioMart.png" },
        { name: "eBay", logo: "/logos/Ebay.png" },
        { name: "Reliance Digital", logo: "/logos/Reliance Digital.png" }
    ];

    const features = [
        { icon: "fa-camera-retro", title: "Image Recognition", desc: "Identify any product instantly by just uploading a simple photo." },
        { icon: "fa-bolt", title: "Live Prices", desc: "Get real-time pricing data across all major e-commerce platforms." },
        { icon: "fa-filter", title: "Scan & Filter", desc: "Powerful filters to narrow down the best deals by price and rating." },
        { icon: "fa-star", title: "Best Deal Highlight", desc: "Our smart algorithm highlights the 'Top Pick' for ultimate value." },
        { icon: "fa-clock-rotate-left", title: "Search History", desc: "Never lose track of your finds. We save your search journey." },
        { icon: "fa-shield-halved", title: "Secure Login", desc: "Your data and wishlist are protected with secure authentication." }
    ];

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        const token = localStorage.getItem('shopsmart_token');
        try {
            const res = await fetch('http://127.0.0.1:5000/api/profile', {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            if (data.history) setHistory(data.history.slice(0, 5));
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id.replace('auth', '').toLowerCase()]: e.target.value });
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
        const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
        const payload = authMode === 'login' 
            ? { email: formData.email, password: formData.password }
            : { username: formData.username, email: formData.email, password: formData.password };
            
        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (!res.ok) {
                setErrorMsg(data.error || 'Authentication failed');
                return;
            }
            
            if (authMode === 'login') {
                localStorage.setItem('shopsmart_token', data.token);
                localStorage.setItem('shopsmart_user', JSON.stringify(data.user));
                setUser(data.user);
            } else {
                setAuthMode('login');
                alert("Registration successful! Please login.");
            }
        } catch (err) {
            setErrorMsg("Network error. Please make sure the backend is running.");
        }
    };

    return (
        <>
            <main className="container">
                {/* Left Column */}
                <section className="hero-section">
                    <div className="headline-wrapper" style={{ marginTop: '0' }}>
                        <img src="/Images/roll_back_meme.png" alt="Roll Back Meme" className="floating-img meme-img" />
                        <h1 className="main-headline">
                            Don't search<br />everywhere.<br />Just ShopSmart!
                        </h1>
                    </div>

                    <p className="main-description">
                        Why wander the web endlessly? Skip the fragmented searches and open tabs. Discover every retailer,
                        compare real-time offers, and secure the perfect price—all in one beautifully unified space.
                        Just drop your product name or image into the search bar, let our engine scan the web in seconds, 
                        and click straight through to the lowest price available.
                    </p>

                </section>

                {/* Right Column */}
                <section className="login-section-container">
                    {user ? (
                        /* Logged In State: Recent Searches */
                        <div className="recent-searches-card">
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👋 Welcome back, {user.username}!</h2>
                            <div className="tagline-text">Identify & Find Deals</div>
                            <p style={{ color: 'white', textAlign: 'center', opacity: 0.9, marginBottom: '1.5rem', fontSize: '1.1rem' }}>Ready to resume your shopping journey?</p>
                            
                            {history.length > 0 ? (
                                <div className="resume-journey-box" 
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.1)', 
                                        border: '2px solid var(--accent-yellow)', 
                                        borderRadius: '20px', 
                                        padding: '1.5rem',
                                        width: '100%',
                                        cursor: 'pointer',
                                        transition: '0.3s',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onClick={() => {
                                        localStorage.setItem('shopsmart_pending_search', history[0].product_name);
                                        router.push('/search');
                                    }}
                                >
                                    <div className="choice-badge" style={{ top: '10px', right: '10px', fontSize: '0.7rem' }}>LATEST FIND ⭐</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                        <img src="/Images/cart.png" alt="Latest" style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'white', padding: '5px' }} />
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ color: 'var(--accent-yellow)', fontSize: '1.2rem' }}>{history[0].product_name}</h3>
                                            <p style={{ color: 'white', opacity: 0.7, fontSize: '0.85rem' }}>Click to see today's top picks!</p>
                                        </div>
                                    </div>
                                    <button className="login-btn" style={{ transform: 'none', fontSize: '1rem', width: '100%', marginTop: '1.2rem', padding: '0.6rem' }}>
                                        VIEW UPDATED DEALS
                                    </button>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--accent-yellow)', fontWeight: 'bold' }}>No recent searches yet. Start shopping!</p>
                            )}

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', width: '100%' }}>
                                <button className="tab-btn" style={{ flex: 1 }} onClick={() => router.push('/search')}>
                                    NEW SEARCH
                                </button>
                                <button className="tab-btn" style={{ flex: 1, borderColor: 'var(--accent-yellow)', color: 'var(--accent-yellow)' }} onClick={() => router.push('/history')}>
                                    FULL HISTORY
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Logged Out State: Login Card */
                        <div className="login-card">
                            <div className="login-banner">
                                {authMode === 'login' ? 'Welcome Back, Smart Shopper!' : 'Join the Smart Shoppers!'}
                            </div>

                            <form className="login-form" onSubmit={handleAuthSubmit}>
                                {authMode === 'register' && (
                                    <div className="input-group">
                                        <i className="fa-regular fa-user"></i>
                                        <input type="text" id="authUsername" placeholder="Username" value={formData.username} onChange={handleInputChange} required />
                                    </div>
                                )}
                                <div className="input-group">
                                    <i className="fa-solid fa-at"></i>
                                    <input type="email" id="authEmail" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required />
                                </div>
                                <div className="input-group">
                                    <i className="fa-solid fa-lock"></i>
                                    <input type="password" id="authPassword" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                                </div>
                                
                                <button type="button" className="login-btn" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                                    style={{ backgroundColor: 'transparent', border: '2px solid #000', color: '#000', fontSize: '0.85rem', textShadow: 'none', WebkitTextStroke: '0px', marginTop: '1rem', padding: '0.5rem', transform: 'none', boxShadow: 'none' }}>
                                    {authMode === 'login' ? 'Create new account' : 'Already have an account? Login'}
                                </button>
                                
                                {errorMsg && <div style={{ color: '#ff4d4d', fontSize: '0.9rem', textAlign: 'center', fontWeight: 'bold' }}>{errorMsg}</div>}

                                <div className="login-bottom">
                                    <img src="/Images/khaby_lame_login.png" alt="Khaby Lame" className="bottom-img" />
                                    <button type="submit" className="login-btn">
                                        {authMode === 'login' ? 'LOGIN' : 'AUTHORIZE'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </section>
            </main>

            {/* NEW: Supported Platforms Marquee (Full Width) */}
            <section className="marquee-section">
                <h2 className="sub-headline" style={{ marginTop: '0', marginBottom: '2rem' }}>
                    <strong>ShopSmart is supported by leading platforms:</strong>
                </h2>

                <div className="text-marquee-wrapper">
                    <div className="text-marquee">
                        {[...stores, ...stores].map((store, i) => (
                            <React.Fragment key={i}>
                                <div className="marquee-item">
                                    <img src={store.logo} alt={store.name} className="marquee-logo" />
                                    <span className="marquee-name">{store.name}</span>
                                </div>
                                <span className="marquee-dot">●</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* NEW: Features Section */}
            <section className="features-section">
                <h2 className="features-title">Why use ShopSmart?</h2>
                <div className="features-grid">
                    {features.map((feature, i) => (
                        <div className="feature-card" key={i}>
                            <i className={`fa-solid ${feature.icon} feature-icon`}></i>
                            <h3>{feature.title}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
