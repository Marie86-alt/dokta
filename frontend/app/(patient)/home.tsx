import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput
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

export default function PatientHome() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentDoctors, setRecentDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    fetchSpecialties();
    fetchRecentDoctors();
  }, []);

  const fetchSpecialities = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/specialties`);
      const data = await response.json();
      setSpecialties(data);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités:', error);
    }
  };

  const fetchRecentDoctors = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors`);
      const data = await response.json();
      setRecentDoctors(data.slice(0, 3)); // Prendre les 3 premiers
    } catch (error) {
      console.error('Erreur lors du chargement des médecins:', error);
    }
  };

  const handleSpecialtySelect = (specialty: string) => {
    router.push(`/doctor-search?specialty=${encodeURIComponent(specialty)}`);
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    router.push(`/booking/${doctor.id}`);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>Bonjour 👋</Text>
          <Text style={styles.title}>Trouvez votre médecin</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un médecin ou spécialité..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(patient)/appointments')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="calendar" size={24} color="#2E8B57" />
              </View>
              <Text style={styles.quickActionText}>Mes RDV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/emergency')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFE8E8' }]}>
                <Ionicons name="medical" size={24} color="#E74C3C" />
              </View>
              <Text style={styles.quickActionText}>Urgence</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(patient)/documents')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="document-text" size={24} color="#2E8B57" />
              </View>
              <Text style={styles.quickActionText}>Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/telemedicine')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F4FD' }]}>
                <Ionicons name="videocam" size={24} color="#3498DB" />
              </View>
              <Text style={styles.quickActionText}>Téléconsultation</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.specialtiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spécialités populaires</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.specialtiesScrollContainer}>
              {specialties.slice(0, 6).map((specialty) => (
                <TouchableOpacity
                  key={specialty.value}
                  style={styles.specialtyCard}
                  onPress={() => handleSpecialtySelect(specialty.value)}
                >
                  <View style={styles.specialtyIcon}>
                    <Ionicons name="medical" size={20} color="#2E8B57" />
                  </View>
                  <Text style={styles.specialtyText}>{specialty.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recent Doctors */}
        <View style={styles.doctorsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Médecins disponibles</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.doctorsContainer}>
            {recentDoctors.map((doctor) => (
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
                  <Text style={styles.doctorExperience}>{doctor.experience}</Text>
                  <Text style={styles.doctorPrice}>{formatPrice(doctor.tarif)}</Text>
                </View>
                <View style={styles.doctorActions}>
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 40,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E8F5E8',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '22%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  specialtiesSection: {
    marginBottom: 24,
  },
  specialtiesScrollContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16,
  },
  specialtyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  specialtyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  doctorsSection: {
    marginBottom: 24,
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
    shadowOffset: { width: 0, height: 2 },
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  doctorActions: {
    marginLeft: 16,
  },
});