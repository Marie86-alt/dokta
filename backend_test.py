#!/usr/bin/env python3
"""
Test complet de l'API backend MediBook Cameroun
Tests des APIs critiques de réservation médicale
"""

import requests
import json
from datetime import datetime, timedelta
import sys
import os

# Configuration
BACKEND_URL = "https://healthbookcm.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# Données de test camerounaises
TEST_PATIENT = {
    "nom": "Amina Nkomo",
    "telephone": "+237690123456",
    "type": "patient"
}

TEST_DOCTOR_DATA = {
    "nom": "Dr. Samuel Biya",
    "telephone": "+237691234567",
    "specialite": "Généraliste",
    "experience": "5 ans",
    "tarif": 15000
}

# Date de test (demain)
TEST_DATE = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
TEST_TIME = "09:00"

class MediBookTester:
    def __init__(self):
        self.results = []
        self.patient_id = None
        self.doctor_id = None
        self.appointment_id = None
        
    def log_result(self, test_name, success, message, response_data=None):
        """Enregistrer le résultat d'un test"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_api_root(self):
        """Test de l'API racine"""
        try:
            response = requests.get(f"{BACKEND_URL}/", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Root", True, f"API accessible - {data.get('message', '')}")
                return True
            else:
                self.log_result("API Root", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Root", False, f"Erreur de connexion: {str(e)}")
            return False
    
    def test_get_specialties(self):
        """Test GET /api/specialties"""
        try:
            response = requests.get(f"{BACKEND_URL}/specialties", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                specialties = response.json()
                if len(specialties) >= 8:
                    specialty_names = [s.get('label', s.get('value', '')) for s in specialties]
                    if "Généraliste" in specialty_names:
                        self.log_result("GET Specialties", True, f"8 spécialités trouvées: {', '.join(specialty_names[:3])}...")
                        return True
                    else:
                        self.log_result("GET Specialties", False, "Spécialité 'Généraliste' manquante")
                        return False
                else:
                    self.log_result("GET Specialties", False, f"Seulement {len(specialties)} spécialités trouvées, 8 attendues")
                    return False
            else:
                self.log_result("GET Specialties", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("GET Specialties", False, f"Erreur: {str(e)}")
            return False
    
    def test_get_doctors_all(self):
        """Test GET /api/doctors (tous les médecins)"""
        try:
            response = requests.get(f"{BACKEND_URL}/doctors", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                doctors = response.json()
                if len(doctors) >= 5:
                    # Sauvegarder un médecin généraliste pour les tests suivants
                    for doctor in doctors:
                        if doctor.get('specialite') == 'Généraliste':
                            self.doctor_id = doctor['id']
                            break
                    
                    self.log_result("GET All Doctors", True, f"{len(doctors)} médecins trouvés")
                    return True
                else:
                    self.log_result("GET All Doctors", False, f"Seulement {len(doctors)} médecins trouvés, 5 attendus minimum")
                    return False
            else:
                self.log_result("GET All Doctors", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("GET All Doctors", False, f"Erreur: {str(e)}")
            return False
    
    def test_get_doctors_by_specialty(self):
        """Test GET /api/doctors?specialite=Généraliste"""
        try:
            response = requests.get(f"{BACKEND_URL}/doctors?specialite=Généraliste", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                doctors = response.json()
                if len(doctors) >= 1:
                    # Vérifier que tous sont généralistes
                    all_generalistes = all(d.get('specialite') == 'Généraliste' for d in doctors)
                    if all_generalistes:
                        self.log_result("GET Doctors by Specialty", True, f"{len(doctors)} généraliste(s) trouvé(s)")
                        return True
                    else:
                        self.log_result("GET Doctors by Specialty", False, "Certains médecins ne sont pas généralistes")
                        return False
                else:
                    self.log_result("GET Doctors by Specialty", False, "Aucun généraliste trouvé")
                    return False
            else:
                self.log_result("GET Doctors by Specialty", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("GET Doctors by Specialty", False, f"Erreur: {str(e)}")
            return False
    
    def test_create_patient(self):
        """Test POST /api/users (création patient)"""
        try:
            response = requests.post(f"{BACKEND_URL}/users", 
                                   json=TEST_PATIENT, 
                                   headers=HEADERS, 
                                   timeout=10)
            if response.status_code == 200:
                patient = response.json()
                self.patient_id = patient['id']
                if patient['nom'] == TEST_PATIENT['nom'] and patient['telephone'] == TEST_PATIENT['telephone']:
                    self.log_result("POST Create Patient", True, f"Patient créé: {patient['nom']} ({patient['telephone']})")
                    return True
                else:
                    self.log_result("POST Create Patient", False, "Données patient incorrectes")
                    return False
            else:
                self.log_result("POST Create Patient", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("POST Create Patient", False, f"Erreur: {str(e)}")
            return False
    
    def test_get_available_slots(self):
        """Test GET /api/doctors/{doctorId}/available-slots?date=YYYY-MM-DD"""
        if not self.doctor_id:
            self.log_result("GET Available Slots", False, "Aucun doctor_id disponible")
            return False
        
        try:
            response = requests.get(f"{BACKEND_URL}/doctors/{self.doctor_id}/available-slots?date={TEST_DATE}", 
                                  headers=HEADERS, 
                                  timeout=10)
            if response.status_code == 200:
                slots = response.json()
                if len(slots) >= 10:  # Au moins 10 créneaux dans la journée
                    available_slots = [s for s in slots if s.get('disponible', False)]
                    if len(available_slots) >= 5:
                        self.log_result("GET Available Slots", True, f"{len(available_slots)} créneaux disponibles sur {len(slots)} total")
                        return True
                    else:
                        self.log_result("GET Available Slots", False, f"Seulement {len(available_slots)} créneaux disponibles")
                        return False
                else:
                    self.log_result("GET Available Slots", False, f"Seulement {len(slots)} créneaux trouvés")
                    return False
            else:
                self.log_result("GET Available Slots", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("GET Available Slots", False, f"Erreur: {str(e)}")
            return False
    
    def test_create_appointment(self):
        """Test POST /api/appointments (création rendez-vous)"""
        if not self.patient_id or not self.doctor_id:
            self.log_result("POST Create Appointment", False, "patient_id ou doctor_id manquant")
            return False
        
        appointment_data = {
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "date": TEST_DATE,
            "heure": TEST_TIME
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/appointments", 
                                   json=appointment_data, 
                                   headers=HEADERS, 
                                   timeout=10)
            if response.status_code == 200:
                appointment = response.json()
                self.appointment_id = appointment['id']
                if (appointment['date'] == TEST_DATE and 
                    appointment['heure'] == TEST_TIME and
                    appointment['status'] == 'en_attente'):
                    self.log_result("POST Create Appointment", True, f"RDV créé pour {TEST_DATE} à {TEST_TIME}")
                    return True
                else:
                    self.log_result("POST Create Appointment", False, "Données rendez-vous incorrectes")
                    return False
            else:
                self.log_result("POST Create Appointment", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("POST Create Appointment", False, f"Erreur: {str(e)}")
            return False
    
    def test_double_booking_prevention(self):
        """Test de prévention de double réservation"""
        if not self.patient_id or not self.doctor_id:
            self.log_result("Double Booking Prevention", False, "patient_id ou doctor_id manquant")
            return False
        
        # Créer un deuxième patient
        second_patient_data = {
            "nom": "Paul Essomba",
            "telephone": "+237691234567",
            "type": "patient"
        }
        
        try:
            # Créer le deuxième patient
            response = requests.post(f"{BACKEND_URL}/users", 
                                   json=second_patient_data, 
                                   headers=HEADERS, 
                                   timeout=10)
            if response.status_code != 200:
                self.log_result("Double Booking Prevention", False, "Impossible de créer le deuxième patient")
                return False
            
            second_patient = response.json()
            
            # Tenter de réserver le même créneau
            appointment_data = {
                "patient_id": second_patient['id'],
                "doctor_id": self.doctor_id,
                "date": TEST_DATE,
                "heure": TEST_TIME
            }
            
            response = requests.post(f"{BACKEND_URL}/appointments", 
                                   json=appointment_data, 
                                   headers=HEADERS, 
                                   timeout=10)
            
            if response.status_code == 400:
                self.log_result("Double Booking Prevention", True, "Double réservation correctement bloquée")
                return True
            else:
                self.log_result("Double Booking Prevention", False, f"Double réservation autorisée (status: {response.status_code})")
                return False
                
        except Exception as e:
            self.log_result("Double Booking Prevention", False, f"Erreur: {str(e)}")
            return False
    
    def test_confirm_appointment(self):
        """Test PUT /api/appointments/{appointmentId}/confirm"""
        if not self.appointment_id:
            self.log_result("PUT Confirm Appointment", False, "appointment_id manquant")
            return False
        
        try:
            response = requests.put(f"{BACKEND_URL}/appointments/{self.appointment_id}/confirm", 
                                  headers=HEADERS, 
                                  timeout=10)
            if response.status_code == 200:
                result = response.json()
                if "confirmé" in result.get('message', '').lower():
                    self.log_result("PUT Confirm Appointment", True, "Rendez-vous confirmé avec succès")
                    return True
                else:
                    self.log_result("PUT Confirm Appointment", False, "Message de confirmation incorrect")
                    return False
            else:
                self.log_result("PUT Confirm Appointment", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("PUT Confirm Appointment", False, f"Erreur: {str(e)}")
            return False
    
    def test_slot_unavailable_after_booking(self):
        """Test que le créneau devient indisponible après réservation"""
        if not self.doctor_id:
            self.log_result("Slot Unavailable After Booking", False, "doctor_id manquant")
            return False
        
        try:
            response = requests.get(f"{BACKEND_URL}/doctors/{self.doctor_id}/available-slots?date={TEST_DATE}", 
                                  headers=HEADERS, 
                                  timeout=10)
            if response.status_code == 200:
                slots = response.json()
                test_slot = next((s for s in slots if s['heure'] == TEST_TIME), None)
                
                if test_slot and not test_slot.get('disponible', True):
                    self.log_result("Slot Unavailable After Booking", True, f"Créneau {TEST_TIME} correctement marqué indisponible")
                    return True
                else:
                    self.log_result("Slot Unavailable After Booking", False, f"Créneau {TEST_TIME} encore disponible après réservation")
                    return False
            else:
                self.log_result("Slot Unavailable After Booking", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Slot Unavailable After Booking", False, f"Erreur: {str(e)}")
            return False
    
    def test_global_search(self):
        """Test API de recherche globale"""
        try:
            # Test recherche médecin
            response = requests.get(f"{BACKEND_URL}/search?q=Marie", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                results = response.json().get('results', [])
                doctor_results = [r for r in results if r.get('type') == 'doctor']
                if doctor_results:
                    self.log_result("Global Search - Doctors", True, f"{len(doctor_results)} médecins trouvés pour 'Marie'")
                else:
                    self.log_result("Global Search - Doctors", False, "Aucun médecin trouvé pour 'Marie'")
            else:
                self.log_result("Global Search - Doctors", False, f"Status code: {response.status_code}", response.text)

            # Test recherche spécialité
            response = requests.get(f"{BACKEND_URL}/search?q=Cardio", headers=HEADERS, timeout=10)
            if response.status_code == 200:
                results = response.json().get('results', [])
                specialty_results = [r for r in results if r.get('type') == 'specialty']
                if specialty_results:
                    self.log_result("Global Search - Specialties", True, f"{len(specialty_results)} spécialités trouvées pour 'Cardio'")
                    return True
                else:
                    self.log_result("Global Search - Specialties", False, "Aucune spécialité trouvée pour 'Cardio'")
                    return False
            else:
                self.log_result("Global Search - Specialties", False, f"Status code: {response.status_code}", response.text)
                return False

        except Exception as e:
            self.log_result("Global Search", False, f"Erreur: {str(e)}")
            return False
    
    def test_doctor_dashboard(self):
        """Test tableau de bord médecin"""
        if not self.doctor_id:
            self.log_result("Doctor Dashboard", False, "doctor_id manquant")
            return False
        
        try:
            response = requests.get(f"{BACKEND_URL}/doctors/{self.doctor_id}/dashboard", 
                                  headers=HEADERS, 
                                  timeout=10)
            if response.status_code == 200:
                dashboard = response.json()
                if 'doctor' in dashboard and 'stats' in dashboard:
                    stats = dashboard['stats']
                    required_stats = ['total_appointments', 'today_appointments', 'confirmed_appointments', 'pending_appointments']
                    missing_stats = [stat for stat in required_stats if stat not in stats]
                    
                    if not missing_stats:
                        self.log_result("Doctor Dashboard", True, 
                                      f"Stats: {stats['total_appointments']} total, {stats['today_appointments']} aujourd'hui")
                        return True
                    else:
                        self.log_result("Doctor Dashboard", False, f"Stats manquantes: {missing_stats}")
                        return False
                else:
                    self.log_result("Doctor Dashboard", False, f"Structure incorrecte: {list(dashboard.keys())}")
                    return False
            else:
                self.log_result("Doctor Dashboard", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Doctor Dashboard", False, f"Erreur: {str(e)}")
            return False
    
    def test_doctor_appointments(self):
        """Test récupération des rendez-vous du médecin"""
        if not self.doctor_id:
            self.log_result("Doctor Appointments", False, "doctor_id manquant")
            return False
        
        try:
            response = requests.get(f"{BACKEND_URL}/doctors/{self.doctor_id}/appointments", 
                                  headers=HEADERS, 
                                  timeout=10)
            if response.status_code == 200:
                appointments = response.json()
                if appointments:
                    # Vérifier que les rendez-vous ont les données patient
                    first_appt = appointments[0]
                    if 'patient' in first_appt and first_appt['patient']:
                        self.log_result("Doctor Appointments", True, 
                                      f"{len(appointments)} rendez-vous trouvés avec données patient")
                        return True
                    else:
                        self.log_result("Doctor Appointments", False, 
                                      "Données patient manquantes dans les rendez-vous")
                        return False
                else:
                    self.log_result("Doctor Appointments", True, 
                                  "Aucun rendez-vous (normal pour nouveau médecin)")
                    return True
            else:
                self.log_result("Doctor Appointments", False, f"Status code: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Doctor Appointments", False, f"Erreur: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test gestion d'erreurs avec IDs invalides"""
        try:
            # Test avec ID médecin invalide
            response = requests.get(f"{BACKEND_URL}/doctors/invalid-id/available-slots?date={TEST_DATE}", 
                                  headers=HEADERS, 
                                  timeout=10)
            if response.status_code == 404:
                self.log_result("Error Handling - Invalid Doctor ID", True, "Erreur 404 correctement retournée")
            else:
                self.log_result("Error Handling - Invalid Doctor ID", False, f"Status code: {response.status_code}")
            
            # Test avec date invalide
            response = requests.get(f"{BACKEND_URL}/doctors/{self.doctor_id}/available-slots?date=invalid-date", 
                                  headers=HEADERS, 
                                  timeout=10)
            # L'API devrait gérer gracieusement les dates invalides
            if response.status_code in [200, 400, 422]:
                self.log_result("Error Handling - Invalid Date", True, f"Date invalide gérée (status: {response.status_code})")
                return True
            else:
                self.log_result("Error Handling - Invalid Date", False, f"Status code inattendu: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Error Handling", False, f"Erreur: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Exécuter tous les tests dans l'ordre"""
        print("=" * 60)
        print("🏥 TESTS API MEDIBOOK CAMEROUN")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Date de test: {TEST_DATE}")
        print("-" * 60)
        
        # Tests dans l'ordre logique
        tests = [
            self.test_api_root,
            self.test_get_specialties,
            self.test_get_doctors_all,
            self.test_get_doctors_by_specialty,
            self.test_create_patient,
            self.test_get_available_slots,
            self.test_create_appointment,
            self.test_double_booking_prevention,
            self.test_confirm_appointment,
            self.test_slot_unavailable_after_booking
        ]
        
        for test in tests:
            test()
            print()
        
        # Résumé final
        print("=" * 60)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        
        print(f"Tests réussis: {passed}/{total}")
        print(f"Taux de réussite: {(passed/total)*100:.1f}%")
        
        if passed < total:
            print("\n❌ TESTS ÉCHOUÉS:")
            for result in self.results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        return passed == total

if __name__ == "__main__":
    tester = MediBookTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)