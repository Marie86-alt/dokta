import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Specialty {
  value: string;
  label: string;
}

interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  experience: string;
  tarif: number;
  telephone: string;
}

export default function Index() {
  const [selectedUserType, setSelectedUserType] = useState<'patient' | 'medecin' | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/specialties`);
      const data = await response.json();
      setSpecialties(data);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
      Alert.alert('Erreur', 'Impossible de charger les spécialités');
    }
  };

  const fetchDoctorsBySpecialty = async (specialty: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors?specialite=${encodeURIComponent(specialty)}`);
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
      Alert.alert('Erreur', 'Impossible de charger les médecins');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtySelect = (specialty: string) => {
    setSelectedSpecialty(specialty);
    fetchDoctorsBySpecialty(specialty);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    router.push({
      pathname: `/booking/${doctor.id}`,
      params: { doctorId: doctor.id }
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const resetNavigation = () => {
    setSelectedUserType(null);
    setSelectedSpecialty(null);
    setDoctors([]);
  };

  if (!selectedUserType) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="medical" size={40} color="#FFFFFF" />
            <Text style={styles.title}>MediBook Cameroun</Text>
            <Text style={styles.subtitle}>Votre santé, notre priorité</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.welcomeTitle}>Bienvenue</Text>
          <Text style={styles.welcomeText}>
            Réservez facilement vos consultations médicales en ligne
          </Text>
          
          <View style={styles.userTypeContainer}>
            <Text style={styles.sectionTitle}>Vous êtes :</Text>
            
            <TouchableOpacity
              style={styles.userTypeCard}
              onPress={() => setSelectedUserType('patient')}
            >
              <View style={styles.userTypeIcon}>
                <Ionicons name="person" size={30} color="#2E8B57" />
              </View>
              <View style={styles.userTypeContent}>
                <Text style={styles.userTypeTitle}>Patient</Text>
                <Text style={styles.userTypeDescription}>
                  Rechercher et réserver un rendez-vous
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.userTypeCard}
              onPress={() => setSelectedUserType('medecin')}
            >
              <View style={styles.userTypeIcon}>
                <Ionicons name="medical" size={30} color="#2E8B57" />
              </View>
              <View style={styles.userTypeContent}>
                <Text style={styles.userTypeTitle}>Médecin</Text>
                <Text style={styles.userTypeDescription}>
                  Gérer vos consultations et planning
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedUserType === 'patient' && !selectedSpecialty) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => resetNavigation()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Choisir une Spécialité</Text>
          </View>
        </View>
        
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Spécialités Médicales</Text>
          
          <View style={styles.specialtyGrid}>
            {specialties.map((specialty) => (
              <TouchableOpacity
                key={specialty.value}
                style={styles.specialtyCard}
                onPress={() => handleSpecialtySelect(specialty.value)}
              >
                <View style={styles.specialtyIcon}>
                  <Ionicons name="medical-outline" size={24} color="#2E8B57" />
                </View>
                <Text style={styles.specialtyTitle}>{specialty.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (selectedUserType === 'patient' && selectedSpecialty) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSpecialty(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Médecins - {selectedSpecialty}</Text>
          </View>
        </View>
        
        <ScrollView style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Chargement...</Text>
            </View>
          ) : (
            <View style={styles.doctorsContainer}>
              {doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={styles.doctorCard}
                  onPress={() => handleDoctorSelect(doctor)}
                >
                  <View style={styles.doctorAvatar}>
                    <Ionicons name="person-circle" size={50} color="#2E8B57" />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.nom}</Text>
                    <Text style={styles.doctorSpecialty}>{doctor.specialite}</Text>
                    <Text style={styles.doctorExperience}>Expérience: {doctor.experience}</Text>
                    <Text style={styles.doctorPrice}>{formatPrice(doctor.tarif)}</Text>
                  </View>
                  <View style={styles.doctorActions}>
                    <Ionicons name="calendar" size={24} color="#2E8B57" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Interface médecin (basique pour l'instant)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => resetNavigation()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Espace Médecin</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="construct" size={80} color="#2E8B57" />
          <Text style={styles.comingSoonTitle}>Bientôt Disponible</Text>
          <Text style={styles.comingSoonText}>
            L'interface médecin sera disponible prochainement
          </Text>
        </View>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  userTypeContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userTypeContent: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
  specialtyGrid: {
    gap: 12,
  },
  specialtyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  specialtyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  specialtyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  doctorsContainer: {
    gap: 12,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  doctorAvatar: {
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#2E8B57',
    marginBottom: 2,
  },
  doctorExperience: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  doctorPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  doctorActions: {
    marginLeft: 16,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});