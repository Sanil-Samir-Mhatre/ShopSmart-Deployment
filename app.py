from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import base64
import os
from pymongo import MongoClient, ASCENDING
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
# Crucial: This allows your file:/// frontend to talk to this python backend
CORS(app)  

# --- Configuration Keys ---
GEMINI_KEY = os.getenv("GOOGLE_GEMINI_API")
SERPAPI_KEY = os.getenv("SERPAPI_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MYSQL_DATABASE = "shopsmart" # Keeping the same name for consistency

genai.configure(api_key=GEMINI_KEY)

# MongoDB Connection
client = MongoClient(MONGO_URI)
db = client[MYSQL_DATABASE]

def init_db():
    try:
        # Create indexes for performance and uniqueness
        db.users.create_index("email", unique=True)
        db.users.create_index("token")
        db.history.create_index("user_id")
        db.wishlist.create_index([("user_id", ASCENDING), ("timestamp", ASCENDING)])
        print("MongoDB initialized successfully with indexes.")
    except Exception as e:
        print(f"Database initialization error: {e}")

init_db()

# Exact Match Logic Helper
def is_valid_product(title, product_name):
    t_lower = title.lower()
    
    negatives = ['cover', 'skin', 'case', 'stand', 'cable', 'empty box', 'parts', 'broken', 'refurbished', 'adapter', 'box only']
    if 'controller' not in product_name.lower():
        negatives.append('controller')
        
    for w in negatives:
        if w in t_lower:
            return False
            
    # We trust Google Shopping's algorithm for relevance as long as it isn't an accessory
    return True


@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        age = data.get('age')
        gender = data.get('gender')
        phone = data.get('phone')
        
        if not username or not email or not password:
            return jsonify({"error": "Missing required fields"}), 400
            
        password_hash = generate_password_hash(password)
        
        # MongoDB insertion
        user_data = {
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "age": age,
            "gender": gender,
            "phone": phone,
            "token": None
        }
        
        db.users.insert_one(user_data)
        return jsonify({"message": "User successfully registered!"}), 201
    except Exception as e:
        if "duplicate key error" in str(e).lower():
            return jsonify({"error": "Email already exists"}), 409
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        user = db.users.find_one({"email": email})
        
        if user and check_password_hash(user['password_hash'], password):
            token = secrets.token_hex(32)
            db.users.update_one({"_id": user["_id"]}, {"$set": {"token": token}})
            
            return jsonify({
                "message": "Login successful", 
                "token": token, 
                "user": {"id": str(user['_id']), "username": user['username'], "email": user['email']}
            }), 200
            
        return jsonify({"error": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/profile', methods=['GET'])
def profile():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
            
        user = db.users.find_one({"token": token}, {"password_hash": 0})
        
        if not user:
            return jsonify({"error": "Invalid session"}), 401
            
        user['id'] = str(user['_id'])
        user.pop('_id')
        
        # Fetch history
        history_cursor = db.history.find({"user_id": user['id']}).sort("timestamp", -1)
        history = []
        for h in history_cursor:
            h['id'] = str(h['_id'])
            h.pop('_id')
            # Format timestamp for JSON
            if 'timestamp' in h:
                h['timestamp'] = h['timestamp'].strftime("%Y-%m-%d %H:%M:%S")
            history.append(h)
            
        return jsonify({"user": user, "history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/history', methods=['POST'])
def add_history():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
            
        data = request.json
        product_name = data.get('product_name')
        
        user = db.users.find_one({"token": token}, {"_id": 1})
        
        if not user:
            return jsonify({"error": "Invalid session"}), 401
            
        import datetime
        db.history.insert_one({
            "user_id": str(user['_id']),
            "product_name": product_name,
            "timestamp": datetime.datetime.utcnow()
        })
        
        return jsonify({"message": "History saved"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/identify', methods=['POST'])
def identify():
    try:
        data = request.json
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = "You are an expert product identifier. Analyze this product image or text query and extract accurate information. Return strictly in valid JSON format: {\"product_name\":\"\", \"brand\": \"\", \"model_number\": \"\", \"category\": \"\", \"key_features\": []}. Do not include markdown."
        
        contents = [prompt]
        if 'image' in data:
            img_data = base64.b64decode(data['image'].split(',')[1])
            contents.append({'mime_type': 'image/jpeg', 'data': img_data})
        elif 'text' in data:
            contents.append(f"Product Search Query: {data['text']}")
            
        response = model.generate_content(contents)
        text = response.text.replace('```json', '').replace('```', '').strip()
        
        data = json.loads(text)
        if not data.get('product_name'):
            return jsonify({"error": "Our AI couldn't identify this product. Please try a clearer photo or use text search."}), 400
            
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/deals', methods=['POST'])
def deals():
    try:
        req_data = request.json
        product_name = req_data.get('product_name', '')
        brand = req_data.get('brand', '')
        search_type = req_data.get('type', 'gemini') # 'gemini' or 'shopping'
        
        if not product_name:
            return jsonify({"error": "No product name provided"}), 400
            
        exact_search_term = f"{brand} {product_name}".strip()
        
        if search_type == 'gemini':
            model = genai.GenerativeModel('gemini-2.5-flash')
            prompt = f"""
You are an expert E-Commerce Aggregator API.
The user is searching for: "{brand} {product_name}".
Provide 5-8 realistic or real-time deal listings from top platforms including Amazon India, Flipkart, JioMart, Meesho, and eBay.
Ensure that the links redirect to actual search queries or product pages for those sites.
All prices MUST be in Indian Rupees (INR) starting with the '₹' symbol.

Respond STRICTLY with a raw JSON array of objects. Do not use markdown backticks like ```json.
Example Object structure:
{{
    "store": "Amazon.in",
    "title": "Exact Product Title",
    "price_str": "₹45,000",
    "price": 45000,
    "link": "https://www.amazon.in/s?k=...",
    "image": "https://via.placeholder.com/150",
    "rating": 4.6,
    "reviews": 342
}}
"""
            response = model.generate_content(prompt)
            text = response.text.replace('```json', '').replace('```', '').strip()
            deals_list = json.loads(text)
            return jsonify({"deals": deals_list})
            
        else:
            url = "https://serpapi.com/search.json"
            params = {
                "engine": "google_shopping",
                "q": exact_search_term,
                "gl": "in",
                "hl": "en",
                "api_key": SERPAPI_KEY
            }
            res = requests.get(url, params=params)
            data = res.json()
            
            deals = []
            for r in data.get("shopping_results", []):
                title = r.get("title", "")
                
                if title and is_valid_product(title, product_name):
                    price_str = r.get("price", "0")
                    
                    import re
                    clean_price = re.sub(r'[^\d.]', '', price_str)
                    price_val = float(clean_price) if clean_price else 0
                    
                    deals.append({
                        "store": r.get("source", "Google Shopping"),
                        "title": title,
                        "price_str": price_str,
                        "price": price_val,
                        "link": r.get("product_link", r.get("link", "#")),
                        "image": r.get("thumbnail", ""),
                        "rating": r.get("rating", 0),
                        "reviews": r.get("reviews", 0)
                    })
            
            return jsonify({"deals": deals})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/wishlist', methods=['GET', 'POST', 'DELETE'])
def manage_wishlist():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Unauthorized"}), 401
            
        user = db.users.find_one({"token": token}, {"_id": 1})
        
        if not user:
            return jsonify({"error": "Invalid session"}), 401
            
        user_id_str = str(user['_id'])
            
        if request.method == 'GET':
            items_cursor = db.wishlist.find({"user_id": user_id_str}).sort("timestamp", -1)
            items = []
            for item in items_cursor:
                item['id'] = str(item['_id'])
                item.pop('_id')
                items.append(item)
            return jsonify({"wishlist": items}), 200
            
        elif request.method == 'POST':
            data = request.json
            import datetime
            wishlist_item = {
                "user_id": user_id_str,
                "store": data.get('store'),
                "title": data.get('title'),
                "price_str": data.get('price_str'),
                "price": data.get('price'),
                "link": data.get('link'),
                "image": data.get('image'),
                "rating": data.get('rating'),
                "reviews": data.get('reviews'),
                "timestamp": datetime.datetime.utcnow()
            }
            db.wishlist.insert_one(wishlist_item)
            return jsonify({"message": "Added to wishlist"}), 201
            
        elif request.method == 'DELETE':
            from bson import ObjectId
            item_id = request.json.get('id')
            db.wishlist.delete_one({"_id": ObjectId(item_id), "user_id": user_id_str})
            return jsonify({"message": "Removed from wishlist"}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
