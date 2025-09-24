import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface Patient {
  id: string;
  nom: string;
  age: number;
  lien?: string; // Relation avec le titulaire du compte
  telephone?: string;
}

export default function PatientSelectionScreen() {
  const { doctorId, consultationType, doctorName, price } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    nom: '',
    age: '',
    lien: '',
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = () => {
    // Charger les patients existants (pour l'instant, données simulées)
    const defaultPatients: Patient[] = [
      {
        id: '1',
        nom: user?.nom || 'Moi-même',
        age: user?.age || 30,
        lien: 'Titulaire',
        telephone: user?.telephone,
      }
    ];
    
    // Ajouter des membres de famille existants si ils existent
    const familyMembers = getFamilyMembers();
    setPatients([...defaultPatients, ...familyMembers]);
    
    // Sélectionner par défaut le titulaire du compte
    setSelectedPatient(defaultPatients[0]);
  };

  const getFamilyMembers = (): Patient[] => {
    // Ici on récupérerait les membres de famille depuis le backend
    // Pour l'instant, données simulées
    return [
      {
        id: '2',
        nom: 'Marie Dupont',
        age: 8,
        lien: 'Fille',
      },
      {
        id: '3',
        nom: 'Paul Dupont',
        age: 35,
        lien: 'Époux/Épouse',
      }
    ];
  };

  const handleAddPatient = () => {
    if (!newPatient.nom.trim() || !newPatient.age || !newPatient.lien.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const age = parseInt(newPatient.age);
    if (age < 1 || age > 120) {
      Alert.alert('Erreur', 'Âge invalide');
      return;
    }

    const patient: Patient = {
      id: Date.now().toString(),
      nom: newPatient.nom.trim(),
      age: age,
      lien: newPatient.lien.trim(),
    };

    setPatients(prev => [...prev, patient]);
    setSelectedPatient(patient);
    setNewPatient({ nom: '', age: '', lien: '' });
    setShowAddForm(false);
    
    Alert.alert('Succès', 'Patient ajouté avec succès');
  };

  const handleContinue = () => {
    if (!selectedPatient) {
      Alert.alert('Erreur', 'Veuillez sélectionner un patient');
      return;
    }

    // Rediriger vers la page de calendrier avec toutes les informations
    router.push({
      pathname: '/booking/calendar',
      params: {
        doctorId: doctorId as string,
        consultationType: consultationType as string,
        doctorName: doctorName as string,
        price: price as string,
        patientId: selectedPatient.id,
        patientName: selectedPatient.nom,
        patientAge: selectedPatient.age.toString(),
      }
    });
  };

  const formatPrice = (priceStr: string) => {
    return `${parseInt(priceStr).toLocaleString()} FCFA`;
  };

  const getConsultationTypeLabel = (type: string) => {
    switch (type) {
      case 'cabinet': return 'Consultation au cabinet';
      case 'domicile': return 'Consultation à domicile';
      case 'teleconsultation': return 'Téléconsultation';
      default: return 'Consultation';
    }
  };

  const getConsultationIcon = (type: string) => {
    switch (type) {
      case 'cabinet': return 'business';
      case 'domicile': return 'home';
      case 'teleconsultation': return 'videocam';
      default: return 'medical';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sélectionner le patient</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Consultation Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name={getConsultationIcon(consultationType as string)} size={24} color="#2E8B57" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Dr {doctorName}</Text>
              <Text style={styles.summaryType}>{getConsultationTypeLabel(consultationType as string)}</Text>
            </View>
            <Text style={styles.summaryPrice}>{formatPrice(price as string)}</Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={20} color="#3498DB" />
          <Text style={styles.instructionsText}>
            Sélectionnez pour qui vous prenez ce rendez-vous. Vous pouvez ajouter des membres de votre famille.
          </Text>
        </View>

        {/* Patient Selection */}
        <View style={styles.patientsSection}>
          <Text style={styles.sectionTitle}>Qui consulte ?</Text>
          
          {patients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={[
                styles.patientCard,
                selectedPatient?.id === patient.id && styles.patientCardSelected
              ]}
              onPress={() => setSelectedPatient(patient)}
            >
              <View style={styles.patientInfo}>
                <View style={styles.patientAvatar}>
                  <Ionicons name="person-circle" size={40} color="#2E8B57" />
                </View>
                <View style={styles.patientDetails}>
                  <Text style={styles.patientName}>{patient.nom}</Text>
                  <Text style={styles.patientMeta}>
                    {patient.age} ans • {patient.lien}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.radioButton,
                selectedPatient?.id === patient.id && styles.radioButtonSelected
              ]}>
                {selectedPatient?.id === patient.id && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Add Patient Button */}
          {!showAddForm ? (
            <TouchableOpacity
              style={styles.addPatientButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="person-add" size={20} color="#2E8B57" />
              <Text style={styles.addPatientText}>Ajouter un membre de famille</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.addPatientForm}>
              <Text style={styles.formTitle}>Nouveau patient</Text>
              
              <TextInput
                style={styles.formInput}
                placeholder="Nom et prénom"
                value={newPatient.nom}
                onChangeText={(text) => setNewPatient(prev => ({ ...prev, nom: text }))}
              />
              
              <TextInput
                style={styles.formInput}
                placeholder="Âge"
                value={newPatient.age}
                onChangeText={(text) => setNewPatient(prev => ({ ...prev, age: text }))}
                keyboardType="numeric"
                maxLength={3}
              />
              
              <TextInput
                style={styles.formInput}
                placeholder="Relation (Fils, Fille, Époux/Épouse, etc.)"
                value={newPatient.lien}
                onChangeText={(text) => setNewPatient(prev => ({ ...prev, lien: text }))}
              />
              
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewPatient({ nom: '', age: '', lien: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddPatient}
                >
                  <Text style={styles.saveButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedPatient && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedPatient}
        >
          <Text style={styles.continueButtonText}>
            Choisir la date de consultation
          </Text>
          <Ionicons name="calendar" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#2E8B57',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryType: {
    fontSize: 14,
    color: '#666',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  instructionsCard: {
    backgroundColor: '#E8F4FD',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsText: {
    fontSize: 14,
    color: '#3498DB',
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
  },
  patientsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  patientCardSelected: {
    borderColor: '#2E8B57',
    backgroundColor: '#E8F5E8',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientAvatar: {
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientMeta: {
    fontSize: 14,
    color: '#666',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  addPatientButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2E8B57',
    borderStyle: 'dashed',
    gap: 8,
  },
  addPatientText: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '600',
  },
  addPatientForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2E8B57',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});