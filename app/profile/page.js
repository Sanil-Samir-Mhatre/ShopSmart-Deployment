"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/context/SearchContext';

export default function ProfilePage() {
    const { user, logout } = useSearch();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('shopsmart_token');
        if (!token) {
            router.push('/');
            return;
        }
        
        fetchProfile(token);
    }, []);

    const fetchProfile = async (token) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';
        try {
            const res = await fetch(`${API_URL}/api/profile`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            if (data.history) {
                setHistory(data.history);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <main className="container" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="main-headline" style={{ fontSize: '3.5rem', marginBottom: '2rem' }}>
                Your Profile
            </h1>

            <div className="login-card" style={{ paddingBottom: '2rem', minHeight: 'auto', width: '100%', maxWidth: '600px' }}>
                <div className="login-banner">Account Details</div>
                
                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '15px', color: '#000', width: '100%', marginBottom: '2rem' }}>
                    <p style={{ margin: '0.5rem 0' }}><strong>Username:</strong> {user?.username}</p>
                    <p style={{ margin: '0.5rem 0' }}><strong>Email:</strong> {user?.email}</p>
                </div>

                <div className="login-banner">Search History</div>
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {history.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.7 }}>No previous searches found.</p>
                    ) : (
                        history.map((h, i) => (
                            <div key={i} style={{ padding: '0.8rem', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: '700' }}>{h.product_name}</span>
                                <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{new Date(h.timestamp).toLocaleDateString()}</span>
                            </div>
                        ))
                    )}
                </div>

                <button 
                    className="login-btn" 
                    onClick={handleLogout}
                    style={{ marginTop: '2rem', width: '100%', background: '#ff4d4d', color: '#fff', border: '2px solid #000' }}
                >
                    LOGOUT
                </button>
            </div>
        </main>
    );
}
