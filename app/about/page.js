"use client";

import React, { useState, useEffect } from 'react';

const aboutData = [
    { type: 'h2', text: 'The End of Endless Searching. Welcome to ShopSmart.' },
    { type: 'h3', text: 'The Mission' },
    { type: 'p', text: 'Have you ever found yourself drowning in a sea of open browser tabs, frantically bouncing between Amazon, Myntra, Flipkart, and eBay just to make sure you aren\'t overpaying? We have been there, too.' },
    { type: 'p', text: 'ShopSmart was built with a single, simple mission: to cure the headache of fragmented online shopping. We believe that finding the perfect price shouldn\'t feel like a high-stakes scavenger hunt.' },
    { type: 'h3', text: 'What We Do' },
    { type: 'p', text: 'We are your ultimate digital shopping assistant. ShopSmart provides a beautifully unified space where you can drop a product name or image into our search engine and let the magic happen. In seconds, our platform scans the entire web, compares real-time offers across all major e-commerce retailers, and brings the absolute lowest price straight to your screen.' },
    { type: 'p', text: 'No extra tabs. No hidden costs. Just smart shopping, simplified.' },
    { type: 'h3', text: 'Why Choose ShopSmart?' },
    { type: 'ul', items: [
        { strong: 'Real-Time Price Comparison:', text: ' We do the heavy lifting, instantly comparing prices across giants like Amazon, Reliance Digital, Myntra, and more.' },
        { strong: 'Price Drop Tracking:', text: ' Don\'t want to buy just yet? Smart shoppers know how to wait. Create an account to track your favorite items and get notified the moment the price drops.' },
        { strong: 'Unified Experience:', text: ' Say goodbye to cluttered screens. Discover every retailer and secure the perfect price from one clean, user-friendly dashboard.' }
    ]},
    { type: 'h3', text: 'Behind the Code' },
    { type: 'p', text: 'ShopSmart is designed and developed by Sanil, a Computer Engineering student passionate about building clean, functional UI/UX experiences that solve real-world problems. What started as a vision to reduce digital friction has evolved into a fully streamlined tool designed to put the power of price transparency back into the shopper\'s hands.' }
];

export default function AboutPage() {
    const [currentElements, setCurrentElements] = useState([]);
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        let mounted = true;
        const speed = 10; // ms per char

        const runAnimation = async () => {
            const elements = [];
            for (let block of aboutData) {
                if (!mounted) return;
                
                if (block.type === 'ul') {
                    const listItems = [];
                    for (let item of block.items) {
                        let strongFull = "";
                        let textFull = "";
                        
                        // Fake typing for strong
                        for (let char of item.strong) {
                            if (!mounted) return;
                            strongFull += char;
                            setCurrentElements([...elements, { type: 'ul', items: [...listItems, { strong: strongFull, text: textFull, typing: 'strong' }] }]);
                            await new Promise(r => setTimeout(r, speed));
                        }
                        
                        // Fake typing for text
                        for (let char of item.text) {
                            if (!mounted) return;
                            textFull += char;
                            setCurrentElements([...elements, { type: 'ul', items: [...listItems, { strong: strongFull, text: textFull, typing: 'text' }] }]);
                            await new Promise(r => setTimeout(r, speed));
                        }
                        listItems.push({ strong: strongFull, text: textFull });
                    }
                    elements.push({ type: 'ul', items: listItems });
                } else {
                    let currentText = "";
                    for (let char of block.text) {
                        if (!mounted) return;
                        currentText += char;
                        setCurrentElements([...elements, { type: block.type, text: currentText, typing: true }]);
                        await new Promise(r => setTimeout(r, speed));
                    }
                    elements.push({ type: block.type, text: currentText });
                }
            }
            setIsDone(true);
        };

        runAnimation();
        return () => { mounted = false; };
    }, []);

    return (
        <main className="about-main-container">
            <section className="about-card">
                <div className="typewriter-content">
                    {currentElements.map((el, i) => {
                        if (el.type === 'ul') {
                            return (
                                <ul key={i}>
                                    {el.items.map((item, j) => (
                                        <li key={j}>
                                            <strong>{item.strong}</strong>
                                            <span>{item.text}</span>
                                            {item.typing && <span className="cursor"></span>}
                                        </li>
                                    ))}
                                </ul>
                            );
                        }
                        const Tag = el.type;
                        return (
                            <Tag key={i}>
                                {el.text}
                                {el.typing && <span className="cursor"></span>}
                            </Tag>
                        );
                    })}
                    {isDone && <span className="cursor"></span>}
                </div>
            </section>
        </main>
    );
}
