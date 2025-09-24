import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DashboardStats {
  total_appointments: number;
  today_appointments: number;
  confirmed_appointments: number;
  pending_appointments: number;
  monthly_revenue: number;
}

interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  experience: string;
  tarif: number;
  disponible: boolean;
}

interface Appointment {
  id: string;
  date: string;
  heure: string;
  status: string;
  patient?: {
    nom: string;
  };
}

export default function DoctorTabs() {
  const { doctorId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'appointments' | 'documents' | 'patients' | 'settings'>('dashboard');
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (doctorId) {
      fetchDoctorData();
    }
  }, [doctorId, activeTab]);

  const fetchDoctorData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/dashboard`);
        const data = await response.json();
        setDoctor(data.doctor);
        setStats(data.stats);
      } else if (activeTab === 'appointments') {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/appointments`);
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Erreur chargement données médecin:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      fetchDoctorData();
      setRefreshing(false);
    }, 1000);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirme': return '#27AE60';
      case 'en_attente': return '#F39C12';
      case 'termine': return '#3498DB';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirme': return 'Confirmé';
      case 'en_attente': return 'En attente';
      case 'termine': return 'Terminé';
      default: return status;
    }
  };

  const renderDashboard = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Doctor Info */}
      {doctor && (
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <Ionicons name="person-circle" size={60} color="#2E8B57" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.nom}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialite}</Text>
              <Text style={styles.doctorTarif}>{formatPrice(doctor.tarif)}</Text>
            </View>
            <View style={[
              styles.statusDot,
              { backgroundColor: doctor.disponible ? '#27AE60' : '#E74C3C' }
            ]} />
          </View>
        </View>
      )}

      {/* Stats */}
      {stats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="calendar-today" size={24} color="#3498DB" />
              <Text style={styles.statValue}>{stats.today_appointments}</Text>
              <Text style={styles.statLabel}>Aujourd'hui</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
              <Text style={styles.statValue}>{stats.confirmed_appointments}</Text>
              <Text style={styles.statLabel}>Confirmés</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#F39C12" />
              <Text style={styles.statValue}>{stats.pending_appointments}</Text>
              <Text style={styles.statLabel}>En attente</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#2E8B57" />
              <Text style={styles.statValue}>{formatPrice(stats.monthly_revenue)}</Text>
              <Text style={styles.statLabel}>Revenus</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveTab('appointments')}
          >
            <Ionicons name="calendar" size={24} color="#2E8B57" />
            <Text style={styles.actionText}>Mes RDV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveTab('documents')}
          >
            <Ionicons name="document-text" size={24} color="#2E8B57" />
            <Text style={styles.actionText}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setActiveTab('patients')}
          >
            <Ionicons name="people" size={24} color="#2E8B57" />
            <Text style={styles.actionText}>Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/doctor-availability?doctorId=${doctorId}`)}
          >
            <Ionicons name="time" size={24} color="#2E8B57" />
            <Text style={styles.actionText}>Disponibilités</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderAppointments = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes rendez-vous</Text>
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentDate}>
                  {new Date(appointment.date).toLocaleDateString('fr-FR')} à {appointment.heure}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(appointment.status) }
                ]}>
                  <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
                </View>
              </View>
              {appointment.patient && (
                <Text style={styles.patientName}>Patient: {appointment.patient.nom}</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderDocuments = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Ionicons name="document-text-outline" size={64} color="#CCC" />
        <Text style={styles.comingSoonTitle}>Gestion des Documents</Text>
        <Text style={styles.comingSoonText}>
          Créez des ordonnances et certificats médicaux
        </Text>
        <TouchableOpacity
          style={styles.comingSoonButton}
          onPress={() => router.push('/doctor-documents')}
        >
          <Text style={styles.comingSoonButtonText}>Accéder aux documents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPatients = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Ionicons name="people-outline" size={64} color="#CCC" />
        <Text style={styles.comingSoonTitle}>Mes Patients</Text>
        <Text style={styles.comingSoonText}>
          Consultez la liste de vos patients
        </Text>
        <TouchableOpacity
          style={styles.comingSoonButton}
          onPress={() => router.push(`/doctor-patients?doctorId=${doctorId}`)}
        >
          <Text style={styles.comingSoonButtonText}>Voir mes patients</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres</Text>
        
        <View style={styles.settingsOptions}>
          <TouchableOpacity
            style={styles.settingOption}
            onPress={() => router.push(`/doctor-profile?doctorId=${doctorId}`)}
          >
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.settingOptionText}>Mon profil</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingOption}
            onPress={() => router.push(`/doctor-availability?doctorId=${doctorId}`)}
          >
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.settingOptionText}>Disponibilités</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingOption}>
            <Ionicons name="notifications" size={20} color="#666" />
            <Text style={styles.settingOptionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingOption}>
            <Ionicons name="help-circle" size={20} color="#666" />
            <Text style={styles.settingOptionText}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingOption, styles.logoutOption]}
            onPress={() => {
              Alert.alert(
                'Déconnexion',
                'Êtes-vous sûr de vouloir vous déconnecter ?',
                [
                  { text: 'Annuler' },
                  { text: 'Déconnecter', onPress: () => router.replace('/') }
                ]
              );
            }}
          >
            <Ionicons name="log-out" size={20} color="#E74C3C" />
            <Text style={[styles.settingOptionText, { color: '#E74C3C' }]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'dashboard' && 'Tableau de Bord'}
          {activeTab === 'appointments' && 'Rendez-vous'}
          {activeTab === 'documents' && 'Documents'}
          {activeTab === 'patients' && 'Patients'}
          {activeTab === 'settings' && 'Paramètres'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'appointments' && renderAppointments()}
      {activeTab === 'documents' && renderDocuments()}
      {activeTab === 'patients' && renderPatients()}
      {activeTab === 'settings' && renderSettings()}

      {/* Bottom Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons
            name={activeTab === 'dashboard' ? 'stats-chart' : 'stats-chart-outline'}
            size={24}
            color={activeTab === 'dashboard' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'dashboard' && styles.tabTextActive
          ]}>
            Tableau de Bord
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <Ionicons
            name={activeTab === 'appointments' ? 'calendar' : 'calendar-outline'}
            size={24}
            color={activeTab === 'appointments' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'appointments' && styles.tabTextActive
          ]}>
            RDV
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Ionicons
            name={activeTab === 'documents' ? 'document-text' : 'document-text-outline'}
            size={24}
            color={activeTab === 'documents' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'documents' && styles.tabTextActive
          ]}>
            Documents
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'patients' && styles.tabActive]}
          onPress={() => setActiveTab('patients')}
        >
          <Ionicons
            name={activeTab === 'patients' ? 'people' : 'people-outline'}
            size={24}
            color={activeTab === 'patients' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'patients' && styles.tabTextActive
          ]}>
            Patients
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={24}
            color={activeTab === 'settings' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'settings' && styles.tabTextActive
          ]}>
            Paramètres
          </Text>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 24,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#2E8B57',
    marginBottom: 4,
  },
  doctorTarif: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
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
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  appointmentCard: {
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  patientName: {
    fontSize: 14,
    color: '#666',
  },
  settingsOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  settingOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  comingSoonButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  comingSoonButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    // Style actif géré par la couleur de l'icône et du texte
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#2E8B57',
  },
});