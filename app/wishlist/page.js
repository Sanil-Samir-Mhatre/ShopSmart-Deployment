"use client";

import React from 'react';
import { useSearch } from '@/context/SearchContext';
import '../search/search.css';

export default function WishlistPage() {
    const { wishlist, toggleWishlist } = useSearch();

    return (
        <main className="search-main-container">
            <h1 className="main-headline" style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                Your Wishlist
            </h1>

            <div className="deals-panel" style={{ width: '100%', maxWidth: '800px' }}>
                <div className="deals-list">
                    {wishlist.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.1)', borderRadius: '20px' }}>
                            <h2 style={{ color: 'var(--accent-yellow)' }}>Your wishlist is empty!</h2>
                            <p>Start searching for products and save your favorite deals.</p>
                        </div>
                    ) : (
                        wishlist.map((item, idx) => (
                            <div className="deal-card" key={idx}>
                                <img src={item.image || '/Images/Logo_shopsmart.png'} alt={item.store} className="deal-img" />
                                <div className="deal-details">
                                    <h3>{item.title}</h3>
                                    <div className="deal-meta">
                                        <span className="store-badge">{item.store}</span>
                                        {item.rating && <span>⭐ {item.rating} ({item.reviews} reviews)</span>}
                                        <button 
                                            className="wishlist-btn active"
                                            onClick={() => toggleWishlist(item)}
                                        >
                                            <i className="fa-solid fa-heart"></i>
                                        </button>
                                    </div>
                                    <div className="deal-price">{item.price_str}</div>
                                </div>
                                <a href={item.link} target="_blank" className="checkout-btn">View Deal</a>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
