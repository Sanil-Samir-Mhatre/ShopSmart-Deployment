"use client";

import React, { useState, useEffect } from 'react';
import { useSearch } from '@/context/SearchContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HistoryPage() {
    const { history, setHistory, user } = useSearch();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('shopsmart_token');
        if (!token) {
            router.push('/');
            return;
        }
        fetchHistory(token);
    }, []);

    const fetchHistory = async (token) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
        try {
            const res = await fetch(`${API_URL}/api/profile`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            if (data.history) {
                setHistory(data.history);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSearchAgain = (productName) => {
        // We'll set a temporary search flag in localStorage so the search page auto-triggers
        localStorage.setItem('shopsmart_pending_search', productName);
        router.push('/search');
    };

    if (loading) return <div className="loading-state">Loading your journey...</div>;

    return (
        <main className="about-main-container">
            <section className="about-card" style={{ maxWidth: '1000px', backgroundColor: 'var(--sub-bg-darkblue)', border: '4px solid var(--secondary-turquoise)', boxShadow: '15px 15px 0 var(--accent-yellow)' }}>
                <h1 className="features-title" style={{ color: 'var(--accent-yellow)', marginBottom: '2rem' }}>Your Shopping Journey</h1>
                
                <div className="history-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {history.length > 0 ? history.map((item, i) => (
                        <div key={i} className="history-card" style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '2px solid var(--secondary-turquoise)', 
                            borderRadius: '15px', 
                            padding: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: '0.3s'
                        }}>
                            <div className="history-info">
                                <h3 style={{ color: 'var(--secondary-turquoise)', fontSize: '1.4rem' }}>{item.product_name}</h3>
                                <p style={{ color: 'white', opacity: 0.6, fontSize: '0.9rem', marginTop: '0.3rem' }}>
                                    <i className="fa-regular fa-clock" style={{ marginRight: '0.5rem' }}></i>
                                    {new Date(item.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <button 
                                className="action-btn" 
                                style={{ transform: 'none', padding: '0.8rem 1.5rem', fontSize: '1rem' }}
                                onClick={() => handleSearchAgain(item.product_name)}
                            >
                                View Results <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
                            </button>
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <p style={{ fontSize: '1.5rem', color: 'white' }}>You haven't searched for anything yet!</p>
                            <Link href="/search" className="shopsmart-btn" style={{ display: 'inline-block', marginTop: '2rem', textDecoration: 'none' }}>Start Searching</Link>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
