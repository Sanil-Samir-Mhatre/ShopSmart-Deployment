# 🛒 ShopSmart: AI-Powered Price Comparison Across E-Commerce Sites

**Stop Tab-Hopping. Start Saving.**
ShopSmart is a high-performance, full-stack application designed to unify the e-commerce search experience. Using **Next.js**, **Python Flask**, and **Google Gemini AI**, it identifies products from images or text and aggregates the best deals from major Indian retailers like Amazon, Flipkart, eBay, and more.

---

## 🚀 Core Features
- **✨ AI Visual Discovery**: Upload or capture a product photo, and Google Gemini 1.5 Flash identifies it instantly.
- **🔍 Dual-Engine Search**: Switch between AI-curated scraping (Option 1) and raw Market aggregate Scraping (Option 2) in real-time.
- **💎 Premium UX**: Neo-Brutalist design with high-contrast clarity, shimmer loading skeletons, and interactive micro-animations.
- **👤 Personalized Dashboard**: Persistent search history and wishlist powered by **MongoDB Atlas Cloud**.
- **🎯 Choice Pick Algorithm**: Automatically highlights the "Best Value" deal based on price, rating, and review count.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js 15 (App Router), React, Vanilla CSS.
- **Backend**: Python 3.10+, Flask REST API.
- **Database**: MongoDB Atlas (NoSQL Cloud Integration).
- **AI Engine**: Google Generative AI (Gemini-2.5-Flash).
- **External Data**: SerpApi (Google Shopping API Aggregate).

---

## 📦 Project Structure
```text
/ (Root)
├── app.py                   # Flask Backend API
├── requirements.txt         # Backend Dependencies
├── .gitignore               # Ignored files (node_modules, .env, etc.)
├── frontend/                # Complete Next.js Application
│   ├── app/                 # Pages & Layouts
│   ├── context/             # Search & Auth State Management
│   └── public/              # Logos & Visual Assets
└── Report_Sanil Mhatre.txt  # Final Project Report
```

---

## 🏁 Getting Started

### 1. Backend Setup
1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`
3. Configure your `.env` with `MONGO_URI`, `GOOGLE_GEMINI_API`, and `SERPAPI_KEY`.
4. Run: `python app.py`

### 2. Frontend Setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Set `NEXT_PUBLIC_API_URL=http://localhost:5000` in `.env.local`.
4. Run: `npm run dev`

---

## 🎓 Internship Project
This project was developed as a final submission for the **Infosys Springboard Virtual Internship 6.0**. It represents 8 weeks of intensive full-stack development, AI integration, and design architecture.

**Author**: Sanil Samir Mhatre
**Batch**: 13 (Set-2)
