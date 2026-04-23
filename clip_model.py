import sys
import json
import torch
import clip
from PIL import Image

import os
import pandas as pd

def main():
    # 1. Read image path from command line arguments (passed by Node.js child_process)
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided."}))
        sys.exit(1)
        
    image_path = sys.argv[1]

    # 2. Load product categories from the Kaggle dataset
    dataset_dir = r"C:\Users\Admin\OneDrive\Desktop\Shopsmart\dataset_nameofproduct"
    product_labels = []
    
    try:
        # Find the CSV file in the dataset directory
        csv_files = [f for f in os.listdir(dataset_dir) if f.endswith('.csv')]
        if csv_files:
            csv_path = os.path.join(dataset_dir, csv_files[0])
            df = pd.read_csv(csv_path)
            
            # Try to find a column that likely contains product names or categories
            target_cols = ['product_name', 'name', 'category', 'title']
            col = next((c for c in target_cols if c in df.columns.str.lower()), df.columns[0])
            col_exact = next(c for c in df.columns if c.lower() == col)
            
            # Get unique values and drop NaNs
            unique_items = df[col_exact].dropna().unique().tolist()
            
            # Clean up and limit length to avoid CLIP token limit errors (77 tokens max)
            product_labels = [str(item)[:60] for item in unique_items]
        else:
            raise FileNotFoundError("No CSV file found in dataset directory.")
            
    except Exception as e:
        # Fallback to default if dataset fails to load
        product_labels = [
            "a smartphone", "a laptop", "a pair of sneakers", 
            "a wrist watch", "a coffee mug", "a t-shirt", 
            "a pair of sunglasses", "a backpack", "a camera",
            "a pair of headphones", "a gaming console", "a television",
            "a bottle of perfume", "a pair of jeans", "a computer mouse"
        ]

    try:
        # 3. Load the CLIP model
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model, preprocess = clip.load("ViT-B/32", device=device)
        
        # 4. Preprocess the uploaded image
        image = preprocess(Image.open(image_path)).unsqueeze(0).to(device)
        
        # 5. Process text in batches to prevent Out-Of-Memory errors with large datasets
        batch_size = 256
        text_features_list = []
        
        with torch.no_grad():
            image_features = model.encode_image(image)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
            for i in range(0, len(product_labels), batch_size):
                batch_labels = product_labels[i:i+batch_size]
                text_tokens = clip.tokenize(batch_labels, truncate=True).to(device)
                text_features = model.encode_text(text_tokens)
                text_features /= text_features.norm(dim=-1, keepdim=True)
                text_features_list.append(text_features)
                
            all_text_features = torch.cat(text_features_list, dim=0)
            
            # Compute similarity percentage
            similarity = (100.0 * image_features @ all_text_features.T).softmax(dim=-1)
            probs = similarity[0].cpu().numpy()
            
        # Pair labels with their similarity scores and sort them
        results = []
        for label, prob in zip(product_labels, probs):
            results.append({
                "product": label,
                "similarity_score": float(prob)
            })
            
        # Sort by similarity score descending (highest match first)
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # 7. Return the top matching text labels
        output = {
            "success": True,
            "top_match": results[0]["product"],
            "all_predictions": results[:5]  # Returning the top 5 matches
        }
        
        # Print the JSON output to stdout so Node.js can capture it
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()