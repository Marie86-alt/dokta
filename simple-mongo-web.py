#!/usr/bin/env python3
# Interface Web MongoDB Simple pour DOKTA
from flask import Flask, render_template_string, jsonify, request
from pymongo import MongoClient
import json
from bson import ObjectId
from datetime import datetime
import traceback

app = Flask(__name__)

# Connexion MongoDB
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['test_database']
    print("✅ Connexion MongoDB réussie!")
except Exception as e:
    print(f"❌ Erreur connexion MongoDB: {e}")

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

# Template HTML complet
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏥 DOKTA - Administration MongoDB</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .header h1 { 
            font-size: 2.5em; 
            color: #2E8B57; 
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .header p { color: #666; font-size: 1.1em; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-icon { font-size: 2.5em; margin-bottom: 10px; }
        .stat-number { 
            font-size: 2.5em; 
            font-weight: bold; 
            color: #2E8B57;
            margin-bottom: 5px;
        }
        .stat-label { color: #666; font-size: 1.1em; }
        
        .actions {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
        .actions h2 { 
            margin-bottom: 20px; 
            color: #333;
            font-size: 1.5em;
        }
        .btn-group { 
            display: flex; 
            gap: 15px; 
            flex-wrap: wrap;
            justify-content: center;
        }
        .btn {
            background: linear-gradient(135deg, #2E8B57, #27AE60);
            color: white;
            padding: 15px 25px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            font-weight: bold;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-width: 150px;
            justify-content: center;
        }
        .btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(46, 139, 87, 0.4);
        }
        .btn-secondary {
            background: linear-gradient(135deg, #3498DB, #2980B9);
        }
        .btn-danger {
            background: linear-gradient(135deg, #E74C3C, #C0392B);
        }
        
        .data-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
            display: none;
        }
        .data-section.active { display: block; }
        .data-section h2 { 
            margin-bottom: 20px;
            color: #333;
            border-bottom: 3px solid #2E8B57;
            padding-bottom: 10px;
        }
        
        .search-box {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 25px;
            font-size: 1em;
            margin-bottom: 20px;
            outline: none;
            transition: border-color 0.3s ease;
        }
        .search-box:focus { border-color: #2E8B57; }
        
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        th {
            background: linear-gradient(135deg, #2E8B57, #27AE60);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
        }
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            background: white;
        }
        tr:nth-child(even) td { background: #f8f9fa; }
        tr:hover td { background: #e8f5e8; }
        
        .badge {
            padding: 5px 10px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #cce7f0; color: #055160; }
        
        .loading {
            text-align: center;
            padding: 50px;
            font-size: 1.2em;
            color: #666;
        }
        .loading::before {
            content: '⏳';
            font-size: 2em;
            display: block;
            margin-bottom: 10px;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            border: 1px solid #f5c6cb;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            border: 1px solid #c3e6cb;
        }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .btn-group { flex-direction: column; }
            .btn { width: 100%; }
            table { font-size: 0.9em; }
            th, td { padding: 10px 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🏥 DOKTA MongoDB</h1>
            <p>Interface d'administration de la base de données</p>
        </div>
        
        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👨‍⚕️</div>
                <div class="stat-number" id="doctorsCount">-</div>
                <div class="stat-label">Médecins</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-number" id="appointmentsCount">-</div>
                <div class="stat-label">Rendez-vous</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-number" id="usersCount">-</div>
                <div class="stat-label">Utilisateurs</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-number" id="todayCount">-</div>
                <div class="stat-label">Aujourd'hui</div>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="actions">
            <h2>🔧 Actions Rapides</h2>
            <div class="btn-group">
                <button class="btn" onclick="loadData('doctors')">
                    👨‍⚕️ Voir Médecins
                </button>
                <button class="btn" onclick="loadData('appointments')">
                    📅 Voir Rendez-vous
                </button>
                <button class="btn" onclick="loadData('users')">
                    👥 Voir Utilisateurs
                </button>
                <button class="btn btn-secondary" onclick="loadData('today')">
                    📋 RDV Aujourd'hui
                </button>
                <button class="btn btn-secondary" onclick="loadStats()">
                    🔄 Actualiser
                </button>
            </div>
        </div>
        
        <!-- Data Display -->
        <div id="dataSection" class="data-section">
            <h2 id="dataTitle">Données</h2>
            <input type="text" id="searchBox" class="search-box" placeholder="🔍 Rechercher dans les données..." onkeyup="filterTable()">
            <div id="dataContent">
                <div class="loading">Chargement des données...</div>
            </div>
        </div>
    </div>

    <script>
        let currentData = [];
        
        // Charger les statistiques
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('doctorsCount').textContent = stats.doctors || 0;
                document.getElementById('appointmentsCount').textContent = stats.appointments || 0;
                document.getElementById('usersCount').textContent = stats.users || 0;
                document.getElementById('todayCount').textContent = stats.today || 0;
            } catch (error) {
                console.error('Erreur stats:', error);
            }
        }
        
        // Charger des données
        async function loadData(type) {
            const section = document.getElementById('dataSection');
            const title = document.getElementById('dataTitle');
            const content = document.getElementById('dataContent');
            
            section.classList.add('active');
            content.innerHTML = '<div class="loading">Chargement des données...</div>';
            
            const titles = {
                'doctors': '👨‍⚕️ Liste des Médecins',
                'appointments': '📅 Liste des Rendez-vous',
                'users': '👥 Liste des Utilisateurs',
                'today': '📋 Rendez-vous d\\'Aujourd\\'hui'
            };
            
            title.textContent = titles[type] || 'Données';
            
            try {
                const response = await fetch(`/api/${type}`);
                const data = await response.json();
                currentData = data;
                
                if (data.length === 0) {
                    content.innerHTML = '<div class="error">Aucune donnée trouvée</div>';
                    return;
                }
                
                let html = '<table><thead><tr>';
                
                // Définir les colonnes selon le type
                let columns = [];
                if (type === 'doctors') {
                    columns = ['nom', 'specialite', 'tarif', 'telephone', 'disponible'];
                } else if (type === 'appointments' || type === 'today') {
                    columns = ['patient_name', 'date', 'heure', 'time', 'consultation_type', 'status', 'price'];
                } else if (type === 'users') {
                    columns = ['nom', 'telephone', 'type'];
                }
                
                // Entêtes du tableau
                columns.forEach(col => {
                    html += `<th>${col.replace('_', ' ').toUpperCase()}</th>`;
                });
                html += '</tr></thead><tbody>';
                
                // Lignes des données
                data.forEach(row => {
                    html += '<tr>';
                    columns.forEach(col => {
                        let value = row[col] || '-';
                        
                        // Formatage spécial
                        if (col === 'tarif' || col === 'price') {
                            value = value !== '-' ? value + ' FCFA' : '-';
                        } else if (col === 'disponible') {
                            value = value ? '<span class="badge badge-success">OUI</span>' : '<span class="badge badge-danger">NON</span>';
                        } else if (col === 'status') {
                            const badgeClass = value === 'confirmed' ? 'badge-success' : 'badge-warning';
                            value = `<span class="badge ${badgeClass}">${value}</span>`;
                        }
                        
                        html += `<td>${value}</td>`;
                    });
                    html += '</tr>';
                });
                
                html += '</tbody></table>';
                content.innerHTML = html;
                
            } catch (error) {
                console.error('Erreur chargement:', error);
                content.innerHTML = '<div class="error">Erreur lors du chargement des données</div>';
            }
        }
        
        // Filtrer le tableau
        function filterTable() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase();
            const rows = document.querySelectorAll('#dataContent tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }
        
        // Charger les stats au démarrage
        loadStats();
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/stats')
def api_stats():
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        stats = {
            'doctors': db.doctors.count_documents({}),
            'appointments': db.appointments.count_documents({}),
            'users': db.users.count_documents({}),
            'today': db.appointments.count_documents({'date': today})
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/doctors')
def api_doctors():
    try:
        docs = list(db.doctors.find({}, {'_id': 0}))
        return json.dumps(docs, cls=JSONEncoder)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/appointments')
def api_appointments():
    try:
        docs = list(db.appointments.find({}, {'_id': 0}).limit(50).sort('created_at', -1))
        return json.dumps(docs, cls=JSONEncoder)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users')
def api_users():
    try:
        docs = list(db.users.find({}, {'_id': 0}))
        return json.dumps(docs, cls=JSONEncoder)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/today')
def api_today():
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        docs = list(db.appointments.find({'date': today}, {'_id': 0}))
        return json.dumps(docs, cls=JSONEncoder)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🏥 Interface MongoDB DOKTA démarrée!")
    print("🌐 Accès: http://0.0.0.0:8083")
    app.run(host='0.0.0.0', port=8083, debug=True)