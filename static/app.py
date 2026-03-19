from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
import os

app = Flask(__name__)
CORS(app) 

# ==========================================
# 1. CONFIGURACIÓN DE RUTAS ABSOLUTAS
# ==========================================
# Esto garantiza que la base de datos siempre se cree junto a este archivo app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'semed.db')

# ==========================================
# 2. INICIALIZACIÓN DE BASE DE DATOS
# ==========================================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            telefono TEXT,
            area TEXT NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medicamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            lote TEXT NOT NULL,
            presentacion TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            laboratorio TEXT NOT NULL,
            registro_invima TEXT NOT NULL,
            fecha_vencimiento TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# ==========================================
# 3. ENDPOINTS (Rutas de la API)
# ==========================================
@app.route('/registro', methods=['POST'])
def registro():
    datos = request.json
    pass_encriptada = hashlib.sha256(datos['password'].encode()).hexdigest()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO usuarios (nombre, email, telefono, area, password) 
            VALUES (?, ?, ?, ?, ?)
        ''', (datos['nombre'], datos['email'], datos['telefono'], datos['area'], pass_encriptada))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Registro exitoso"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "El correo ya está registrado"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    datos = request.json
    pass_encriptada = hashlib.sha256(datos['password'].encode()).hexdigest()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, nombre, area FROM usuarios WHERE email = ? AND password = ?', 
                   (datos['email'], pass_encriptada))
    usuario = cursor.fetchone()
    conn.close()
    if usuario:
        return jsonify({"mensaje": "Login exitoso", "usuario": {"nombre": usuario[1], "area": usuario[2]}}), 200
    else:
        return jsonify({"error": "Credenciales inválidas"}), 401

@app.route('/registrar_medicamento', methods=['POST'])
def registrar_medicamento():
    datos = request.json
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO medicamentos (nombre, lote, presentacion, cantidad, laboratorio, registro_invima, fecha_vencimiento) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (datos['nombre'], datos['lote'], datos['presentacion'], datos['cantidad'], 
              datos['laboratorio'], datos['registro_invima'], datos['fecha_vencimiento']))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Medicamento registrado con éxito"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/medicamentos', methods=['GET'])
def obtener_medicamentos():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM medicamentos')
        filas = cursor.fetchall()
        conn.close()
        
        lista_medicamentos = [dict(fila) for fila in filas]
        return jsonify(lista_medicamentos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)