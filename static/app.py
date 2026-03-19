from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib

app = Flask(__name__)
CORS(app) # Permite peticiones desde tu frontend estático

# Función para inicializar la base de datos
def init_db():
    conn = sqlite3.connect('semed.db')
    cursor = conn.cursor()
    # Script SQL para crear la tabla de usuarios
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
    conn.commit()
    conn.close()

# Endpoint para registrar usuarios
@app.route('/registro', methods=['POST'])
def registro():
    datos = request.json
    
    # Encriptación básica de la contraseña por seguridad
    pass_encriptada = hashlib.sha256(datos['password'].encode()).hexdigest()
    
    try:
        conn = sqlite3.connect('semed.db')
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

# Endpoint para iniciar sesión
@app.route('/login', methods=['POST'])
def login():
    datos = request.json
    pass_encriptada = hashlib.sha256(datos['password'].encode()).hexdigest()
    
    conn = sqlite3.connect('semed.db')
    cursor = conn.cursor()
    # Consulta SQL para validar credenciales
    cursor.execute('SELECT id, nombre, area FROM usuarios WHERE email = ? AND password = ?', 
                   (datos['email'], pass_encriptada))
    usuario = cursor.fetchone()
    conn.close()
    
    if usuario:
        return jsonify({"mensaje": "Login exitoso", "usuario": {"nombre": usuario[1], "area": usuario[2]}}), 200
    else:
        return jsonify({"error": "Credenciales inválidas"}), 401

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)