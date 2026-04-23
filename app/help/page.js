"use client";

import React from 'react';

const steps = [
    {
        id: 1,
        icon: "fa-camera-viewfinder",
        title: "Capture or Type",
        frontTitle: "Step 1",
        backTitle: "Drop Your Product!",
        backText: "Upload a product photo, snap a quick webcam pic, or simply type the name of the item you want into the central block."
    },
    {
        id: 2,
        icon: "fa-gears",
        title: "Select Engine",
        frontTitle: "Step 2",
        backTitle: "Choose Your Tool",
        backText: "Prior to searching, toggle seamlessly between our custom Gemini AI aggregator or live Google Shopping scraping algorithms."
    },
    {
        id: 3,
        icon: "fa-magnifying-glass-chart",
        title: "Compare Deals",
        frontTitle: "Step 3",
        backTitle: "Watch the Magic",
        backText: "Within seconds, ShopSmart actively pulls and identifies pricing parity across massive retailers like Amazon, Myntra, Flipkart, and more."
    },
    {
        id: 4,
        icon: "fa-cart-arrow-down",
        title: "Checkout Smart",
        frontTitle: "Step 4",
        backTitle: "Grab the Lowest Price!",
        backText: "Use our internal sorting filters to instantly isolate the cheapest deal on the market and proceed precisely to checkout!"
    }
];

export default function HelpPage() {
    return (
        <main className="help-main-container">
            <div className="help-header">
                <h1 className="help-headline">How to use ShopSmart</h1>
                <p className="help-subheading">Hover over the cards below to uncover the simple 4-step path to the perfect price!</p>
            </div>

            <div className="flip-cards-wrapper">
                {steps.map((step) => (
                    <div className="flip-card" key={step.id}>
                        <div className="flip-card-inner">
                            <div className="flip-card-front">
                                <div className="step-badge">{step.id}</div>
                                <i className={`fa-solid ${step.icon} card-icon`}></i>
                                <h2>{step.title}</h2>
                            </div>
                            <div className="flip-card-back">
                                <h3>{step.backTitle}</h3>
                                <p>{step.backText}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
