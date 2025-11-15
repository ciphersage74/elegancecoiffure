import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
from src.main import app

print(f'Static folder: {app.static_folder}')
print(f'Exists: {os.path.exists(app.static_folder) if app.static_folder else False}')
if app.static_folder and os.path.exists(app.static_folder):
    print(f'Files: {os.listdir(app.static_folder)}')
    index_path = os.path.join(app.static_folder, 'index.html')
    print(f'Index path: {index_path}')
    print(f'Index exists: {os.path.exists(index_path)}')
