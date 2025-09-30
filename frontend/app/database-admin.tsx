import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface Stats {
  doctors: number;
  appointments: number;
  users: number;
  today_appointments: number;
}

interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  tarif: number;
  telephone: string;
  disponible: boolean;
}

interface Appointment {
  id: string;
  patient_name: string;
  date: string;
  heure?: string;
  time?: string;
  status: string;
  consultation_type?: string;
  price?: number;
}

export default function DatabaseAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentView, setCurrentView] = useState<'stats' | 'doctors' | 'appointments'>('stats');
  const [loading, setLoading] = useState(false);

  const EXPO_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch(`http://localhost:8082/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/doctors`);
      const data = await response.json();
      setDoctors(data);
      setCurrentView('doctors');
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/appointments`);
      const data = await response.json();
      setAppointments(data);
      setCurrentView('appointments');
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>📊 Statistiques DOKTA</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={32} color="#2E8B57" />
          <Text style={styles.statNumber}>{stats?.doctors || 0}</Text>
          <Text style={styles.statLabel}>Médecins</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={32} color="#3498DB" />
          <Text style={styles.statNumber}>{stats?.appointments || 0}</Text>
          <Text style={styles.statLabel}>Rendez-vous</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="person-circle" size={32} color="#E67E22" />
          <Text style={styles.statNumber}>{stats?.users || 0}</Text>
          <Text style={styles.statLabel}>Utilisateurs</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="today" size={32} color="#E74C3C" />
          <Text style={styles.statNumber}>{stats?.today_appointments || 0}</Text>
          <Text style={styles.statLabel}>Aujourd'hui</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={loadDoctors}>
          <Ionicons name="medical" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Voir Médecins</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={loadAppointments}>
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Voir Rendez-vous</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDoctors = () => (
    <View style={styles.dataContainer}>
      <Text style={styles.sectionTitle}>👨‍⚕️ Médecins ({doctors.length})</Text>
      
      <ScrollView style={styles.dataList}>
        {doctors.map((doctor, index) => (
          <View key={doctor.id || index} style={styles.dataCard}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataName}>{doctor.nom}</Text>
              <Text style={[
                styles.statusBadge,
                doctor.disponible ? styles.available : styles.unavailable
              ]}>
                {doctor.disponible ? 'Disponible' : 'Indisponible'}
              </Text>
            </View>
            
            <View style={styles.dataDetails}>
              <Text style={styles.dataDetail}>
                <Ionicons name="medical" size={14} color="#666" /> {doctor.specialite}
              </Text>
              <Text style={styles.dataDetail}>
                <Ionicons name="call" size={14} color="#666" /> {doctor.telephone}
              </Text>
              <Text style={styles.dataDetail}>
                <Ionicons name="cash" size={14} color="#666" /> {formatPrice(doctor.tarif)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderAppointments = () => (
    <View style={styles.dataContainer}>
      <Text style={styles.sectionTitle}>📅 Rendez-vous ({appointments.length})</Text>
      
      <ScrollView style={styles.dataList}>
        {appointments.slice(0, 20).map((appointment, index) => (
          <View key={appointment.id || index} style={styles.dataCard}>
            <View style={styles.dataHeader}>
              <Text style={styles.dataName}>{appointment.patient_name || 'Patient'}</Text>
              <Text style={[
                styles.statusBadge,
                appointment.status === 'confirmed' ? styles.confirmed : styles.pending
              ]}>
                {appointment.status}
              </Text>
            </View>
            
            <View style={styles.dataDetails}>
              <Text style={styles.dataDetail}>
                <Ionicons name="calendar" size={14} color="#666" /> {appointment.date}
              </Text>
              <Text style={styles.dataDetail}>
                <Ionicons name="time" size={14} color="#666" /> {appointment.heure || appointment.time || 'Non défini'}
              </Text>
              {appointment.consultation_type && (
                <Text style={styles.dataDetail}>
                  <Ionicons name="location" size={14} color="#666" /> {appointment.consultation_type}
                </Text>
              )}
              {appointment.price && (
                <Text style={styles.dataDetail}>
                  <Ionicons name="cash" size={14} color="#666" /> {formatPrice(appointment.price)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏥 Admin DOKTA</Text>
        <TouchableOpacity onPress={loadStats} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, currentView === 'stats' && styles.activeTab]}
          onPress={() => setCurrentView('stats')}
        >
          <Text style={[styles.tabText, currentView === 'stats' && styles.activeTabText]}>
            📊 Stats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentView === 'doctors' && styles.activeTab]}
          onPress={loadDoctors}
        >
          <Text style={[styles.tabText, currentView === 'doctors' && styles.activeTabText]}>
            👨‍⚕️ Médecins
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, currentView === 'appointments' && styles.activeTab]}
          onPress={loadAppointments}
        >
          <Text style={[styles.tabText, currentView === 'appointments' && styles.activeTabText]}>
            📅 RDV
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <>
            {currentView === 'stats' && renderStats()}
            {currentView === 'doctors' && renderDoctors()}
            {currentView === 'appointments' && renderAppointments()}
          </>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2E8B57',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#2E8B57',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dataContainer: {
    flex: 1,
  },
  dataList: {
    flex: 1,
  },
  dataCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  available: {
    backgroundColor: '#E8F5E8',
    color: '#2E8B57',
  },
  unavailable: {
    backgroundColor: '#FFEBEE',
    color: '#E74C3C',
  },
  confirmed: {
    backgroundColor: '#E8F5E8',
    color: '#2E8B57',
  },
  pending: {
    backgroundColor: '#FFF3E0',
    color: '#E67E22',
  },
  dataDetails: {
    gap: 4,
  },
  dataDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});