"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSearch } from '@/context/SearchContext';

export default function Navbar() {
    const { user, logout } = useSearch();
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <header className="navbar">
            <div className="logo-container">
                <Link href="/">
                    <img src="/Images/Logo_shopsmart.png" alt="ShopSmart Logo" className="logo" />
                </Link>
            </div>
            <nav className="nav-links">
                <Link href="/" className={isActive('/') ? 'active' : ''}>Home</Link>
                {/* Search and Wishlist should ALWAYS exist once logged in as requested */}
                {user && <Link href="/search" className={isActive('/search') ? 'active' : ''}>Search</Link>}
                {user && <Link href="/wishlist" className={isActive('/wishlist') ? 'active' : ''}>Wishlist</Link>}
                {user && <Link href="/history" className={isActive('/history') ? 'active' : ''}>History</Link>}
                
                <Link href="/about" className={isActive('/about') ? 'active' : ''}>About</Link>
                <Link href="/help" className={isActive('/help') ? 'active' : ''}>Help</Link>
                <Link href="/contact" className={isActive('/contact') ? 'active' : ''}>Contact Us</Link>
            </nav>
            <div className="user-pill">
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'inherit', textDecoration: 'none' }}>
                            <i className="fa-solid fa-circle-user"></i>
                            <span>{user.username}</span>
                        </Link>
                        <button 
                            onClick={logout}
                            style={{ 
                                background: 'transparent', 
                                border: '1px solid #000', 
                                padding: '2px 8px', 
                                borderRadius: '5px', 
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <i className="fa-solid fa-circle-user"></i>
                        <span>Guest</span>
                    </div>
                )}
            </div>
        </header>
    );
}
