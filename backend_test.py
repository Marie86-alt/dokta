#!/usr/bin/env python3
"""
Tests complets pour les nouvelles fonctionnalités backend DOKTA
Teste les APIs de créneaux disponibles, création de rendez-vous simplifiée, et intégration complète
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Configuration
BACKEND_URL = "https://medi-cameroon.preview.emergentagent.com/api"

class DOKTABackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.doctor_id = None
        self.appointment_id = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Enregistrer le résultat d'un test"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def test_api_root(self):
        """Test de l'API racine"""
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Root", True, f"Message: {data.get('message', 'N/A')}")
                return True
            else:
                self.log_test("API Root", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("API Root", False, f"Erreur: {str(e)}")
            return False
    
    def test_get_doctors(self):
        """Test récupération liste des médecins"""
        try:
            response = requests.get(f"{self.base_url}/doctors")
            if response.status_code == 200:
                doctors = response.json()
                if doctors and len(doctors) > 0:
                    # Stocker l'ID du premier médecin pour les tests suivants
                    self.doctor_id = doctors[0]["id"]
                    doctor_names = [d["nom"] for d in doctors[:3]]
                    self.log_test("GET Doctors", True, f"Trouvé {len(doctors)} médecins: {', '.join(doctor_names)}")
                    return True
                else:
                    self.log_test("GET Doctors", False, "Aucun médecin trouvé")
                    return False
            else:
                self.log_test("GET Doctors", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET Doctors", False, f"Erreur: {str(e)}")
            return False
    
    def test_get_specialties(self):
        """Test récupération des spécialités"""
        try:
            response = requests.get(f"{self.base_url}/specialties")
            if response.status_code == 200:
                specialties = response.json()
                if specialties and len(specialties) > 0:
                    specialty_names = [s["label"] for s in specialties[:3]]
                    self.log_test("GET Specialties", True, f"Trouvé {len(specialties)} spécialités: {', '.join(specialty_names)}")
                    return True
                else:
                    self.log_test("GET Specialties", False, "Aucune spécialité trouvée")
                    return False
            else:
                self.log_test("GET Specialties", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("GET Specialties", False, f"Erreur: {str(e)}")
            return False
    
    def test_search_api(self):
        """Test de l'API de recherche globale"""
        try:
            # Test recherche médecin
            response = requests.get(f"{self.base_url}/search?q=Marie")
            if response.status_code == 200:
                results = response.json()
                if results.get("results"):
                    doctor_results = [r for r in results["results"] if r["type"] == "doctor"]
                    self.log_test("Search API - Médecins", True, f"Trouvé {len(doctor_results)} médecin(s) pour 'Marie'")
                else:
                    self.log_test("Search API - Médecins", True, "Aucun résultat pour 'Marie' (normal si pas de Dr Marie)")
                
                # Test recherche spécialité
                response2 = requests.get(f"{self.base_url}/search?q=Cardio")
                if response2.status_code == 200:
                    results2 = response2.json()
                    specialty_results = [r for r in results2.get("results", []) if r["type"] == "specialty"]
                    self.log_test("Search API - Spécialités", True, f"Trouvé {len(specialty_results)} spécialité(s) pour 'Cardio'")
                    return True
                else:
                    self.log_test("Search API - Spécialités", False, f"Status: {response2.status_code}")
                    return False
            else:
                self.log_test("Search API", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Search API", False, f"Erreur: {str(e)}")
            return False
    
    def test_available_slots(self, test_date="2024-12-27"):
        """Test PRIORITAIRE: API créneaux disponibles par médecin"""
        if not self.doctor_id:
            self.log_test("Available Slots", False, "Pas d'ID médecin disponible")
            return False
            
        try:
            url = f"{self.base_url}/doctors/{self.doctor_id}/available-slots?date={test_date}"
            response = requests.get(url)
            
            if response.status_code == 200:
                slots = response.json()
                if isinstance(slots, list) and len(slots) > 0:
                    available_count = sum(1 for slot in slots if slot.get("disponible", False))
                    total_count = len(slots)
                    sample_slots = [slot["heure"] for slot in slots[:5]]
                    
                    self.log_test(
                        f"Available Slots - {test_date}", 
                        True, 
                        f"{available_count}/{total_count} créneaux disponibles. Exemples: {', '.join(sample_slots)}"
                    )
                    return True
                else:
                    self.log_test("Available Slots", False, "Aucun créneau retourné ou format invalide", slots)
                    return False
            elif response.status_code == 404:
                self.log_test("Available Slots", False, "Médecin non trouvé", response.text)
                return False
            else:
                self.log_test("Available Slots", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Available Slots", False, f"Erreur: {str(e)}")
            return False
    
    def test_available_slots_different_dates(self):
        """Test créneaux disponibles avec différentes dates"""
        if not self.doctor_id:
            return False
            
        test_dates = [
            "2024-12-27",
            "2024-12-28", 
            "2025-01-02"
        ]
        
        success_count = 0
        for test_date in test_dates:
            if self.test_available_slots(test_date):
                success_count += 1
        
        overall_success = success_count == len(test_dates)
        self.log_test(
            "Available Slots - Dates multiples", 
            overall_success, 
            f"{success_count}/{len(test_dates)} dates testées avec succès"
        )
        return overall_success
    
    def test_create_appointment_simple(self):
        """Test PRIORITAIRE: API création rendez-vous simplifiée"""
        if not self.doctor_id:
            self.log_test("Create Appointment Simple", False, "Pas d'ID médecin disponible")
            return False
            
        try:
            appointment_data = {
                "doctor_id": self.doctor_id,
                "patient_name": "Amadou Nkomo",
                "patient_age": 28,
                "date": "2024-12-27",
                "time": "09:00",
                "consultation_type": "cabinet",
                "price": 15000,
                "user_id": "test_user_cameroun_123"
            }
            
            response = requests.post(
                f"{self.base_url}/appointments-simple",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("id") and result.get("status") == "confirmed":
                    self.appointment_id = result["id"]
                    self.log_test(
                        "Create Appointment Simple", 
                        True, 
                        f"Rendez-vous créé: ID={result['id'][:8]}..., Status={result['status']}"
                    )
                    return True
                else:
                    self.log_test("Create Appointment Simple", False, "Réponse invalide", result)
                    return False
            else:
                self.log_test("Create Appointment Simple", False, f"Status: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Create Appointment Simple", False, f"Erreur: {str(e)}")
            return False
    
    def test_appointment_validation(self):
        """Test validations création rendez-vous"""
        if not self.doctor_id:
            return False
            
        # Test données manquantes
        try:
            incomplete_data = {
                "doctor_id": self.doctor_id,
                "patient_name": "Test Patient"
                # Données manquantes intentionnellement
            }
            
            response = requests.post(
                f"{self.base_url}/appointments-simple",
                json=incomplete_data,
                headers={"Content-Type": "application/json"}
            )
            
            # On s'attend à une erreur pour données incomplètes
            if response.status_code >= 400:
                self.log_test("Appointment Validation - Données manquantes", True, f"Erreur attendue: {response.status_code}")
            else:
                self.log_test("Appointment Validation - Données manquantes", False, "Devrait rejeter les données incomplètes")
                
        except Exception as e:
            self.log_test("Appointment Validation", False, f"Erreur: {str(e)}")
            return False
        
        return True
    
    def test_double_booking_prevention(self):
        """Test PRIORITAIRE: Prévention double réservation"""
        if not self.doctor_id:
            return False
            
        try:
            # Créer un premier rendez-vous
            appointment_data = {
                "doctor_id": self.doctor_id,
                "patient_name": "Patient Test 1",
                "patient_age": 30,
                "date": "2024-12-27",
                "time": "10:00",
                "consultation_type": "cabinet",
                "price": 15000,
                "user_id": "test_user_1"
            }
            
            response1 = requests.post(
                f"{self.base_url}/appointments-simple",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response1.status_code == 200:
                # Essayer de créer un deuxième rendez-vous au même créneau
                appointment_data["patient_name"] = "Patient Test 2"
                appointment_data["user_id"] = "test_user_2"
                
                response2 = requests.post(
                    f"{self.base_url}/appointments-simple",
                    json=appointment_data,
                    headers={"Content-Type": "application/json"}
                )
                
                # On s'attend à un conflit (409) ou une erreur
                if response2.status_code == 409:
                    self.log_test("Double Booking Prevention", True, "Conflit détecté correctement (409)")
                    return True
                elif response2.status_code >= 400:
                    self.log_test("Double Booking Prevention", True, f"Erreur détectée: {response2.status_code}")
                    return True
                else:
                    self.log_test("Double Booking Prevention", False, "Double réservation autorisée à tort")
                    return False
            else:
                self.log_test("Double Booking Prevention", False, "Impossible de créer le premier rendez-vous")
                return False
                
        except Exception as e:
            self.log_test("Double Booking Prevention", False, f"Erreur: {str(e)}")
            return False
    
    def test_integration_complete(self):
        """Test PRIORITAIRE: Intégration complète - créer RDV puis vérifier indisponibilité"""
        if not self.doctor_id:
            return False
            
        try:
            test_date = "2024-12-27"
            test_time = "11:00"
            
            # 1. Vérifier créneaux disponibles AVANT
            slots_before = requests.get(f"{self.base_url}/doctors/{self.doctor_id}/available-slots?date={test_date}")
            if slots_before.status_code != 200:
                self.log_test("Integration Complete", False, "Impossible de récupérer les créneaux avant")
                return False
                
            slots_before_data = slots_before.json()
            slot_before = next((s for s in slots_before_data if s["heure"] == test_time), None)
            
            if not slot_before:
                self.log_test("Integration Complete", False, f"Créneau {test_time} non trouvé")
                return False
                
            was_available = slot_before.get("disponible", False)
            
            # 2. Créer un rendez-vous
            appointment_data = {
                "doctor_id": self.doctor_id,
                "patient_name": "Fatima Bello",
                "patient_age": 35,
                "date": test_date,
                "time": test_time,
                "consultation_type": "cabinet",
                "price": 15000,
                "user_id": "test_integration_user"
            }
            
            create_response = requests.post(
                f"{self.base_url}/appointments-simple",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if create_response.status_code != 200:
                self.log_test("Integration Complete", False, f"Création RDV échouée: {create_response.status_code}")
                return False
            
            # 3. Vérifier créneaux disponibles APRÈS
            slots_after = requests.get(f"{self.base_url}/doctors/{self.doctor_id}/available-slots?date={test_date}")
            if slots_after.status_code != 200:
                self.log_test("Integration Complete", False, "Impossible de récupérer les créneaux après")
                return False
                
            slots_after_data = slots_after.json()
            slot_after = next((s for s in slots_after_data if s["heure"] == test_time), None)
            
            if not slot_after:
                self.log_test("Integration Complete", False, f"Créneau {test_time} non trouvé après création")
                return False
                
            is_available_after = slot_after.get("disponible", True)
            
            # 4. Vérifier que le créneau n'est plus disponible
            if was_available and not is_available_after:
                self.log_test(
                    "Integration Complete", 
                    True, 
                    f"✅ Créneau {test_time} était disponible, maintenant indisponible après création RDV"
                )
                return True
            elif not was_available:
                self.log_test(
                    "Integration Complete", 
                    True, 
                    f"ℹ️ Créneau {test_time} était déjà indisponible (test valide)"
                )
                return True
            else:
                self.log_test(
                    "Integration Complete", 
                    False, 
                    f"❌ Créneau {test_time} toujours disponible après création RDV"
                )
                return False
                
        except Exception as e:
            self.log_test("Integration Complete", False, f"Erreur: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Exécuter tous les tests"""
        print("🏥 DOKTA Backend Tests - Nouvelles Fonctionnalités")
        print("=" * 60)
        print()
        
        # Tests de base
        self.test_api_root()
        self.test_get_doctors()
        self.test_get_specialties()
        self.test_search_api()
        
        # Tests prioritaires des nouvelles fonctionnalités
        print("🎯 TESTS PRIORITAIRES - NOUVELLES FONCTIONNALITÉS")
        print("-" * 50)
        self.test_available_slots()
        self.test_available_slots_different_dates()
        self.test_create_appointment_simple()
        self.test_appointment_validation()
        self.test_double_booking_prevention()
        self.test_integration_complete()
        
        # Résumé
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Tests réussis: {passed}/{total} ({passed/total*100:.1f}%)")
        print()
        
        # Détails des échecs
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("❌ TESTS ÉCHOUÉS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        else:
            print("✅ TOUS LES TESTS RÉUSSIS!")
        
        return passed, total, failed_tests

if __name__ == "__main__":
    print("Démarrage des tests backend DOKTA...")
    print(f"URL Backend: {BACKEND_URL}")
    print()
    
    tester = DOKTABackendTester()
    passed, total, failed = tester.run_all_tests()
    
    # Code de sortie
    sys.exit(0 if len(failed) == 0 else 1)