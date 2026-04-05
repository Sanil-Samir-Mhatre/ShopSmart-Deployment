"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearch } from '@/context/SearchContext';
import './search.css';

export default function SearchPage() {
    const { 
        geminiDeals, setGeminiDeals,
        shoppingDeals, setShoppingDeals,
        lastImage, setLastImage, 
        productInfo, setProductInfo,
        engine, setEngine,
        toggleWishlist, wishlist,
        saveToHistory
    } = useSearch();

    const [activeTab, setActiveTab] = useState('text'); // 'text', 'upload', 'camera'
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [textInput, setTextInput] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);
    const [error, setError] = useState(null);

    const SkeletonCard = () => (
        <div className="skeleton-card">
            <div className="skeleton-img"></div>
            <div className="skeleton-info">
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-line short"></div>
            </div>
        </div>
    );

    // If search results exist, we should probably hide the upload card unless they want to search again
    const [showUpload, setShowUpload] = useState(!geminiDeals?.length && !shoppingDeals?.length);

    useEffect(() => {
        const pendingSearch = localStorage.getItem('shopsmart_pending_search');
        if (pendingSearch) {
            setTextInput(pendingSearch);
            localStorage.removeItem('shopsmart_pending_search');
            handleSearch(pendingSearch);
        } else if (geminiDeals.length || shoppingDeals.length) {
            setShowUpload(false);
        }
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
                setLastImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error", err);
            alert("Could not access camera.");
        }
    };

    const capturePhoto = () => {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const data = canvasRef.current.toDataURL('image/jpeg');
        setImagePreview(data);
        setLastImage(data);
        stopCamera();
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
    };

    const handleSearch = async () => {
        let payload = {};
        const messages = activeTab === 'text' 
            ? ["The results are loading...", "Aggregating market data...", "Finding the best and lowest prices..."]
            : ["The results are loading...", "Identifying the product in your image...", "Searching across various e-commerce sites to give you the best prices..."];

        if (activeTab === 'text') {
            if (!textInput) return alert("Please type something!");
            payload = { text: textInput };
            setLastImage(null);
        } else {
            if (!lastImage) return alert("Please provide an image!");
            payload = { image: lastImage };
        }

        setLoading(true);
        setError(null);
        setLoadingMessage(messages[0]);
        setVisibleCount(6); // Reset pagination
        
        // Cycle through messages
        let msgIdx = 0;
        const msgTimer = setInterval(() => {
            msgIdx = (msgIdx + 1) % messages.length;
            setLoadingMessage(messages[msgIdx]);
        }, 3000);

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

        try {
            // Step 1: Identify
            const idRes = await fetch(`${API_URL}/api/identify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!idRes.ok) throw new Error("Could not identify product. Please check your internet or try a different search.");
            
            const pInfo = await idRes.json();
            setProductInfo(pInfo);

            // Step 2: Fetch Deals for BOTH engines in parallel
            const [geminiRes, shoppingRes] = await Promise.all([
                fetch(`${API_URL}/api/deals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_name: pInfo.product_name, brand: pInfo.brand, type: 'gemini' })
                }),
                fetch(`${API_URL}/api/deals`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_name: pInfo.product_name, brand: pInfo.brand, type: 'shopping' })
                })
            ]);

            const gData = await geminiRes.json();
            const sData = await shoppingRes.json();

            const finalGDeals = gData.deals || [];
            const finalSDeals = sData.deals || [];

            if (finalGDeals.length === 0 && finalSDeals.length === 0) {
                setError("No deals found for this product. Try adjusting your search term.");
            }

            setGeminiDeals(finalGDeals);
            setShoppingDeals(finalSDeals);
            setShowUpload(false);
            saveToHistory(pInfo.product_name);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to fetch deals. Ensure backend is running.");
        } finally {
            clearInterval(msgTimer);
            setLoading(false);
        }
    };

    // Choice Filter Algorithm: (Rating * 10) - (Price / 500)
    const getSmartChoice = (deals) => {
        if (!deals.length) return null;
        return [...deals].sort((a, b) => {
            const scoreA = (a.rating || 0) * 10 - (a.price / 500);
            const scoreB = (b.rating || 0) * 10 - (b.price / 500);
            return scoreB - scoreA;
        })[0];
    };

    const smartChoice = getSmartChoice(engine === 'gemini' ? geminiDeals : shoppingDeals);

    const getSortedDeals = () => {
        let deals = engine === 'gemini' ? [...geminiDeals] : [...shoppingDeals];
        if (filter === 'lowest') deals.sort((a, b) => a.price - b.price);
        if (filter === 'highest') deals.sort((a, b) => b.price - a.price);
        if (filter === 'choice') {
            deals.sort((a, b) => {
                const scoreA = (a.rating || 0) * 10 - (a.price / 500);
                const scoreB = (b.rating || 0) * 10 - (b.price / 500);
                return scoreB - scoreA;
            });
        }
        return deals;
    };

    const sortedDeals = getSortedDeals();
    const visibleDeals = sortedDeals.slice(0, visibleCount);

    return (
        <main className="search-main-container">
            {loading && (
                <div id="loadingOverlay">
                    <div className="loading-content">
                        {lastImage && <img src={lastImage} alt="Identifying" className="loading-preview" />}
                        <img src="/Images/load.gif" alt="Loading" className="loading-gif" />
                        <h2 className="loading-text">{loadingMessage}</h2>
                        <p className="loading-subtext">We're scanning top retailers like Amazon, Flipkart, & eBay to save you money.</p>
                    </div>
                </div>
            )}

            <div className="engine-toggle-container">
                <button 
                    className={`engine-btn ${engine === 'gemini' ? 'active' : ''}`}
                    onClick={() => setEngine('gemini')}
                >
                    ✨ AI Scraping (Option 1)
                </button>
                <button 
                    className={`engine-btn ${engine === 'shopping' ? 'active' : ''}`}
                    onClick={() => setEngine('shopping')}
                >
                    🛍️ API Scraping (Option 2)
                </button>
            </div>

            {showUpload ? (
                <section className="upload-card">
                    <h2>Identify & Find Deals</h2>
                    <div className="tabs">
                        <button className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
                            <i className="fa-solid fa-keyboard"></i> Type Name
                        </button>
                        <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
                            <i className="fa-regular fa-image"></i> Upload Photo
                        </button>
                        <button className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => { setActiveTab('camera'); startCamera(); }}>
                            <i className="fa-solid fa-camera"></i> Use WebCam
                        </button>
                    </div>

                    {activeTab === 'text' && (
                        <div className="tab-content">
                            <input 
                                type="text" 
                                id="productTextInput" 
                                placeholder="e.g. Sony WH-1000XM5 Headphones" 
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'upload' && (
                        <div className="tab-content">
                            {/* CREATIVE DO'S AND DON'TS BANNER */}
                            <div className="guidelines-banner">
                                <div className="guide-item do-item">
                                    <h4>📸 DO'S</h4>
                                    <ul className="guide-list">
                                        <li>✨ Single product only</li>
                                        <li>💡 Clear, bright lighting</li>
                                        <li>🎯 Focus on product center</li>
                                    </ul>
                                </div>
                                <div className="guide-item dont-item">
                                    <h4>🚫 DON'TS</h4>
                                    <ul className="guide-list">
                                        <li>🔲 No collage photos</li>
                                        <li>🌫️ No blurry images</li>
                                        <li>👥 No people in frame</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="file-upload-wrapper">
                                <input type="file" accept="image/*" onChange={handleFileUpload} />
                                {imagePreview ? <img src={imagePreview} alt="Preview" /> : <p>Drop or Click to Upload</p>}
                            </div>
                        </div>
                    )}

                    {activeTab === 'camera' && (
                        <div className="tab-content">
                            {isCameraActive ? (
                                <div className="camera-wrapper">
                                    <video ref={videoRef} autoPlay playsInline />
                                    <button className="action-btn" onClick={capturePhoto}>Capture</button>
                                </div>
                            ) : (
                                <div className="camera-wrapper">
                                    {imagePreview && <img src={imagePreview} alt="Captured" />}
                                    <button className="action-btn" onClick={startCamera}>Retake</button>
                                </div>
                            )}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                    )}

                    <button className="shopsmart-btn" onClick={handleSearch}>ShopSmart</button>
                </section>
            ) : (
                <section className="results-container">
                    <div className="product-info-panel">
                        <h2>{productInfo?.product_name || "Product Analysis"}</h2>
                        
                        {lastImage && (
                            <img 
                                src={lastImage} 
                                alt="Subject" 
                                style={{ 
                                    width: '100%', 
                                    maxHeight: '300px', 
                                    objectFit: 'cover', 
                                    borderRadius: '12px', 
                                    marginBottom: '1.5rem', 
                                    border: '2px dashed var(--accent-turquoise)' 
                                }} 
                            />
                        )}

                        <div className="info-block">
                            <p><strong>Brand:</strong> {productInfo?.brand}</p>
                            <p><strong>Model:</strong> {productInfo?.model_number}</p>
                            <p><strong>Category:</strong> {productInfo?.category}</p>
                        </div>
                        <h3>Key Features</h3>
                        <ul>
                            {productInfo?.key_features?.map((f, i) => (
                                <li key={i}>{f}</li>
                            ))}
                        </ul>
                        
                        <button 
                            className="action-btn" 
                            style={{ marginTop: '2rem', width: '100%' }}
                            onClick={() => setShowUpload(true)}
                        >
                            New Search
                        </button>
                    </div>

                    <div className="deals-panel">
                        <div className="deals-filter">
                            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All Deals</button>
                            <button className={`filter-btn ${filter === 'choice' ? 'active' : ''}`} onClick={() => setFilter('choice')}>✨ Choice Pick</button>
                            <button className={`filter-btn ${filter === 'lowest' ? 'active' : ''}`} onClick={() => setFilter('lowest')}>Lowest Price</button>
                            <button className={`filter-btn ${filter === 'highest' ? 'active' : ''}`} onClick={() => setFilter('highest')}>Highest Price</button>
                        </div>

                        <div className="deals-list">
                            {loading ? (
                                <div className="skeleton-list">
                                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                                </div>
                            ) : error ? (
                                <div className="error-container">
                                    <div className="error-box">
                                        <i className="fa-solid fa-triangle-exclamation error-icon"></i>
                                        <h3 className="error-title">Oops! No Deals Found</h3>
                                        <p className="error-msg">{error}</p>
                                        <button className="shopsmart-btn" onClick={() => setShowUpload(true)} style={{ marginTop: '1rem' }}>
                                            TRY ANOTHER SEARCH
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                visibleDeals.map((deal, idx) => {
                                    // Image fallback for Gemini results
                                    const displayImage = (engine === 'gemini' && (!deal.image || deal.image.includes('placeholder')))
                                        ? (lastImage || '/Images/Logo_shopsmart.png')
                                        : (deal.image || '/Images/Logo_shopsmart.png');

                                    return (
                                        <div className="deal-card" key={idx}>
                                            {smartChoice && smartChoice.link === deal.link && (
                                                <div className="choice-badge">TOP PICK ⭐</div>
                                            )}
                                            <img src={displayImage} alt={deal.store} className="deal-img" />
                                            <div className="deal-details">
                                                <h3>{deal.title}</h3>
                                                <div className="deal-meta">
                                                    <span className="store-badge">{deal.store}</span>
                                                    {deal.rating && <span>⭐ {deal.rating} ({deal.reviews} reviews)</span>}
                                                    <button 
                                                        className={`wishlist-btn ${wishlist.some(w => w.link === deal.link) ? 'active' : ''}`}
                                                        onClick={() => toggleWishlist(deal)}
                                                    >
                                                        <i className="fa-solid fa-heart"></i>
                                                    </button>
                                                </div>
                                                <div className="deal-price">{deal.price_str}</div>
                                            </div>
                                            <a href={deal.link} target="_blank" className="checkout-btn">Proceed to Checkout</a>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {sortedDeals.length > visibleCount && (
                            <div className="load-more-container">
                                <button className="load-more-btn" onClick={() => setVisibleCount(prev => prev + 6)}>
                                    LOAD MORE RESULTS
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </main>
    );
}
