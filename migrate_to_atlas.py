#!/usr/bin/env python3
"""
Script de migration DOKTA vers MongoDB Atlas
"""
import pymongo
import json
import sys
from datetime import datetime

def migrate_to_atlas(atlas_connection_string, source_host="localhost:27017"):
    """
    Migration de la base DOKTA locale vers Atlas
    
    atlas_connection_string: URI de connexion Atlas (ex: mongodb+srv://username:password@cluster.mongodb.net/)
    """
    
    print("🏥 === MIGRATION DOKTA VERS ATLAS ===")
    print()
    
    try:
        # Connexion à la base locale
        print("📡 Connexion à MongoDB local...")
        local_client = pymongo.MongoClient(f"mongodb://{source_host}/")
        local_db = local_client['test_database']
        
        # Connexion à Atlas
        print("🌐 Connexion à MongoDB Atlas...")
        # Ajout des paramètres SSL pour Atlas
        if "ssl=true" not in atlas_connection_string.lower():
            separator = "&" if "?" in atlas_connection_string else "?"
            atlas_connection_string = f"{atlas_connection_string}{separator}ssl=true&ssl_cert_reqs=CERT_NONE"
        atlas_client = pymongo.MongoClient(atlas_connection_string, tlsAllowInvalidCertificates=True)
        atlas_db = atlas_client['dokta_production']  # Nouveau nom plus propre
        
        # Collections à migrer
        collections = ['doctors', 'appointments', 'users']
        
        print(f"📋 Migration de {len(collections)} collections...")
        print()
        
        for collection_name in collections:
            print(f"📦 Migration collection: {collection_name}")
            
            # Lire données locales
            local_collection = local_db[collection_name]
            local_data = list(local_collection.find())
            
            if not local_data:
                print(f"   ⚠️  Collection vide: {collection_name}")
                continue
            
            # Créer collection Atlas
            atlas_collection = atlas_db[collection_name]
            
            # Vider la collection de destination (au cas où)
            atlas_collection.delete_many({})
            
            # Insérer données
            result = atlas_collection.insert_many(local_data)
            
            print(f"   ✅ {len(result.inserted_ids)} documents migrés")
            print()
        
        # Vérification
        print("🔍 === VÉRIFICATION ===")
        for collection_name in collections:
            local_count = local_db[collection_name].count_documents({})
            atlas_count = atlas_db[collection_name].count_documents({})
            
            status = "✅" if local_count == atlas_count else "❌"
            print(f"   {status} {collection_name}: {local_count} → {atlas_count}")
        
        print()
        print("🎉 Migration terminée avec succès!")
        print()
        print("🔗 Nouvelle URI de connexion pour votre app:")
        print(f"   {atlas_connection_string}")
        print()
        print("📝 À faire:")
        print("   1. Modifier backend/server.py avec la nouvelle URI")
        print("   2. Tester la connexion")
        print("   3. Accéder à Atlas pour gérer votre base")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur migration: {e}")
        return False

def test_atlas_connection(connection_string):
    """Test de connexion Atlas"""
    try:
        print("🧪 Test de connexion Atlas...")
        client = pymongo.MongoClient(connection_string)
        
        # Test basique
        client.admin.command('ping')
        
        print("✅ Connexion Atlas réussie!")
        return True
        
    except Exception as e:
        print(f"❌ Connexion Atlas échouée: {e}")
        return False

def show_current_data():
    """Affichage des données actuelles"""
    try:
        client = pymongo.MongoClient("mongodb://localhost:27017/")
        db = client['test_database']
        
        print("📊 === DONNÉES ACTUELLES DOKTA ===")
        print()
        
        collections = ['doctors', 'appointments', 'users']
        for collection_name in collections:
            count = db[collection_name].count_documents({})
            print(f"   📦 {collection_name}: {count} documents")
        
        print()
        return True
        
    except Exception as e:
        print(f"❌ Erreur lecture locale: {e}")
        return False

if __name__ == "__main__":
    print("🏥 === UTILITAIRE DE MIGRATION DOKTA ===")
    print()
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("   python migrate_to_atlas.py show")
        print("   python migrate_to_atlas.py test <atlas_uri>")
        print("   python migrate_to_atlas.py migrate <atlas_uri>")
        print()
        print("Exemple:")
        print("   python migrate_to_atlas.py migrate 'mongodb+srv://username:password@cluster.mongodb.net/'")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "show":
        show_current_data()
        
    elif command == "test":
        if len(sys.argv) < 3:
            print("❌ URI Atlas requis pour le test")
            sys.exit(1)
        test_atlas_connection(sys.argv[2])
        
    elif command == "migrate":
        if len(sys.argv) < 3:
            print("❌ URI Atlas requis pour la migration")
            sys.exit(1)
            
        atlas_uri = sys.argv[2]
        
        # Afficher données actuelles
        show_current_data()
        
        # Confirmer migration
        response = input("🤔 Continuer la migration? (oui/non): ")
        if response.lower() in ['oui', 'o', 'yes', 'y']:
            migrate_to_atlas(atlas_uri)
        else:
            print("❌ Migration annulée")
    
    else:
        print("❌ Commande inconnue:", command)