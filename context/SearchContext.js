"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const SearchContext = createContext();

export function SearchProvider({ children }) {
    const [geminiDeals, setGeminiDeals] = useState([]);
    const [shoppingDeals, setShoppingDeals] = useState([]);
    const [lastImage, setLastImage] = useState(null);
    const [productInfo, setProductInfo] = useState(null);
    const [engine, setEngine] = useState('gemini');
    const [user, setUser] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const [history, setHistory] = useState([]);

    // Sync state from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('shopsmart_user');
        const storedGemini = localStorage.getItem('shopsmart_gemini_results');
        const storedShopping = localStorage.getItem('shopsmart_shopping_results');
        const storedInfo = localStorage.getItem('shopsmart_info');
        const storedImage = localStorage.getItem('shopsmart_image');

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedGemini) setGeminiDeals(JSON.parse(storedGemini));
        if (storedShopping) setShoppingDeals(JSON.parse(storedShopping));
        if (storedInfo) setProductInfo(JSON.parse(storedInfo));
        if (storedImage) setLastImage(storedImage);
        
        const token = localStorage.getItem('shopsmart_token');
        if (token) {
            fetchWishlist(token);
            fetchHistory(token);
        }
    }, []);

    // Persist search data when it changes
    useEffect(() => {
        if (geminiDeals.length) {
            localStorage.setItem('shopsmart_gemini_results', JSON.stringify(geminiDeals));
        }
    }, [geminiDeals]);

    useEffect(() => {
        if (shoppingDeals.length) {
            localStorage.setItem('shopsmart_shopping_results', JSON.stringify(shoppingDeals));
        }
    }, [shoppingDeals]);

    useEffect(() => {
        if (productInfo) {
            localStorage.setItem('shopsmart_info', JSON.stringify(productInfo));
        }
    }, [productInfo]);

    useEffect(() => {
        if (lastImage) {
            localStorage.setItem('shopsmart_image', lastImage);
        }
    }, [lastImage]);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

    const fetchWishlist = async (token) => {
        try {
            const res = await fetch(`${API_URL}/api/wishlist`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            if (data.wishlist) {
                setWishlist(data.wishlist);
            }
        } catch (err) {
            console.error("Failed to fetch wishlist", err);
        }
    };

    const fetchHistory = async (token) => {
        try {
            const res = await fetch(`${API_URL}/api/profile`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            if (data.history) {
                setHistory(data.history);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        }
    };

    const saveToHistory = async (productName) => {
        const token = localStorage.getItem('shopsmart_token');
        if (!token) return;

        try {
            await fetch(`${API_URL}/api/history`, {
                method: 'POST',
                headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_name: productName })
            });
            fetchHistory(token);
        } catch (err) {
            console.error("Failed to save history", err);
        }
    };

    const toggleWishlist = async (deal) => {
        const token = localStorage.getItem('shopsmart_token');
        if (!token) {
            alert("Please login to use the Wishlist!");
            return;
        }

        const isExist = wishlist.find(item => item.link === deal.link);
        
        if (isExist) {
            // Remove
            try {
                await fetch(`${API_URL}/api/wishlist`, {
                    method: 'DELETE',
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: isExist.id })
                });
                setWishlist(prev => prev.filter(item => item.link !== deal.link));
            } catch (err) {
                console.error(err);
            }
        } else {
            // Add
            try {
                const res = await fetch(`${API_URL}/api/wishlist`, {
                    method: 'POST',
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify(deal)
                });
                if (res.ok) {
                    fetchWishlist(token);
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('shopsmart_token');
        localStorage.removeItem('shopsmart_user');
        localStorage.removeItem('shopsmart_gemini_results');
        localStorage.removeItem('shopsmart_shopping_results');
        localStorage.removeItem('shopsmart_info');
        localStorage.removeItem('shopsmart_image');
        setUser(null);
        setGeminiDeals([]);
        setShoppingDeals([]);
        setProductInfo(null);
        setLastImage(null);
        setWishlist([]);
        setHistory([]);
    };

    return (
        <SearchContext.Provider value={{
            geminiDeals, setGeminiDeals,
            shoppingDeals, setShoppingDeals,
            lastImage, setLastImage,
            productInfo, setProductInfo,
            engine, setEngine,
            user, setUser,
            wishlist, setWishlist,
            history, setHistory,
            toggleWishlist,
            saveToHistory,
            logout
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    return useContext(SearchContext);
}
