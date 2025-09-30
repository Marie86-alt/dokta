from flask import Flask, render_template_string, jsonify
from pymongo import MongoClient
import json
from bson import ObjectId
from datetime import datetime

app = Flask(__name__)
client = MongoClient('mongodb://localhost:27017/')
db = client['test_database']

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>DOKTA - Base de Données</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #2E8B57; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
        .logo { font-size: 2em; margin-bottom: 10px; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .stat-card { background: white; padding: 20px; border-radius: 10px; flex: 1; min-width: 200px; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #2E8B57; }
        .section { background: white; margin: 20px 0; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .btn { background: #2E8B57; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; font-size: 14px; }
        .btn:hover { background: #27AE60; }
        .btn-secondary { background: #3498DB; }
        .btn-secondary:hover { background: #2980B9; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; color: #2E8B57; }
        .hidden { display: none; }
        .refresh-btn { float: right; }
        .loading { color: #3498DB; font-style: italic; }
        .no-data { color: #999; text-align: center; padding: 20px; }
        .search-box { margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; width: 300px; }
        .filters { margin: 15px 0; }
        .filter-btn { background: #E8F5E8; color: #2E8B57; padding: 8px 15px; border: 1px solid #2E8B57; border-radius: 20px; margin: 3px; cursor: pointer; }
        .filter-btn.active { background: #2E8B57; color: white; }
        .data-count { color: #666; font-size: 0.9em; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏥 DOKTA</div>
            <h1>Interface de Gestion MongoDB</h1>
            <p>Santé digitale - Base de données Cameroun</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="doctorsCount">-</div>
                <div>👨‍⚕️ Médecins</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="appointmentsCount">-</div>
                <div>📅 Rendez-vous</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="usersCount">-</div>
                <div>👥 Utilisateurs</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="todayAppointments">-</div>
                <div>📋 Aujourd'hui</div>
            </div>
        </div>
        
        <div class="section">
            <h2>🔍 Explorer les Données</h2>
            <button class="btn" onclick="loadDoctors()">👨‍⚕️ Voir Médecins</button>
            <button class="btn" onclick="loadAppointments()">📅 Voir Rendez-vous</button>
            <button class="btn" onclick="loadUsers()">👥 Voir Utilisateurs</button>
            <button class="btn btn-secondary" onclick="loadTodayAppointments()">📋 RDV d'Aujourd'hui</button>
            <button class="btn refresh-btn" onclick="loadStats()">🔄 Actualiser Stats</button>
        </div>
        
        <div id="dataSection" class="section hidden">
            <h2 id="dataTitle">Données</h2>
            <div class="data-count" id="dataCount"></div>
            <input type="text" id="searchBox" class="search-box hidden" placeholder="🔍 Rechercher..." onkeyup="filterData()">
            <div class="filters" id="filtersSection"></div>
            <div id="dataContent"></div>
        </div>
    </div>

    <script>
        let currentData = [];
        let currentColumns = [];
        
        function loadStats() {
            fetch('/api/stats')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('doctorsCount').textContent = data.doctors;
                    document.getElementById('appointmentsCount').textContent = data.appointments;
                    document.getElementById('usersCount').textContent = data.users;
                    document.getElementById('todayAppointments').textContent = data.today_appointments;
                })
                .catch(err => console.error('Erreur stats:', err));
        }
        
        function loadDoctors() {
            showLoading('👨‍⚕️ Médecins');
            fetch('/api/doctors')
                .then(r => r.json())
                .then(data => {
                    currentData = data;
                    currentColumns = ['nom', 'specialite', 'experience', 'tarif', 'telephone', 'disponible'];
                    showTable('👨‍⚕️ Médecins', data, currentColumns);
                    showFilters(['specialite'], data);
                });
        }
        
        function loadAppointments() {
            showLoading('📅 Rendez-vous');
            fetch('/api/appointments')
                .then(r => r.json())
                .then(data => {
                    currentData = data;
                    currentColumns = ['patient_name', 'date', 'heure', 'time', 'status', 'consultation_type', 'price'];
                    showTable('📅 Rendez-vous', data, currentColumns);
                    showFilters(['status', 'consultation_type'], data);
                });
        }
        
        function loadUsers() {
            showLoading('👥 Utilisateurs');
            fetch('/api/users')
                .then(r => r.json())
                .then(data => {
                    currentData = data;
                    currentColumns = ['nom', 'telephone', 'type', 'created_at'];
                    showTable('👥 Utilisateurs', data, currentColumns);
                    showFilters(['type'], data);
                });
        }
        
        function loadTodayAppointments() {
            showLoading('📋 Rendez-vous d\\'aujourd\\'hui');
            const today = new Date().toISOString().split('T')[0];
            fetch('/api/appointments/today')
                .then(r => r.json())
                .then(data => {
                    currentData = data;
                    currentColumns = ['patient_name', 'heure', 'time', 'consultation_type', 'status', 'price'];
                    showTable('📋 Rendez-vous d\\'aujourd\\'hui', data, currentColumns);
                });
        }
        
        function showLoading(title) {
            document.getElementById('dataTitle').textContent = title;
            document.getElementById('dataContent').innerHTML = '<div class="loading">⏳ Chargement des données...</div>';
            document.getElementById('dataSection').classList.remove('hidden');
            document.getElementById('searchBox').classList.add('hidden');
        }
        
        function showTable(title, data, columns) {
            document.getElementById('dataTitle').textContent = title;
            document.getElementById('dataCount').textContent = `${data.length} enregistrement(s)`;
            
            if (data.length === 0) {
                document.getElementById('dataContent').innerHTML = '<div class="no-data">Aucune donnée trouvée</div>';
                return;
            }
            
            let html = '<table id="dataTable"><thead><tr>';
            columns.forEach(col => {
                let displayName = col.replace('_', ' ');
                html += `<th>${displayName}</th>`;
            });
            html += '</tr></thead><tbody>';
            
            data.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    let value = row[col] || '-';
                    if (col === 'tarif' || col === 'price') value = (value !== '-' ? value + ' FCFA' : '-');
                    if (col === 'disponible') value = value ? '✅ Oui' : '❌ Non';
                    if (col === 'created_at' && value !== '-') value = new Date(value).toLocaleDateString('fr-FR');
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            document.getElementById('dataContent').innerHTML = html;
            document.getElementById('dataSection').classList.remove('hidden');
            document.getElementById('searchBox').classList.remove('hidden');
            document.getElementById('searchBox').value = '';
        }
        
        function showFilters(filterFields, data) {
            if (!filterFields || filterFields.length === 0) return;
            
            let filtersHtml = '';
            filterFields.forEach(field => {
                const uniqueValues = [...new Set(data.map(item => item[field]).filter(v => v))];
                if (uniqueValues.length > 1) {
                    filtersHtml += `<div style="margin-bottom: 10px;">`;
                    filtersHtml += `<strong>${field}: </strong>`;
                    filtersHtml += `<span class="filter-btn active" onclick="filterByField('${field}', 'all')">Tous</span>`;
                    uniqueValues.forEach(value => {
                        filtersHtml += `<span class="filter-btn" onclick="filterByField('${field}', '${value}')">${value}</span>`;
                    });
                    filtersHtml += `</div>`;
                }
            });
            document.getElementById('filtersSection').innerHTML = filtersHtml;
        }
        
        function filterByField(field, value) {
            // Mettre à jour les boutons actifs
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            let filteredData = currentData;
            if (value !== 'all') {
                filteredData = currentData.filter(item => item[field] === value);
            }
            
            const title = document.getElementById('dataTitle').textContent;
            showTable(title, filteredData, currentColumns);
        }
        
        function filterData() {
            const searchTerm = document.getElementById('searchBox').value.toLowerCase();
            const rows = document.querySelectorAll('#dataTable tbody tr');
            let visibleCount = 0;
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });
            
            document.getElementById('dataCount').textContent = `${visibleCount} résultat(s) affiché(s)`;
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
def stats():
    today = datetime.now().strftime('%Y-%m-%d')
    return jsonify({
        'doctors': db.doctors.count_documents({}),
        'appointments': db.appointments.count_documents({}),
        'users': db.users.count_documents({}),
        'today_appointments': db.appointments.count_documents({'date': today})
    })

@app.route('/api/doctors')
def doctors():
    docs = list(db.doctors.find({}, {'_id': 0}))
    return json.dumps(docs, cls=JSONEncoder)

@app.route('/api/appointments')
def appointments():
    docs = list(db.appointments.find({}, {'_id': 0}).limit(100).sort('created_at', -1))
    return json.dumps(docs, cls=JSONEncoder)

@app.route('/api/appointments/today')
def appointments_today():
    today = datetime.now().strftime('%Y-%m-%d')
    docs = list(db.appointments.find({'date': today}, {'_id': 0}))
    return json.dumps(docs, cls=JSONEncoder)

@app.route('/api/users')
def users():
    docs = list(db.users.find({}, {'_id': 0}))
    return json.dumps(docs, cls=JSONEncoder)

if __name__ == '__main__':
    print("🏥 DOKTA MongoDB Interface démarrée!")
    print("📍 URL d'accès: http://localhost:8082")
    print("🔧 API Stats: http://localhost:8082/api/stats")
    app.run(host='0.0.0.0', port=8082, debug=True)