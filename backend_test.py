#!/usr/bin/env python3
"""
Tests pour le système de paiement Mobile Money DOKTA
Test des nouvelles routes Mobile Money (MTN et Orange)
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://healthbook-cm.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

class MobileMoneyTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.doctors = []
        self.payment_ids = []
        
    def test_api_connection(self):
        """Test de connexion à l'API"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                print_success("Connexion API réussie")
                return True
            else:
                print_error(f"Échec connexion API: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Erreur connexion API: {e}")
            return False
    
    def get_doctors(self):
        """Récupérer la liste des médecins"""
        try:
            response = self.session.get(f"{self.base_url}/doctors")
            if response.status_code == 200:
                self.doctors = response.json()
                print_success(f"Récupération de {len(self.doctors)} médecins")
                
                # Afficher les médecins disponibles
                for doctor in self.doctors:
                    print_info(f"  - {doctor['nom']} ({doctor['specialite']}) - {doctor['tarif']:,} FCFA")
                return True
            else:
                print_error(f"Échec récupération médecins: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Erreur récupération médecins: {e}")
            return False
    
    def test_mtn_payment_initiation(self):
        """Test d'initiation paiement MTN Mobile Money"""
        print_info("=== TEST INITIATION PAIEMENT MTN MOBILE MONEY ===")
        
        if not self.doctors:
            print_error("Aucun médecin disponible pour le test")
            return False
        
        # Utiliser Dr. Marie NGONO (premier médecin)
        doctor = self.doctors[0]
        
        payment_data = {
            "patient_name": "Marie Kamga",
            "patient_phone": "677123456",  # Numéro camerounais valide
            "doctor_id": doctor["id"],
            "consultation_type": "cabinet",
            "appointment_datetime": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M"),
            "payment_provider": "mtn_momo",
            "notes": "Consultation de routine"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/mobile-money/initiate",
                json=payment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                payment_id = result.get("payment_id")
                self.payment_ids.append(payment_id)
                
                print_success(f"Initiation MTN réussie - ID: {payment_id}")
                print_info(f"  Provider: {result.get('provider')}")
                print_info(f"  Montant: {result.get('amount'):,} {result.get('currency')}")
                print_info(f"  Message: {result.get('message')}")
                print_info("  Instructions:")
                for i, instruction in enumerate(result.get('instructions', []), 1):
                    print_info(f"    {i}. {instruction}")
                
                return True
            else:
                print_error(f"Échec initiation MTN: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Erreur initiation MTN: {e}")
            return False
    
    def test_orange_payment_initiation(self):
        """Test d'initiation paiement Orange Money"""
        print_info("=== TEST INITIATION PAIEMENT ORANGE MONEY ===")
        
        if not self.doctors:
            print_error("Aucun médecin disponible pour le test")
            return False
        
        # Utiliser Dr. Jean MBARGA (deuxième médecin)
        doctor = self.doctors[1] if len(self.doctors) > 1 else self.doctors[0]
        
        payment_data = {
            "patient_name": "Jean Nkomo",
            "patient_phone": "690123456",  # Numéro camerounais valide
            "doctor_id": doctor["id"],
            "consultation_type": "domicile",
            "appointment_datetime": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d %H:%M"),
            "payment_provider": "orange_money",
            "notes": "Visite à domicile"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/mobile-money/initiate",
                json=payment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                payment_id = result.get("payment_id")
                self.payment_ids.append(payment_id)
                
                print_success(f"Initiation Orange réussie - ID: {payment_id}")
                print_info(f"  Provider: {result.get('provider')}")
                print_info(f"  Montant: {result.get('amount'):,} {result.get('currency')}")
                print_info(f"  Message: {result.get('message')}")
                print_info("  Instructions:")
                for i, instruction in enumerate(result.get('instructions', []), 1):
                    print_info(f"    {i}. {instruction}")
                
                return True
            else:
                print_error(f"Échec initiation Orange: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Erreur initiation Orange: {e}")
            return False
    
    def test_teleconsultation_payment(self):
        """Test paiement pour téléconsultation"""
        print_info("=== TEST PAIEMENT TÉLÉCONSULTATION ===")
        
        if not self.doctors:
            print_error("Aucun médecin disponible pour le test")
            return False
        
        # Utiliser Dr. Grace FOUDA (troisième médecin)
        doctor = self.doctors[2] if len(self.doctors) > 2 else self.doctors[0]
        
        payment_data = {
            "patient_name": "Grace Mballa",
            "patient_phone": "699123456",  # Numéro camerounais valide
            "doctor_id": doctor["id"],
            "consultation_type": "teleconsultation",
            "appointment_datetime": (datetime.now() + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M"),
            "payment_provider": "mtn_momo",
            "notes": "Consultation en ligne"
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/mobile-money/initiate",
                json=payment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                payment_id = result.get("payment_id")
                self.payment_ids.append(payment_id)
                
                print_success(f"Initiation téléconsultation réussie - ID: {payment_id}")
                print_info(f"  Type: {payment_data['consultation_type']}")
                print_info(f"  Montant: {result.get('amount'):,} {result.get('currency')}")
                
                return True
            else:
                print_error(f"Échec initiation téléconsultation: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Erreur initiation téléconsultation: {e}")
            return False
    
    def test_payment_status_check(self):
        """Test de vérification du statut de paiement"""
        print_info("=== TEST VÉRIFICATION STATUT PAIEMENT ===")
        
        if not self.payment_ids:
            print_error("Aucun paiement à vérifier")
            return False
        
        success_count = 0
        
        for payment_id in self.payment_ids:
            try:
                response = self.session.get(f"{self.base_url}/mobile-money/status/{payment_id}")
                
                if response.status_code == 200:
                    result = response.json()
                    print_success(f"Statut récupéré pour {payment_id}")
                    print_info(f"  Statut: {result.get('status')}")
                    print_info(f"  Montant: {result.get('amount'):,} {result.get('currency')}")
                    print_info(f"  Provider: {result.get('provider')}")
                    print_info(f"  Créé: {result.get('created_at')}")
                    
                    if result.get('completed_at'):
                        print_info(f"  Complété: {result.get('completed_at')}")
                    
                    success_count += 1
                else:
                    print_error(f"Échec vérification statut {payment_id}: {response.status_code}")
                    
            except Exception as e:
                print_error(f"Erreur vérification statut {payment_id}: {e}")
        
        return success_count > 0
    
    def test_payment_confirmation(self):
        """Test de confirmation manuelle de paiement"""
        print_info("=== TEST CONFIRMATION MANUELLE PAIEMENT ===")
        
        if not self.payment_ids:
            print_error("Aucun paiement à confirmer")
            return False
        
        # Confirmer le premier paiement
        payment_id = self.payment_ids[0]
        
        try:
            response = self.session.post(f"{self.base_url}/mobile-money/confirm/{payment_id}")
            
            if response.status_code == 200:
                result = response.json()
                print_success(f"Confirmation réussie pour {payment_id}")
                print_info(f"  Message: {result.get('message')}")
                print_info(f"  Statut paiement: {result.get('payment_status')}")
                
                if result.get('appointment_id'):
                    print_info(f"  Rendez-vous créé: {result.get('appointment_id')}")
                
                return True
            else:
                print_error(f"Échec confirmation: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print_error(f"Erreur confirmation: {e}")
            return False
    
    def test_invalid_phone_validation(self):
        """Test de validation des numéros de téléphone invalides"""
        print_info("=== TEST VALIDATION NUMÉROS INVALIDES ===")
        
        if not self.doctors:
            print_error("Aucun médecin disponible pour le test")
            return False
        
        doctor = self.doctors[0]
        invalid_phones = [
            "123456789",      # Trop court
            "6771234567890",  # Trop long
            "577123456",      # Ne commence pas par 6[789]
            "601234567",      # Mauvais préfixe
            "abcdefghi"       # Non numérique
        ]
        
        success_count = 0
        
        for phone in invalid_phones:
            payment_data = {
                "patient_name": "Test Patient",
                "patient_phone": phone,
                "doctor_id": doctor["id"],
                "consultation_type": "cabinet",
                "appointment_datetime": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M"),
                "payment_provider": "mtn_momo"
            }
            
            try:
                response = self.session.post(
                    f"{self.base_url}/mobile-money/initiate",
                    json=payment_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 422:  # Validation error expected
                    print_success(f"Numéro invalide correctement rejeté: {phone}")
                    success_count += 1
                else:
                    print_error(f"Numéro invalide accepté: {phone} (status: {response.status_code})")
                    
            except Exception as e:
                print_error(f"Erreur test validation {phone}: {e}")
        
        return success_count == len(invalid_phones)
    
    def test_tariff_calculation(self):
        """Test du calcul des tarifs selon le type de consultation"""
        print_info("=== TEST CALCUL TARIFS PAR TYPE CONSULTATION ===")
        
        if not self.doctors:
            print_error("Aucun médecin disponible pour le test")
            return False
        
        doctor = self.doctors[0]
        base_tariff = doctor["tarif"]
        
        consultation_types = ["cabinet", "domicile", "teleconsultation"]
        expected_tariffs = {
            "cabinet": base_tariff,
            "domicile": base_tariff + 10000,  # +10000 FCFA pour domicile
            "teleconsultation": base_tariff - 5000  # -5000 FCFA pour téléconsultation
        }
        
        success_count = 0
        
        for consultation_type in consultation_types:
            payment_data = {
                "patient_name": "Test Tarif",
                "patient_phone": "677123456",
                "doctor_id": doctor["id"],
                "consultation_type": consultation_type,
                "appointment_datetime": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d %H:%M"),
                "payment_provider": "mtn_momo"
            }
            
            try:
                response = self.session.post(
                    f"{self.base_url}/mobile-money/initiate",
                    json=payment_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    actual_amount = result.get("amount")
                    expected_amount = expected_tariffs[consultation_type]
                    
                    if actual_amount == expected_amount:
                        print_success(f"{consultation_type}: {actual_amount:,} FCFA (correct)")
                        success_count += 1
                    else:
                        print_error(f"{consultation_type}: {actual_amount:,} FCFA (attendu: {expected_amount:,})")
                else:
                    print_error(f"Échec test tarif {consultation_type}: {response.status_code}")
                    
            except Exception as e:
                print_error(f"Erreur test tarif {consultation_type}: {e}")
        
        return success_count == len(consultation_types)
    
    def run_all_tests(self):
        """Exécuter tous les tests Mobile Money"""
        print_info("🚀 DÉBUT DES TESTS MOBILE MONEY DOKTA")
        print_info("=" * 50)
        
        results = []
        
        # Test de connexion
        results.append(("Connexion API", self.test_api_connection()))
        
        # Récupération des médecins
        results.append(("Récupération médecins", self.get_doctors()))
        
        # Tests d'initiation de paiement
        results.append(("Initiation MTN Mobile Money", self.test_mtn_payment_initiation()))
        results.append(("Initiation Orange Money", self.test_orange_payment_initiation()))
        results.append(("Paiement téléconsultation", self.test_teleconsultation_payment()))
        
        # Test de vérification de statut
        results.append(("Vérification statut", self.test_payment_status_check()))
        
        # Test de confirmation
        results.append(("Confirmation paiement", self.test_payment_confirmation()))
        
        # Tests de validation
        results.append(("Validation numéros invalides", self.test_invalid_phone_validation()))
        results.append(("Calcul tarifs", self.test_tariff_calculation()))
        
        # Résumé des résultats
        print_info("\n" + "=" * 50)
        print_info("📊 RÉSUMÉ DES TESTS")
        print_info("=" * 50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            if result:
                print_success(f"{test_name}")
                passed += 1
            else:
                print_error(f"{test_name}")
        
        print_info(f"\n✅ Tests réussis: {passed}/{total} ({passed/total*100:.1f}%)")
        
        if passed == total:
            print_success("🎉 TOUS LES TESTS MOBILE MONEY SONT PASSÉS!")
        else:
            print_warning(f"⚠️  {total-passed} test(s) ont échoué")
        
        return passed, total

if __name__ == "__main__":
    tester = MobileMoneyTester()
    passed, total = tester.run_all_tests()
    
    # Code de sortie
    exit(0 if passed == total else 1)