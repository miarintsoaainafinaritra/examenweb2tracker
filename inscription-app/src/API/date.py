from flask import Flask, jsonify, request # type: ignore
from flask_cors import CORS # type: ignore
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Active CORS pour permettre les requêtes depuis React

# Initialisation de la base de données
def init_db():
    conn = sqlite3.connect('moneytracker.db')
    c = conn.cursor()
    
    # Table des utilisateurs
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Table des transactions
    c.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            category TEXT,
            type TEXT CHECK(type IN ('income', 'expense')),
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Routes de l'API
@app.route('/')
def home():
    return jsonify({"message": "Bienvenue sur MoneyTracker API"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = sqlite3.connect('moneytracker.db')
    c = conn.cursor()
    
    c.execute('SELECT id, username FROM users WHERE username = ? AND password = ?', 
              (username, password))
    user = c.fetchone()
    
    conn.close()
    
    if user:
        return jsonify({
            "success": True,
            "user": {
                "id": user[0],
                "username": user[1]
            }
        })
    else:
        return jsonify({
            "success": False,
            "message": "Identifiants invalides"
        }), 401

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = sqlite3.connect('moneytracker.db')
    c = conn.cursor()
    
    try:
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', 
                 (username, password))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        
        return jsonify({
            "success": True,
            "user": {
                "id": user_id,
                "username": username
            }
        })
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Nom d'utilisateur déjà existant"
        }), 400

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    user_id = request.args.get('user_id')
    
    conn = sqlite3.connect('moneytracker.db')
    c = conn.cursor()
    
    c.execute('''
        SELECT id, amount, description, category, type, date 
        FROM transactions 
        WHERE user_id = ?
        ORDER BY date DESC
    ''', (user_id,))
    
    transactions = []
    for row in c.fetchall():
        transactions.append({
            "id": row[0],
            "amount": row[1],
            "description": row[2],
            "category": row[3],
            "type": row[4],
            "date": row[5]
        })
    
    conn.close()
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.get_json()
    user_id = data.get('user_id')
    amount = data.get('amount')
    description = data.get('description')
    category = data.get('category')
    transaction_type = data.get('type')
    
    conn = sqlite3.connect('moneytracker.db')
    c = conn.cursor()
    
    c.execute('''
        INSERT INTO transactions (user_id, amount, description, category, type)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, amount, description, category, transaction_type))
    
    conn.commit()
    transaction_id = c.lastrowid
    conn.close()
    
    return jsonify({
        "success": True,
        "transaction_id": transaction_id
    })

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    conn = sqlite3.connect('moneytracker.db')
    c = conn.cursor()
    
    c.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/summary/<int:user_id>')
def get_summary(user_id):
    conn = sqlite3.connect('moneytracker.db')
    c = conn.cursor()
    
    # Calcul du total des revenus
    c.execute('SELECT SUM(amount) FROM transactions WHERE user_id = ? AND type = "income"', (user_id,))
    total_income = c.fetchone()[0] or 0
    
    # Calcul du total des dépenses
    c.execute('SELECT SUM(amount) FROM transactions WHERE user_id = ? AND type = "expense"', (user_id,))
    total_expense = c.fetchone()[0] or 0
    
    # Solde actuel
    balance = total_income - total_expense
    
    # Dépenses par catégorie
    c.execute('''
        SELECT category, SUM(amount) 
        FROM transactions 
        WHERE user_id = ? AND type = "expense" 
        GROUP BY category
    ''', (user_id,))
    
    expenses_by_category = []
    for row in c.fetchall():
        expenses_by_category.append({
            "category": row[0],
            "amount": row[1]
        })
    
    conn.close()
    
    return jsonify({
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": balance,
        "expenses_by_category": expenses_by_category
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True)