from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse
import httpx
import base64
import asyncio
import uvicorn
from ultralytics import YOLO
import numpy as np
import torch
import clip
from PIL import Image
import io

app = FastAPI(title="ShopSmart Price Comparator")

# Loaded from API_KEYS.txt context
SERPAPI_KEY = "7babffd69759157d4fb5b8d85cc0baa288f46df8a7782a219ed6b6a310eb6db0"
RAPIDAPI_KEY = "3bf982f1f3msh8ab3ea51cb76e64p1bcef8jsne637e33373ac"

# Load the pre-trained YOLOv8 nano model (will automatically download 'yolov8n.pt' on first run)
model = YOLO("yolov8n.pt")
# Initialize CLIP Model
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading CLIP model on {device}...")
clip_model, clip_preprocess = clip.load("ViT-B/32", device=device)

# Define product categories for CLIP to match against
product_labels = [
    "smartphone", "laptop", "sneakers", 
    "wrist watch", "coffee mug", "t-shirt", 
    "sunglasses", "backpack", "camera",
    "headphones", "gaming console", "television",
    "perfume", "jeans", "computer mouse"
]

# Pre-tokenize the labels for faster inference
text_tokens = clip.tokenize([f"a photo of a {label}" for label in product_labels]).to(device)

@app.get("/", response_class=HTMLResponse)
async def get_index():
    return """
    <!DOCTYPE html>
    <html>
        <head>
            <title>ShopSmart Product Search</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background-color: #f9f9f9; text-align: center;}
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                video { width: 100%; max-width: 400px; border-radius: 8px; background: #000; }
                canvas { display: none; }
                .btn { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 10px; font-size: 16px;}
                .btn:hover { background: #0056b3; }
                hr { margin: 30px 0; border: 0; border-top: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>ShopSmart Product Search</h2>
                
                <h3>Option 1: Take a Photo</h3>
                <video id="video" autoplay playsinline></video>
                <br>
                <button id="snap" class="btn">Capture & Search</button>
                <canvas id="canvas"></canvas>
                
                <hr>
                
                <h3>Option 2: Upload an Image</h3>
                <form id="upload-form" action="/upload-and-compare/" enctype="multipart/form-data" method="post">
                    <input id="file-input" name="file" type="file" accept="image/*" required>
                    <br><br>
                    <input type="submit" class="btn" value="Upload and Compare">
                </form>
                
                <hr>
                
                <h3>Option 3: Enter Product Name</h3>
                <form action="/upload-and-compare/" method="post">
                    <input name="product_text" type="text" placeholder="e.g., iPhone 15" required style="padding: 10px; width: 80%; max-width: 300px; border-radius: 5px; border: 1px solid #ccc;">
                    <br><br>
                    <input type="submit" class="btn" value="Search">
                </form>
            </div>

            <script>
                const video = document.getElementById('video');
                const canvas = document.getElementById('canvas');
                const snapBtn = document.getElementById('snap');
                const form = document.getElementById('upload-form');
                const fileInput = document.getElementById('file-input');

                // Request webcam access (favoring the back camera on mobile devices)
                navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                    .then(stream => { video.srcObject = stream; })
                    .catch(err => { console.error("Error accessing webcam: ", err); });

                // Capture photo and submit
                snapBtn.addEventListener('click', () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob(blob => {
                        const file = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        fileInput.files = dataTransfer.files;
                        form.submit(); // Automatically submit the form
                    }, 'image/jpeg', 0.9);
                });
            </script>
        </body>
    </html>
    """

async def identify_product(content: bytes) -> str:
    """
    Uses YOLOv8 to detect the object in the uploaded image locally.
    Placeholder for image recognition. Since local detection (YOLO) has been removed,
    this function returns a generic name.
    Uses OpenAI's CLIP model to detect the object in the uploaded image.
    """
    try:
        # Convert the uploaded file bytes to a PIL Image, then to a numpy array for YOLO
        
        image = Image.open(io.BytesIO(content)).convert("RGB")
        img_array = np.array(image)
        image_input = clip_preprocess(image).unsqueeze(0).to(device)
        
        # Run YOLOv8 inference on the image
        results = model(img_array)
        with torch.no_grad():
            logits_per_image, _ = clip_model(image_input, text_tokens)
            probs = logits_per_image.softmax(dim=-1).cpu().numpy()[0]
            
        best_match_idx = probs.argmax()
        best_match_label = product_labels[best_match_idx]
        
        # Check if YOLO detected anything
        if len(results) > 0 and len(results[0].boxes) > 0:
            # Grab the class ID of the highest confidence detection
            class_id = int(results[0].boxes.cls[0].item())
            # Map the ID back to the class name (e.g., 'laptop', 'cell phone')
            product_name = results[0].names[class_id]
            print(f"YOLO detected: {product_name}")
            return product_name
        else:
            print("YOLO did not detect any objects. Falling back to default 'iphone'.")
            return "iphone"
            
        print(f"CLIP detected: {best_match_label} with {probs[best_match_idx]*100:.1f}% confidence")
        return best_match_label
    except Exception as e:
        print(f"Processing error: {e}")
        return "product"

async def fetch_serpapi_shopping(product_name: str):
    url = "https://serpapi.com/search"
    params = {
        "engine": "google_shopping",
        "q": product_name,
        "api_key": SERPAPI_KEY,
        "hl": "en",
        "gl": "in"
    }
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
    headers = {
        "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
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
    headers = {
        "x-rapidapi-host": "real-time-flipkart-data2.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return {"source": "Flipkart Data", "data": response.json()}
        except Exception as e:
            return {"source": "Flipkart Data", "error": str(e)}

async def fetch_multi_store_details(product_name: str):
    # Generating a mock URL for the multi-store API parameter
    amazon_search_url = f"https://www.amazon.in/s?k={product_name}"
    url = "https://realtime-flipkart-amazon-myntra-ajio-croma-product-details.p.rapidapi.com/product"
    querystring = {"url": amazon_search_url}
    headers = {
        "x-rapidapi-host": "realtime-flipkart-amazon-myntra-ajio-croma-product-details.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
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
    headers = {
        "x-rapidapi-host": "real-time-product-search.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
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
    headers = {
        "x-rapidapi-host": "real-time-image-search.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, params=querystring)
            response.raise_for_status()
            return {"source": "Real Time Image Search", "data": response.json()}
        except Exception as e:
            return {"source": "Real Time Image Search", "error": str(e)}

@app.post("/upload-and-compare/")
async def upload_and_compare(file: UploadFile = File(None), product_text: str = Form(None)):
    uploaded_image_url = None
    
    if product_text:
        product_name = product_text.strip()
    elif file and file.filename:
        # 1. Read file and prepare the image for display in HTML
        content = await file.read()
        encoded_image = base64.b64encode(content).decode("utf-8")
        uploaded_image_url = f"data:{file.content_type};base64,{encoded_image}"
    
        # 2. Image Recognition step
        try:
            product_name = await identify_product(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Please provide either an image or a product name.")

    # 3. Query all APIs asynchronously and return all data
    results = await asyncio.gather(
        fetch_serpapi_shopping(product_name),
        fetch_amazon_data(product_name),
        fetch_flipkart_data(product_name),
        fetch_multi_store_details(product_name),
        fetch_ecommerce_product_search(product_name),
        fetch_real_time_image_search(product_name),
        return_exceptions=True
    )
    
    # 4. Parse the JSON and extract relevant data
    products = []
    image_search_results = []
    
    for result in results:
        # Skip if the API returned an error or an exception occurred
        if isinstance(result, Exception) or "error" in result:
            if isinstance(result, dict) and "source" in result:
                # This helps you see which APIs are failing in your terminal
                print(f"API Error from {result['source']}: {result['error']}")
            else:
                print(f"An exception occurred during API fetch: {result}")
            continue
            
        source = result.get("source")
        
        # Extract SerpApi Google Shopping Data
        if source == "SerpApi Google Shopping":
            shopping_items = result.get("data", {}).get("shopping_results", [])
            for item in shopping_items:
                products.append({
                    "title": item.get("title", "Unknown Product"),
                    "price_str": item.get("price", "N/A"),
                    "price_num": item.get("extracted_price", 999999.0),
                    "store": item.get("source", "Google Shopping"),
                    "link": item.get("product_link", "#"),
                    "image": item.get("thumbnail", "")
                })
                
        # Extract Amazon RapidAPI Data
        elif source == "Amazon Data":
            amazon_items = result.get("data", {}).get("data", {}).get("products", [])
            for item in amazon_items:
                price_str = item.get("product_price", "N/A")
                # Clean the price string to get a sortable number (e.g., "₹265.00" -> 265.00)
                try:
                    price_num = float(price_str.replace("$", "").replace("₹", "").replace(",", "").strip())
                except:
                    price_num = 999999.0
                
                products.append({
                    "title": item.get("product_title", "Unknown Product"),
                    "price_str": price_str,
                    "price_num": price_num,
                    "store": "Amazon",
                    "link": item.get("product_url", "#"),
                    "image": item.get("product_photo", "")
                })

        # Extract Flipkart Data
        elif source == "Flipkart Data":
            flipkart_items = result.get("data", {}).get("products", [])
            if not flipkart_items and isinstance(result.get("data"), list):
                flipkart_items = result.get("data")
            for item in flipkart_items:
                price_str = str(item.get("price", "N/A"))
                try:
                    price_num = float(price_str.replace("₹", "").replace(",", "").replace("$", "").strip())
                except:
                    price_num = 999999.0
                
                products.append({
                    "title": item.get("title", "Unknown Product"),
                    "price_str": f"₹{price_num}" if price_num != 999999.0 else price_str,
                    "price_num": price_num,
                    "store": "Flipkart",
                    "link": item.get("url", item.get("link", "#")),
                    "image": item.get("images", [item.get("image", "")])[0] if isinstance(item.get("images"), list) else item.get("image", "")
                })
                
        # Extract Multi-Store Data
        elif source == "Multi-Store Product Details":
            item_data = result.get("data", {}).get("data", {})
            if item_data:
                price_str = str(item_data.get("price", "N/A"))
                try:
                    price_num = float(price_str.replace("₹", "").replace(",", "").replace("$", "").strip())
                except:
                    price_num = 999999.0
                
                products.append({
                    "title": item_data.get("title", "Unknown Product"),
                    "price_str": price_str if "₹" in price_str else f"₹{price_num}",
                    "price_num": price_num,
                    "store": "Amazon.in",
                    "link": item_data.get("url", "#"),
                    "image": item_data.get("image", "")
                })
                
        # Extract eCommerce Product Search Data
        elif source == "eCommerce Product Search":
            ecom_items = result.get("data", {}).get("data", [])
            for item in ecom_items:
                price_str = str(item.get("product_price", item.get("price", "N/A")))
                try:
                    price_num = float(price_str.replace("₹", "").replace("$", "").replace(",", "").strip())
                except:
                    price_num = 999999.0
                
                products.append({
                    "title": item.get("product_title", item.get("title", "Unknown Product")),
                    "price_str": price_str,
                    "price_num": price_num,
                    "store": item.get("store_name", item.get("store", "eCommerce Store")),
                    "link": item.get("product_url", item.get("url", item.get("offer_page_url", "#"))),
                    "image": item.get("product_photo", item.get("image", ""))
                })
                
        # Extract Image Search Data
        elif source == "Real Time Image Search":
            images = result.get("data", {}).get("data", [])
            for img in images:
                image_search_results.append(img.get("url"))

    # 4. Sort products by lowest price
    products.sort(key=lambda x: x["price_num"])

    # 5. Generate a clean HTML table to present to the user
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Price Comparison: {product_name}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; background-color: #f9f9f9; }}
            h2 {{ text-align: center; color: #333; }}
            table {{ width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }}
            th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: #007bff; color: white; }}
            tr:hover {{ background-color: #f1f1f1; }}
            img {{ max-width: 80px; border-radius: 5px; }}
            a {{ color: #007bff; text-decoration: none; font-weight: bold; }}
            a:hover {{ text-decoration: underline; }}
        </style>
    </head>
    <body>
        <h2>Best Prices Found For: "{product_name.capitalize()}"</h2>
"""
    
    if image_search_results:
        html_content += f"""
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>Product Reference Images</h3>
            {"".join([f'<img src="{img}" style="margin: 5px; height: 100px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">' for img in image_search_results[:5]])}
        </div>
"""

    html_content += """
        <table>
            <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Price</th>
                <th>Store</th>
                <th>Buy Link</th>
            </tr>
    """
    
    for p in products:
        html_content += f"""
            <tr>
                <td><img src="{p['image']}" alt="Product Image"></td>
                <td>{p['title']}</td>
                <td><strong style="color: green;">{p['price_str']}</strong></td>
                <td>{p['store']}</td>
                <td><a href="{p['link']}" target="_blank">View Offer</a></td>
            </tr>
        """
        
    html_content += """
        </table>
        <br>
        <div style="text-align: center;">
            <a href="/" style="padding: 10px 20px; background: #333; color: white; border-radius: 5px;">Search Another Product</a>
        </div>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)