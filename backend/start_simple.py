"""
Script simple para iniciar el servidor backend sin problemas de importación
"""
import os
import sys

# Cambiar al directorio del proyecto raíz
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(project_root)

# Ejecutar uvicorn desde el directorio raíz
os.system("python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000")
