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

HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>DOKTA MongoDB Admin</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        .header { background: #2E8B57; color: white; padding: 20px; text-align: center; border-radius: 10px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: white; padding: 20px; flex: 1; text-align: center; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #2E8B57; }
        .buttons { margin: 20px 0; text-align: center; }
        .btn { background: #2E8B57; color: white; padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
        .btn:hover { background: #27AE60; }
        .data { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 DOKTA - Administration MongoDB</h1>
        <p>Interface simple pour gérer votre base de données</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-number" id="doctorsCount">-</div>
            <div>👨‍⚕️ Médecins</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="appointmentsCount">-</div>
            <div>📅 Rendez-vous</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="usersCount">-</div>
            <div>👥 Utilisateurs</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="todayCount">-</div>
            <div>📋 Aujourd'hui</div>
        </div>
    </div>
    
    <div class="buttons">
        <button class="btn" onclick="loadDoctors()">👨‍⚕️ Médecins</button>
        <button class="btn" onclick="loadAppointments()">📅 Rendez-vous</button>
        <button class="btn" onclick="loadUsers()">👥 Utilisateurs</button>
        <button class="btn" onclick="loadToday()">📋 Aujourd'hui</button>
        <button class="btn" onclick="loadStats()">🔄 Actualiser</button>
    </div>
    
    <div id="dataSection" class="data hidden">
        <h3 id="dataTitle">Données</h3>
        <div id="dataContent"></div>
    </div>

    <script>
        function loadStats() {
            fetch('/stats')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('doctorsCount').textContent = data.doctors;
                    document.getElementById('appointmentsCount').textContent = data.appointments;
                    document.getElementById('usersCount').textContent = data.users;
                    document.getElementById('todayCount').textContent = data.today;
                });
        }
        
        function loadDoctors() {
            showSection('👨‍⚕️ Médecins');
            fetch('/doctors')
                .then(r => r.json())
                .then(data => showTable(data, ['nom', 'specialite', 'tarif', 'telephone', 'disponible']));
        }
        
        function loadAppointments() {
            showSection('📅 Rendez-vous');
            fetch('/appointments')
                .then(r => r.json())
                .then(data => showTable(data, ['patient_name', 'date', 'heure', 'time', 'status', 'consultation_type']));
        }
        
        function loadUsers() {
            showSection('👥 Utilisateurs');
            fetch('/users')
                .then(r => r.json())
                .then(data => showTable(data, ['nom', 'telephone', 'type']));
        }
        
        function loadToday() {
            showSection('📋 Rendez-vous d\\'aujourd\\'hui');
            fetch('/today')
                .then(r => r.json())
                .then(data => showTable(data, ['patient_name', 'heure', 'time', 'consultation_type', 'status']));
        }
        
        function showSection(title) {
            document.getElementById('dataTitle').textContent = title;
            document.getElementById('dataSection').classList.remove('hidden');
            document.getElementById('dataContent').innerHTML = '⏳ Chargement...';
        }
        
        function showTable(data, columns) {
            if (!data || data.length === 0) {
                document.getElementById('dataContent').innerHTML = 'Aucune donnée trouvée';
                return;
            }
            
            let html = '<table><thead><tr>';
            columns.forEach(col => html += `<th>${col}</th>`);
            html += '</tr></thead><tbody>';
            
            data.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    let value = row[col] || '-';
                    if (col === 'tarif') value = value + ' FCFA';
                    if (col === 'disponible') value = value ? '✅' : '❌';
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            document.getElementById('dataContent').innerHTML = html;
        }
        
        loadStats();
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML)

@app.route('/stats')
def stats():
    today = datetime.now().strftime('%Y-%m-%d')
    return jsonify({
        'doctors': db.doctors.count_documents({}),
        'appointments': db.appointments.count_documents({}),
        'users': db.users.count_documents({}),
        'today': db.appointments.count_documents({'date': today})
    })

@app.route('/doctors')
def doctors():
    docs = list(db.doctors.find({}, {'_id': 0}))
    return json.dumps(docs, cls=JSONEncoder)

@app.route('/appointments')
def appointments():
    docs = list(db.appointments.find({}, {'_id': 0}).limit(20).sort('created_at', -1))
    return json.dumps(docs, cls=JSONEncoder)

@app.route('/users')
def users():
    docs = list(db.users.find({}, {'_id': 0}))
    return json.dumps(docs, cls=JSONEncoder)

@app.route('/today')
def today():
    today_date = datetime.now().strftime('%Y-%m-%d')
    docs = list(db.appointments.find({'date': today_date}, {'_id': 0}))
    return json.dumps(docs, cls=JSONEncoder)

if __name__ == '__main__':
    print("🏥 DOKTA MongoDB Admin lancé!")
    print("🌐 URL: http://0.0.0.0:8083")
    app.run(host='0.0.0.0', port=8083, debug=False)