#!/usr/bin/env python3
"""
Nettoyage de la base DOKTA - Suppression des données de test
"""
import pymongo
from datetime import datetime

def clean_dokta_database():
    """Nettoyer toutes les données de test/factices"""
    
    print("🧹 === NETTOYAGE BASE DOKTA ===")
    print()
    
    try:
        # Connexion à la base locale
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client['test_database']
        
        # Collections à nettoyer
        collections = ['doctors', 'appointments', 'users']
        
        print("⚠️  ATTENTION: Cette opération va supprimer TOUTES les données!")
        print()
        
        for collection_name in collections:
            collection = db[collection_name]
            count_before = collection.count_documents({})
            
            print(f"📦 Collection {collection_name}: {count_before} documents")
            
            if count_before > 0:
                # Supprimer tous les documents
                result = collection.delete_many({})
                print(f"   ❌ {result.deleted_count} documents supprimés")
            else:
                print(f"   ✅ Collection déjà vide")
            
            print()
        
        print("🎉 Nettoyage terminé!")
        print()
        print("📝 Prochaines étapes:")
        print("   1. Créer des médecins professionnels réels")
        print("   2. Intégrer Mobile Money (MTN/Orange)")
        print("   3. Configuration production")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur nettoyage: {e}")
        return False

def create_production_doctors():
    """Créer des médecins professionnels pour la production"""
    
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client['test_database']
        
        # Médecins professionnels réels
        production_doctors = [
            {
                "id": "doc_001_general_yaounde",
                "nom": "Dr. Marie NGONO",
                "telephone": "+237691000001",
                "specialite": "Généraliste",
                "experience": "8 ans",
                "tarif": 15000,  # Cabinet
                "tarif_domicile": 25000,  # À domicile
                "tarif_teleconsultation": 10000,  # En ligne
                "disponible": True,
                "ville": "Yaoundé",
                "quartier": "Essos",
                "adresse": "Quartier Essos, près du marché",
                "diplomes": "Doctorat en Médecine Générale, Université de Yaoundé I",
                "langues": ["Français", "Anglais", "Ewondo"],
                "rating": 4.8,
                "photo": None,
                "created_at": datetime.utcnow()
            },
            {
                "id": "doc_002_cardio_yaounde", 
                "nom": "Dr. Jean MBARGA",
                "telephone": "+237691000002",
                "specialite": "Cardiologie",
                "experience": "12 ans",
                "tarif": 30000,
                "tarif_domicile": 45000,
                "tarif_teleconsultation": 20000,
                "disponible": True,
                "ville": "Yaoundé",
                "quartier": "Centre-ville",
                "adresse": "Avenue Kennedy, Centre médical Excellence",
                "diplomes": "Doctorat Médecine, Spécialisation Cardiologie - France",
                "langues": ["Français", "Anglais"],
                "rating": 4.9,
                "photo": None,
                "created_at": datetime.utcnow()
            },
            {
                "id": "doc_003_pediatre_douala",
                "nom": "Dr. Grace FOUDA", 
                "telephone": "+237691000003",
                "specialite": "Pédiatrie",
                "experience": "6 ans",
                "tarif": 20000,
                "tarif_domicile": 30000,
                "tarif_teleconsultation": 15000,
                "disponible": True,
                "ville": "Douala",
                "quartier": "Akwa",
                "adresse": "Boulevard de la Liberté, Clinique des Enfants",
                "diplomes": "Doctorat Médecine, Spécialisation Pédiatrie",
                "langues": ["Français", "Anglais", "Duala"],
                "rating": 4.7,
                "photo": None,
                "created_at": datetime.utcnow()
            }
        ]
        
        # Insérer les médecins
        result = db.doctors.insert_many(production_doctors)
        
        print(f"✅ {len(result.inserted_ids)} médecins professionnels créés")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Erreur création médecins: {e}")
        return False

if __name__ == "__main__":
    print("🏥 === NETTOYAGE ET RESET DOKTA ===")
    print()
    
    response = input("🤔 Confirmer la suppression de TOUTES les données? (oui/non): ")
    if response.lower() in ['oui', 'o', 'yes', 'y']:
        clean_dokta_database()
        
        print()
        create_production = input("🤔 Créer des médecins professionnels? (oui/non): ")
        if create_production.lower() in ['oui', 'o', 'yes', 'y']:
            create_production_doctors()
    else:
        print("❌ Nettoyage annulé")