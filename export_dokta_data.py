#!/usr/bin/env python3
"""
Export DOKTA data to JSON files for Atlas import
"""
import pymongo
import json
from datetime import datetime

def export_dokta_data():
    """Export all DOKTA collections to JSON files"""
    
    print("🏥 === EXPORT DES DONNÉES DOKTA ===")
    print()
    
    try:
        # Connexion à la base locale
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client['test_database']
        
        # Collections à exporter
        collections = ['doctors', 'appointments', 'users']
        
        for collection_name in collections:
            print(f"📦 Export collection: {collection_name}")
            
            # Récupérer les données (sans _id MongoDB)
            collection = db[collection_name]
            data = list(collection.find({}, {"_id": 0}))
            
            if not data:
                print(f"   ⚠️  Collection vide: {collection_name}")
                continue
            
            # Écrire le fichier JSON
            filename = f"/app/export_dokta/{collection_name}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
            
            print(f"   ✅ {len(data)} documents exportés → {filename}")
            
            # Afficher quelques détails
            if collection_name == 'doctors':
                specialites = {}
                for doc in data:
                    spec = doc.get('specialite', 'Non définie')
                    specialites[spec] = specialites.get(spec, 0) + 1
                print(f"      📋 Spécialités: {dict(specialites)}")
                
            elif collection_name == 'appointments':
                statuts = {}
                for appt in data:
                    statut = appt.get('status', 'Non défini')
                    statuts[statut] = statuts.get(statut, 0) + 1
                print(f"      📋 Statuts RDV: {dict(statuts)}")
                
            elif collection_name == 'users':
                types = {}
                for user in data:
                    user_type = user.get('type', 'Non défini')
                    types[user_type] = types.get(user_type, 0) + 1
                print(f"      📋 Types users: {dict(types)}")
            
            print()
        
        print("🎉 Export terminé! Fichiers créés dans /app/export_dokta/")
        print()
        print("📝 Prochaines étapes:")
        print("   1. Téléchargez les fichiers JSON")
        print("   2. Dans Atlas, cliquez sur 'Browse Collections'")
        print("   3. Créez les collections et importez les données")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur export: {e}")
        return False

if __name__ == "__main__":
    export_dokta_data()