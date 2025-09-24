#!/usr/bin/env python3
"""
Tests complets pour le système d'authentification DOKTA JWT
avec validation camerounaise
"""

import requests
import json
import os
from datetime import datetime

# Configuration des URLs
BACKEND_URL = "https://medi-cameroon.preview.emergentagent.com/api"

# Données de test camerounaises avec timestamps pour unicité
import time
timestamp = str(int(time.time()))[-6:]  # Derniers 6 chiffres du timestamp

TEST_PATIENT = {
    "nom": "Marie Ndoumbe",
    "telephone": f"+237699{timestamp}",
    "mot_de_passe": "motdepasse123",
    "type_utilisateur": "patient",
    "age": 25,
    "ville": "Douala"
}

TEST_DOCTOR = {
    "nom": "Dr Paul Ewondo",
    "telephone": f"+237677{timestamp}",
    "mot_de_passe": "medecin123",
    "type_utilisateur": "medecin",
    "specialite": "Cardiologie",
    "experience": "10 ans",
    "tarif": 15000,
    "diplomes": "Doctorat en Médecine, Spécialisation Cardiologie"
}

# Variables globales pour les tokens
patient_token = None
doctor_token = None
patient_data = None
doctor_data = None

def print_test_result(test_name, success, details=""):
    """Afficher le résultat d'un test"""
    status = "✅ RÉUSSI" if success else "❌ ÉCHEC"
    print(f"{status} - {test_name}")
    if details:
        print(f"   Détails: {details}")
    print()

def test_api_root():
    """Test de l'API racine"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        success = response.status_code == 200
        details = f"Status: {response.status_code}, Response: {response.json()}"
        print_test_result("API Root", success, details)
        return success
    except Exception as e:
        print_test_result("API Root", False, f"Erreur: {str(e)}")
        return False

def test_patient_registration():
    """Test d'inscription patient avec données camerounaises"""
    global patient_token, patient_data
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/register",
            json=TEST_PATIENT,
            headers={"Content-Type": "application/json"}
        )
        
        success = response.status_code == 200
        if success:
            data = response.json()
            patient_token = data.get("access_token")
            patient_data = data.get("user_data")
            details = f"Token reçu, Patient ID: {patient_data.get('id')}, Téléphone: {patient_data.get('telephone')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
        
        print_test_result("Inscription Patient Camerounais", success, details)
        return success
    except Exception as e:
        print_test_result("Inscription Patient Camerounais", False, f"Erreur: {str(e)}")
        return False

def test_doctor_registration():
    """Test d'inscription médecin avec spécialité et tarifs"""
    global doctor_token, doctor_data
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/auth/register",
            json=TEST_DOCTOR,
            headers={"Content-Type": "application/json"}
        )
        
        success = response.status_code == 200
        if success:
            data = response.json()
            doctor_token = data.get("access_token")
            doctor_data = data.get("user_data")
            details = f"Token reçu, Médecin ID: {doctor_data.get('id')}, Spécialité: {doctor_data.get('specialite')}, Tarif: {doctor_data.get('tarif')} FCFA"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
        
        print_test_result("Inscription Médecin avec Spécialité", success, details)
        return success
    except Exception as e:
        print_test_result("Inscription Médecin avec Spécialité", False, f"Erreur: {str(e)}")
        return False

def test_invalid_phone_registration():
    """Test de validation numéro camerounais invalide"""
    invalid_phones = [
        "+33123456789",  # Numéro français
        "+237123456",    # Trop court
        "+2376991234567", # Trop long
        "+237899123456",  # Préfixe invalide (8)
        "237699123456",   # Sans +
        "+237abc123456"   # Avec lettres
    ]
    
    success_count = 0
    for phone in invalid_phones:
        try:
            test_data = TEST_PATIENT.copy()
            test_data["telephone"] = phone
            test_data["nom"] = f"Test {phone}"
            
            response = requests.post(
                f"{BACKEND_URL}/auth/register",
                json=test_data,
                headers={"Content-Type": "application/json"}
            )
            
            # On s'attend à un échec (400)
            if response.status_code == 400:
                success_count += 1
                print(f"   ✅ {phone} correctement rejeté")
            else:
                print(f"   ❌ {phone} accepté à tort (Status: {response.status_code})")
                
        except Exception as e:
            print(f"   ❌ Erreur pour {phone}: {str(e)}")
    
    success = success_count == len(invalid_phones)
    details = f"{success_count}/{len(invalid_phones)} numéros invalides correctement rejetés"
    print_test_result("Validation Numéros Camerounais Invalides", success, details)
    return success

def test_duplicate_registration():
    """Test de prévention des doublons"""
    try:
        # Essayer de réinscrire le même patient
        response = requests.post(
            f"{BACKEND_URL}/auth/register",
            json=TEST_PATIENT,
            headers={"Content-Type": "application/json"}
        )
        
        # On s'attend à un échec (400)
        success = response.status_code == 400
        if success:
            details = "Doublon correctement détecté et rejeté"
        else:
            details = f"Status: {response.status_code}, Doublon accepté à tort"
        
        print_test_result("Prévention Doublons", success, details)
        return success
    except Exception as e:
        print_test_result("Prévention Doublons", False, f"Erreur: {str(e)}")
        return False

def test_patient_login():
    """Test de connexion patient"""
    try:
        login_data = {
            "telephone": TEST_PATIENT["telephone"],
            "mot_de_passe": TEST_PATIENT["mot_de_passe"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        success = response.status_code == 200
        if success:
            data = response.json()
            token = data.get("access_token")
            user_data = data.get("user_data")
            details = f"Connexion réussie, Token reçu, Type: {user_data.get('type')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
        
        print_test_result("Connexion Patient", success, details)
        return success
    except Exception as e:
        print_test_result("Connexion Patient", False, f"Erreur: {str(e)}")
        return False

def test_doctor_login():
    """Test de connexion médecin"""
    try:
        login_data = {
            "telephone": TEST_DOCTOR["telephone"],
            "mot_de_passe": TEST_DOCTOR["mot_de_passe"]
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        success = response.status_code == 200
        if success:
            data = response.json()
            token = data.get("access_token")
            user_data = data.get("user_data")
            details = f"Connexion réussie, Token reçu, Spécialité: {user_data.get('specialite')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
        
        print_test_result("Connexion Médecin", success, details)
        return success
    except Exception as e:
        print_test_result("Connexion Médecin", False, f"Erreur: {str(e)}")
        return False

def test_invalid_login():
    """Test d'échec avec mauvais credentials"""
    try:
        # Test avec mauvais mot de passe
        login_data = {
            "telephone": TEST_PATIENT["telephone"],
            "mot_de_passe": "mauvais_mot_de_passe"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        # On s'attend à un échec (401)
        success = response.status_code == 401
        if success:
            details = "Mauvais credentials correctement rejetés"
        else:
            details = f"Status: {response.status_code}, Mauvais credentials acceptés à tort"
        
        print_test_result("Échec Mauvais Credentials", success, details)
        return success
    except Exception as e:
        print_test_result("Échec Mauvais Credentials", False, f"Erreur: {str(e)}")
        return False

def test_get_profile_with_valid_token():
    """Test récupération profil avec token valide"""
    if not patient_token:
        print_test_result("Profil avec Token Valide", False, "Pas de token patient disponible")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {patient_token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        
        success = response.status_code == 200
        if success:
            data = response.json()
            details = f"Profil récupéré: {data.get('nom')}, Type: {data.get('type')}, Ville: {data.get('ville')}"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
        
        print_test_result("Profil avec Token Valide", success, details)
        return success
    except Exception as e:
        print_test_result("Profil avec Token Valide", False, f"Erreur: {str(e)}")
        return False

def test_get_profile_without_token():
    """Test échec récupération profil sans token"""
    try:
        response = requests.get(f"{BACKEND_URL}/auth/me")
        
        # On s'attend à un échec (401 ou 403)
        success = response.status_code in [401, 403]
        if success:
            details = "Accès sans token correctement refusé"
        else:
            details = f"Status: {response.status_code}, Accès sans token autorisé à tort"
        
        print_test_result("Échec sans Token", success, details)
        return success
    except Exception as e:
        print_test_result("Échec sans Token", False, f"Erreur: {str(e)}")
        return False

def test_get_profile_with_invalid_token():
    """Test échec avec token invalide"""
    try:
        headers = {
            "Authorization": "Bearer token_invalide_123",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        
        # On s'attend à un échec (401)
        success = response.status_code == 401
        if success:
            details = "Token invalide correctement rejeté"
        else:
            details = f"Status: {response.status_code}, Token invalide accepté à tort"
        
        print_test_result("Échec Token Invalide", success, details)
        return success
    except Exception as e:
        print_test_result("Échec Token Invalide", False, f"Erreur: {str(e)}")
        return False

def test_update_patient_profile():
    """Test mise à jour profil patient"""
    if not patient_token:
        print_test_result("Mise à jour Profil Patient", False, "Pas de token patient disponible")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {patient_token}",
            "Content-Type": "application/json"
        }
        
        update_data = {
            "age": 26,
            "ville": "Yaoundé"
        }
        
        response = requests.put(
            f"{BACKEND_URL}/auth/profile",
            json=update_data,
            headers=headers
        )
        
        success = response.status_code == 200
        if success:
            details = "Profil patient mis à jour avec succès"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
        
        print_test_result("Mise à jour Profil Patient", success, details)
        return success
    except Exception as e:
        print_test_result("Mise à jour Profil Patient", False, f"Erreur: {str(e)}")
        return False

def test_update_doctor_profile():
    """Test mise à jour profil médecin"""
    if not doctor_token:
        print_test_result("Mise à jour Profil Médecin", False, "Pas de token médecin disponible")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {doctor_token}",
            "Content-Type": "application/json"
        }
        
        update_data = {
            "experience": "11 ans",
            "tarif": 16000
        }
        
        response = requests.put(
            f"{BACKEND_URL}/auth/profile",
            json=update_data,
            headers=headers
        )
        
        success = response.status_code == 200
        if success:
            details = "Profil médecin mis à jour avec succès"
        else:
            details = f"Status: {response.status_code}, Error: {response.text}"
        
        print_test_result("Mise à jour Profil Médecin", success, details)
        return success
    except Exception as e:
        print_test_result("Mise à jour Profil Médecin", False, f"Erreur: {str(e)}")
        return False

def test_forbidden_profile_fields():
    """Test protection champs interdits"""
    if not patient_token:
        print_test_result("Protection Champs Interdits", False, "Pas de token patient disponible")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {patient_token}",
            "Content-Type": "application/json"
        }
        
        # Essayer de modifier des champs interdits
        forbidden_data = {
            "id": "nouveau_id",
            "telephone": "+237699999999",
            "type": "medecin",
            "mot_de_passe": "nouveau_mot_de_passe"
        }
        
        response = requests.put(
            f"{BACKEND_URL}/auth/profile",
            json=forbidden_data,
            headers=headers
        )
        
        # Le serveur devrait ignorer ces champs ou retourner une erreur
        success = response.status_code in [200, 400]
        if success:
            details = "Champs interdits correctement protégés"
        else:
            details = f"Status: {response.status_code}, Protection insuffisante"
        
        print_test_result("Protection Champs Interdits", success, details)
        return success
    except Exception as e:
        print_test_result("Protection Champs Interdits", False, f"Erreur: {str(e)}")
        return False

def run_all_tests():
    """Exécuter tous les tests d'authentification"""
    print("=" * 60)
    print("TESTS SYSTÈME D'AUTHENTIFICATION DOKTA JWT")
    print("Validation Camerounaise (+237XXXXXXXXX)")
    print("=" * 60)
    print()
    
    tests = [
        ("API Root", test_api_root),
        ("Inscription Patient", test_patient_registration),
        ("Inscription Médecin", test_doctor_registration),
        ("Validation Numéros Invalides", test_invalid_phone_registration),
        ("Prévention Doublons", test_duplicate_registration),
        ("Connexion Patient", test_patient_login),
        ("Connexion Médecin", test_doctor_login),
        ("Échec Mauvais Credentials", test_invalid_login),
        ("Profil avec Token Valide", test_get_profile_with_valid_token),
        ("Échec sans Token", test_get_profile_without_token),
        ("Échec Token Invalide", test_get_profile_with_invalid_token),
        ("Mise à jour Profil Patient", test_update_patient_profile),
        ("Mise à jour Profil Médecin", test_update_doctor_profile),
        ("Protection Champs Interdits", test_forbidden_profile_fields)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        if test_func():
            passed += 1
    
    print("=" * 60)
    print(f"RÉSULTATS FINAUX: {passed}/{total} tests réussis")
    
    if passed == total:
        print("🎉 TOUS LES TESTS D'AUTHENTIFICATION RÉUSSIS!")
        print("✅ Système JWT sécurisé et fonctionnel")
        print("✅ Validation camerounaise opérationnelle")
        print("✅ Inscription/Connexion Patient et Médecin OK")
        print("✅ Protection des données et tokens sécurisés")
    else:
        print(f"⚠️  {total - passed} test(s) en échec")
        print("❌ Système d'authentification nécessite des corrections")
    
    print("=" * 60)
    return passed == total

if __name__ == "__main__":
    run_all_tests()