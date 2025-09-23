import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Patient {
  id: string;
  nom: string;
  telephone: string;
  appointment_count: number;
  last_appointment: string | null;
}

export default function DoctorPatients() {
  const { doctorId } = useLocalSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [doctorId]);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/patients`);
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPatients = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient =>
      patient.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.telephone.includes(searchQuery)
    );
    setFilteredPatients(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPatients();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Aucune consultation';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handlePatientPress = (patient: Patient) => {
    Alert.alert(
      patient.nom,
      `Téléphone: ${patient.telephone}\nNombre de consultations: ${patient.appointment_count}\nDernière consultation: ${formatDate(patient.last_appointment)}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { 
          text: 'Voir historique', 
          onPress: () => {
            // Future feature: navigate to patient history
            Alert.alert('Bientôt disponible', 'L\'historique détaillé des consultations sera bientôt disponible');
          }
        }
      ]
    );
  };

  const renderPatientCard = (patient: Patient) => {
    const isRecentPatient = patient.last_appointment && 
      new Date(patient.last_appointment).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days

    return (
      <TouchableOpacity
        key={patient.id}
        style={styles.patientCard}
        onPress={() => handlePatientPress(patient)}
      >
        <View style={styles.patientHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={50} color="#2E8B57" />
            {isRecentPatient && <View style={styles.recentBadge} />}
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient.nom}</Text>
            <View style={styles.contactRow}>
              <Ionicons name="call" size={16} color="#666" />
              <Text style={styles.patientPhone}>{patient.telephone}</Text>
            </View>
          </View>
          <View style={styles.patientStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{patient.appointment_count}</Text>
              <Text style={styles.statLabel}>Consultations</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.patientFooter}>
          <View style={styles.lastAppointment}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.lastAppointmentText}>
              Dernière consultation: {formatDate(patient.last_appointment)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CCC" />
        </View>
      </TouchableOpacity>
    );
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mes Patients</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un patient..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{patients.length}</Text>
          <Text style={styles.summaryLabel}>Total Patients</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {patients.filter(p => p.last_appointment && 
              new Date(p.last_appointment).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)
            ).length}
          </Text>
          <Text style={styles.summaryLabel}>Ce mois-ci</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>
            {patients.reduce((sum, p) => sum + p.appointment_count, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Consultations</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Chargement des patients...</Text>
          </View>
        ) : filteredPatients.length > 0 ? (
          <>
            <Text style={styles.resultsText}>
              {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} 
              {searchQuery ? ` trouvé${filteredPatients.length > 1 ? 's' : ''}` : ''}
            </Text>
            {filteredPatients.map(renderPatientCard)}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            {searchQuery ? (
              <>
                <Ionicons name="search" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptyText}>
                  Aucun patient ne correspond à votre recherche "{searchQuery}"
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="people-outline" size={64} color="#CCC" />
                <Text style={styles.emptyTitle}>Aucun patient</Text>
                <Text style={styles.emptyText}>
                  Vous n'avez encore aucun patient. Les patients apparaîtront ici après leur première consultation confirmée.
                </Text>
              </>
            )}
          </View>
        )}
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
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  recentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    backgroundColor: '#27AE60',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientPhone: {
    fontSize: 14,
    color: '#666',
  },
  patientStats: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  patientFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  lastAppointment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  lastAppointmentText: {
    fontSize: 12,
    color: '#666',
  },
});