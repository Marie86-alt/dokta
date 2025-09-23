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
  monthly_appointments: number;
}

interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  experience: string;
  tarif: number;
  telephone: string;
  disponible: boolean;
}

export default function DoctorDashboard() {
  const { doctorId } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [doctorId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/dashboard`);
      const data = await response.json();
      
      setDoctor(data.doctor);
      setStats(data.stats);
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const navigateToAppointments = () => {
    router.push(`/doctor-appointments?doctorId=${doctorId}`);
  };

  const navigateToProfile = () => {
    router.push(`/doctor-profile?doctorId=${doctorId}`);
  };

  const navigateToAvailability = () => {
    router.push(`/doctor-availability?doctorId=${doctorId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement du tableau de bord...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Tableau de Bord</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={navigateToProfile}
        >
          <Ionicons name="person-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Doctor Info */}
        {doctor && (
          <View style={styles.doctorCard}>
            <View style={styles.doctorHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={60} color="#2E8B57" />
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctor.nom}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialite}</Text>
                <Text style={styles.doctorExperience}>{doctor.experience}</Text>
                <Text style={styles.doctorTarif}>{formatPrice(doctor.tarif)}</Text>
              </View>
              <View style={styles.statusIndicator}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: doctor.disponible ? '#27AE60' : '#E74C3C' }
                ]} />
                <Text style={styles.statusText}>
                  {doctor.disponible ? 'Disponible' : 'Indisponible'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar-today" size={24} color="#3498DB" />
                </View>
                <Text style={styles.statValue}>{stats.today_appointments}</Text>
                <Text style={styles.statLabel}>Aujourd'hui</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
                </View>
                <Text style={styles.statValue}>{stats.confirmed_appointments}</Text>
                <Text style={styles.statLabel}>Confirmés</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="time" size={24} color="#F39C12" />
                </View>
                <Text style={styles.statValue}>{stats.pending_appointments}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="calendar" size={24} color="#9B59B6" />
                </View>
                <Text style={styles.statValue}>{stats.total_appointments}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* Revenue Card */}
        {stats && (
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Ionicons name="trending-up" size={24} color="#2E8B57" />
              <Text style={styles.revenueTitle}>Revenus de ce mois</Text>
            </View>
            <Text style={styles.revenueAmount}>{formatPrice(stats.monthly_revenue)}</Text>
            <Text style={styles.revenueSubtext}>
              {stats.monthly_appointments} consultations confirmées
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToAppointments}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="calendar" size={24} color="#2E8B57" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes Rendez-vous</Text>
              <Text style={styles.actionDescription}>
                Gérer vos consultations et horaires
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToAvailability}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="time" size={24} color="#2E8B57" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Disponibilités</Text>
              <Text style={styles.actionDescription}>
                Configurer vos créneaux horaires
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/doctor-patients?doctorId=${doctorId}`)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={24} color="#2E8B57" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes Patients</Text>
              <Text style={styles.actionDescription}>
                Historique et dossiers patients
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={navigateToProfile}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="settings" size={24} color="#2E8B57" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mon Profil</Text>
              <Text style={styles.actionDescription}>
                Modifier mes informations personnelles
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
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
  profileButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarContainer: {
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
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
    marginBottom: 2,
  },
  doctorExperience: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  doctorTarif: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
    minWidth: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  revenueCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
    marginLeft: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
});