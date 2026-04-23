import streamlit as st
import httpx
import asyncio
import sys
from ultralytics import YOLO
import numpy as np
import torch
import clip
from PIL import Image
import io
import pandas as pd

# Set up correct asyncio policy for Windows to avoid httpx EventLoop errors
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

st.set_page_config(page_title="ShopSmart Price Comparator", layout="wide")

# API Keys
SERPAPI_KEY = "7babffd69759157d4fb5b8d85cc0baa288f46df8a7782a219ed6b6a310eb6db0"
RAPIDAPI_KEY = "3bf982f1f3msh8ab3ea51cb76e64p1bcef8jsne637e33373ac"

product_labels = [
    "smartphone", "laptop", "sneakers", 
    "wrist watch", "coffee mug", "t-shirt", 
    "sunglasses", "backpack", "camera",
    "headphones", "gaming console", "television",
    "perfume", "jeans", "computer mouse"
]

@st.cache_resource
def load_models():
    model = YOLO("yolov8n.pt")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)
    text_tokens = clip.tokenize([f"a photo of a {label}" for label in product_labels]).to(device)
    return model, clip_model, clip_preprocess, device, text_tokens

model, clip_model, clip_preprocess, device, text_tokens = load_models()

def identify_product(content: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
        img_array = np.array(image)
        image_input = clip_preprocess(image).unsqueeze(0).to(device)
        
        results = model(img_array)
        with torch.no_grad():
            logits_per_image, _ = clip_model(image_input, text_tokens)
            probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
            
        best_match_idx = probs.argmax()
        best_match_label = product_labels[best_match_idx]
        
        if len(results) > 0 and len(results[0].boxes) > 0:
            class_id = int(results[0].boxes.cls[0].item())
            product_name = results[0].names[class_id]
            return product_name
        else:
            return best_match_label
    except Exception as e:
        st.error(f"Processing error: {e}")
        return "product"

# --- API Fetching Functions ---
async def fetch_serpapi_shopping(product_name: str):
    url = "https://serpapi.com/search"
    params = {"engine": "google_shopping", "q": product_name, "api_key": SERPAPI_KEY, "hl": "en", "gl": "in"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return {"source": "SerpApi Google Shopping", "data": response.json()}
        except Exception as e:
            return {"source": "SerpApi Google Shopping", "error": str(e)}

async def fetch_amazon_data(product_name: str):
    url = "https://real-time-amazon-data.p.rapidapi.com/search"
    querystring = {"query": product_name, "page": "1", "country": "IN"}
    headers = {"x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com", "x-rapidapi-key": RAPIDAPI_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return {"source": "Amazon Data", "data": response.json()}
        except Exception as e:
            return {"source": "Amazon Data", "error": str(e)}

async def fetch_flipkart_data(product_name: str):
    url = "https://real-time-flipkart-data2.p.rapidapi.com/search"
    querystring = {"query": product_name, "page": "1"}
    headers = {"x-rapidapi-host": "real-time-flipkart-data2.p.rapidapi.com", "x-rapidapi-key": RAPIDAPI_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return {"source": "Flipkart Data", "data": response.json()}
        except Exception as e:
            return {"source": "Flipkart Data", "error": str(e)}

async def fetch_multi_store_details(product_name: str):
    amazon_search_url = f"https://www.amazon.in/s?k={product_name}"
    url = "https://realtime-flipkart-amazon-myntra-ajio-croma-product-details.p.rapidapi.com/product"
    querystring = {"url": amazon_search_url}
    headers = {"x-rapidapi-host": "realtime-flipkart-amazon-myntra-ajio-croma-product-details.p.rapidapi.com", "x-rapidapi-key": RAPIDAPI_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return {"source": "Multi-Store Product Details", "data": response.json()}
        except Exception as e:
            return {"source": "Multi-Store Product Details", "error": str(e)}

async def fetch_ecommerce_product_search(product_name: str):
    url = "https://real-time-product-search.p.rapidapi.com/search"
    querystring = {"q": product_name, "country": "in", "language": "en"}
    headers = {"x-rapidapi-host": "real-time-product-search.p.rapidapi.com", "x-rapidapi-key": RAPIDAPI_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return {"source": "eCommerce Product Search", "data": response.json()}
        except Exception as e:
            return {"source": "eCommerce Product Search", "error": str(e)}

async def fetch_real_time_image_search(product_name: str):
    url = "https://real-time-image-search.p.rapidapi.com/search"
    querystring = {"query": product_name, "limit": "20", "region": "in", "safe_search": "off"}
    headers = {"x-rapidapi-host": "real-time-image-search.p.rapidapi.com", "x-rapidapi-key": RAPIDAPI_KEY}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return {"source": "Real Time Image Search", "data": response.json()}
        except Exception as e:
            return {"source": "Real Time Image Search", "error": str(e)}

def run_async_searches(product_name):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    results = loop.run_until_complete(asyncio.gather(
        fetch_serpapi_shopping(product_name),
        fetch_amazon_data(product_name),
        fetch_flipkart_data(product_name),
        fetch_multi_store_details(product_name),
        fetch_ecommerce_product_search(product_name),
        fetch_real_time_image_search(product_name),
        return_exceptions=True
    ))
    loop.close()
    return results

# --- STREAMLIT UI ---
st.title("🛒 ShopSmart Product Search")

search_method = st.radio("Choose Search Method:", ["Text Search", "Upload an Image", "Take a Photo"], horizontal=True)

product_name = None
search_triggered = False

if search_method == "Text Search":
    product_name = st.text_input("Enter Product Name (e.g., iPhone 15)")
    if st.button("Search") and product_name:
        search_triggered = True

elif search_method == "Upload an Image":
    file = st.file_uploader("Upload an Image", type=["png", "jpg", "jpeg"])
    if file:
        st.image(file, width=300)
        if st.button("Identify & Search"):
            with st.spinner("Identifying product..."):
                product_name = identify_product(file.getvalue())
            st.success(f"Identified Product: {product_name}")
            search_triggered = True

elif search_method == "Take a Photo":
    pic = st.camera_input("Take a photo")
    if pic:
        with st.spinner("Identifying product..."):
            product_name = identify_product(pic.getvalue())
        st.success(f"Identified Product: {product_name}")
        if st.button("Search for this product"):
            search_triggered = True

if search_triggered and product_name:
    st.divider()
    st.header(f"Comparing Prices for: '{product_name.capitalize()}'")
    
    with st.spinner("Fetching data from stores and APIs..."):
        results = run_async_searches(product_name)
        
    products = []
    for result in results:
        if isinstance(result, Exception) or "error" in result:
            continue
        source = result.get("source")
        
        if source == "SerpApi Google Shopping":
            for item in result.get("data", {}).get("shopping_results", []):
                products.append({"title": item.get("title", ""), "price_str": item.get("price", ""), "price_num": item.get("extracted_price", 999999.0), "store": item.get("source", "Google Shopping"), "link": item.get("product_link", "#"), "image": item.get("thumbnail", "")})
        elif source == "Amazon Data":
            for item in result.get("data", {}).get("data", {}).get("products", []):
                price_str = item.get("product_price", "N/A")
                try: price_num = float(price_str.replace("₹", "").replace("$", "").replace(",", "").strip())
                except: price_num = 999999.0
                products.append({"title": item.get("product_title", ""), "price_str": price_str, "price_num": price_num, "store": "Amazon", "link": item.get("product_url", "#"), "image": item.get("product_photo", "")})
        elif source == "Flipkart Data":
            flipkart_items = result.get("data", {}).get("products", []) or (result.get("data") if isinstance(result.get("data"), list) else [])
            for item in flipkart_items:
                price_str = str(item.get("price", "N/A"))
                try: price_num = float(price_str.replace("₹", "").replace(",", "").strip())
                except: price_num = 999999.0
                img = item.get("images", [item.get("image", "")])[0] if isinstance(item.get("images"), list) else item.get("image", "")
                products.append({"title": item.get("title", ""), "price_str": f"₹{price_num}" if price_num != 999999.0 else price_str, "price_num": price_num, "store": "Flipkart", "link": item.get("url", item.get("link", "#")), "image": img})
        elif source == "eCommerce Product Search":
            for item in result.get("data", {}).get("data", []):
                price_str = str(item.get("product_price", item.get("price", "N/A")))
                try: price_num = float(price_str.replace("₹", "").replace("$", "").replace(",", "").strip())
                except: price_num = 999999.0
                products.append({"title": item.get("product_title", item.get("title", "")), "price_str": price_str, "price_num": price_num, "store": item.get("store_name", item.get("store", "eCommerce")), "link": item.get("product_url", item.get("url", "#")), "image": item.get("product_photo", item.get("image", ""))})

    products.sort(key=lambda x: x["price_num"])
    
    # Display HTML-like Grid
    if products:
        st.markdown('<table><tr><th>Image</th><th>Product</th><th>Price</th><th>Store</th><th>Link</th></tr>' + 
                    ''.join([f'<tr><td><img src="{p["image"]}" width="80" style="border-radius:8px;"></td><td>{p["title"]}</td><td><strong style="color:green;">{p["price_str"]}</strong></td><td>{p["store"]}</td><td><a href="{p["link"]}" target="_blank">View Offer</a></td></tr>' for p in products]) + 
                    '</table>', unsafe_allow_html=True)
    else:
        st.warning("No products found across the queried stores.")

    # --- RAW API SWITCHER (TABS) ---
    st.divider()
    st.subheader("🔍 API Explorer: View Raw Responses")
    valid_results = [r for r in results if isinstance(r, dict) and "source" in r]
    
    if valid_results:
        tabs = st.tabs([res["source"] for res in valid_results])
        for i, tab in enumerate(tabs):
            with tab:
                if "error" in valid_results[i]: st.error(f"Error: {valid_results[i]['error']}")
                else: st.json(valid_results[i]["data"])