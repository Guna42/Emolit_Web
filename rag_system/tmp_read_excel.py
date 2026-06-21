import pandas as pd
import os

file_path = "c:/Users/GUNA/Videos/Emolit/rag_system/data/Emotion regulation techniques_clinical & Daily use.xlsx"
if os.path.exists(file_path):
    try:
        df = pd.read_excel(file_path)
        print(df.to_string())
    except Exception as e:
        print(f"Error reading file: {e}")
else:
    print(f"File not found: {file_path}")
