from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib

app = Flask(__name__)
CORS(app)  # Permite peticiones desde el frontend estático


# ─── Base de datos ───────────────────────────────────────────────────────────

def get_conn():
    """Retorna una conexión con row_factory para acceder por nombre de columna."""
    conn = sqlite3.connect('semed.db')
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    cursor = conn.cursor()

    # Tabla principal de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre        TEXT NOT NULL,
            apellido      TEXT,
            email         TEXT UNIQUE NOT NULL,
            telefono      TEXT,
            area          TEXT NOT NULL,
            ubicacion     TEXT,
            descripcion   TEXT,
            foto_perfil   TEXT,
            password      TEXT NOT NULL
        )
    ''')

    # Migración: agregar columnas nuevas si la tabla ya existía sin ellas
    columnas_nuevas = {
        "apellido":    "TEXT",
        "ubicacion":   "TEXT",
        "descripcion": "TEXT",
        "foto_perfil": "TEXT",
    }
    cursor.execute("PRAGMA table_info(usuarios)")
    columnas_existentes = {row["name"] for row in cursor.fetchall()}

    for col, tipo in columnas_nuevas.items():
        if col not in columnas_existentes:
            cursor.execute(f"ALTER TABLE usuarios ADD COLUMN {col} {tipo}")
            print(f"[DB] Columna '{col}' agregada a la tabla usuarios.")

    conn.commit()
    conn.close()


# ─── Registro ────────────────────────────────────────────────────────────────

@app.route('/registro', methods=['POST'])
def registro():
    datos = request.json
    pass_encriptada = hashlib.sha256(datos['password'].encode()).hexdigest()

    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO usuarios (nombre, email, telefono, area, password)
            VALUES (?, ?, ?, ?, ?)
        ''', (datos['nombre'], datos['email'], datos.get('telefono'), datos['area'], pass_encriptada))
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Registro exitoso"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "El correo ya está registrado"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Login ───────────────────────────────────────────────────────────────────

@app.route('/login', methods=['POST'])
def login():
    datos = request.json
    pass_encriptada = hashlib.sha256(datos['password'].encode()).hexdigest()

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, nombre, area, email FROM usuarios WHERE email = ? AND password = ?',
        (datos['email'], pass_encriptada)
    )
    usuario = cursor.fetchone()
    conn.close()

    if usuario:
        return jsonify({
            "mensaje": "Login exitoso",
            "usuario": {
                "nombre": usuario["nombre"],
                "area":   usuario["area"],
                "email":  usuario["email"]   # necesario para identificar al usuario en perfil.js
            }
        }), 200
    else:
        return jsonify({"error": "Credenciales inválidas"}), 401


# ─── Perfil: obtener ─────────────────────────────────────────────────────────

@app.route('/perfil', methods=['GET'])
def obtener_perfil():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email requerido"}), 400

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT nombre, apellido, email, telefono, area, ubicacion, descripcion, foto_perfil '
        'FROM usuarios WHERE email = ?',
        (email,)
    )
    usuario = cursor.fetchone()
    conn.close()

    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({"usuario": dict(usuario)}), 200


# ─── Perfil: actualizar datos básicos ────────────────────────────────────────

@app.route('/perfil', methods=['PUT'])
def actualizar_perfil():
    datos = request.json
    email = datos.get('email')
    if not email:
        return jsonify({"error": "Email requerido"}), 400

    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE usuarios
               SET nombre      = ?,
                   apellido    = ?,
                   telefono    = ?,
                   ubicacion   = ?,
                   descripcion = ?
             WHERE email = ?
        ''', (
            datos.get('nombre'),
            datos.get('apellido'),
            datos.get('telefono'),
            datos.get('ubicacion'),
            datos.get('descripcion'),
            email
        ))
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Usuario no encontrado"}), 404
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Perfil actualizado correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Perfil: actualizar foto ──────────────────────────────────────────────────

@app.route('/perfil/foto', methods=['PUT'])
def actualizar_foto():
    datos = request.json
    email = datos.get('email')
    foto  = datos.get('foto_perfil')  # base64 data URI

    if not email or not foto:
        return jsonify({"error": "Email y foto requeridos"}), 400

    # Límite de tamaño: ~2 MB en base64
    if len(foto) > 2_800_000:
        return jsonify({"error": "La imagen es demasiado grande. Máximo 2 MB"}), 400

    try:
        conn = get_conn()
        cursor = conn.cursor()
        cursor.execute('UPDATE usuarios SET foto_perfil = ? WHERE email = ?', (foto, email))
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"error": "Usuario no encontrado"}), 404
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Foto actualizada"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Perfil: cambiar correo ───────────────────────────────────────────────────

@app.route('/perfil/email', methods=['PUT'])
def actualizar_email():
    datos        = request.json
    email_actual = datos.get('email_actual')
    email_nuevo  = datos.get('email_nuevo')
    password     = datos.get('password')

    if not all([email_actual, email_nuevo, password]):
        return jsonify({"error": "Todos los campos son requeridos"}), 400

    pass_encriptada = hashlib.sha256(password.encode()).hexdigest()

    try:
        conn = get_conn()
        cursor = conn.cursor()

        # Verificar credenciales actuales
        cursor.execute(
            'SELECT id FROM usuarios WHERE email = ? AND password = ?',
            (email_actual, pass_encriptada)
        )
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "Contraseña incorrecta"}), 401

        # Verificar que el nuevo correo no esté en uso
        cursor.execute('SELECT id FROM usuarios WHERE email = ?', (email_nuevo,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Ese correo ya está en uso"}), 400

        cursor.execute(
            'UPDATE usuarios SET email = ? WHERE email = ?',
            (email_nuevo, email_actual)
        )
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Correo actualizado correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Perfil: cambiar contraseña ───────────────────────────────────────────────

@app.route('/perfil/contrasena', methods=['PUT'])
def actualizar_contrasena():
    datos            = request.json
    email            = datos.get('email')
    password_actual  = datos.get('password_actual')
    password_nueva   = datos.get('password_nueva')

    if not all([email, password_actual, password_nueva]):
        return jsonify({"error": "Todos los campos son requeridos"}), 400

    if len(password_nueva) < 8:
        return jsonify({"error": "La contraseña debe tener al menos 8 caracteres"}), 400

    pass_actual_hash = hashlib.sha256(password_actual.encode()).hexdigest()
    pass_nueva_hash  = hashlib.sha256(password_nueva.encode()).hexdigest()

    try:
        conn = get_conn()
        cursor = conn.cursor()

        # Verificar contraseña actual
        cursor.execute(
            'SELECT id FROM usuarios WHERE email = ? AND password = ?',
            (email, pass_actual_hash)
        )
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": "La contraseña actual es incorrecta"}), 401

        cursor.execute(
            'UPDATE usuarios SET password = ? WHERE email = ?',
            (pass_nueva_hash, email)
        )
        conn.commit()
        conn.close()
        return jsonify({"mensaje": "Contraseña actualizada correctamente"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
