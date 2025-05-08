import json
import os

def load_json_file(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return None

def save_json_file(file_path, data):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
