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

interface Patient {
  id: string;
  nom: string;
  telephone: string;
}

interface Appointment {
  id: string;
  date: string;
  heure: string;
  status: string;
  tarif: number;
  patient: Patient | null;
}

export default function DoctorAppointments() {
  const { doctorId } = useLocalSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending' | 'confirmed'>('all');

  useEffect(() => {
    fetchAppointments();
  }, [doctorId, filter]);

  const fetchAppointments = async () => {
    try {
      let url = `${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/appointments`;
      
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        url += `?date=${today}`;
      } else if (filter === 'pending') {
        url += '?status=en_attente';
      } else if (filter === 'confirmed') {
        url += '?status=confirme';
      }

      const response = await fetch(url);
      const data = await response.json();
      
      // Trier par date et heure
      const sortedAppointments = data.sort((a: Appointment, b: Appointment) => {
        const dateA = new Date(`${a.date} ${a.heure}`);
        const dateB = new Date(`${b.date} ${b.heure}`);
        return dateB.getTime() - dateA.getTime();
      });
      
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/appointments/${appointmentId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchAppointments(); // Recharger la liste
        Alert.alert('Succès', 'Statut mis à jour avec succès');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirme': return '#27AE60';
      case 'en_attente': return '#F39C12';
      case 'annule': return '#E74C3C';
      case 'termine': return '#3498DB';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirme': return 'Confirmé';
      case 'en_attente': return 'En attente';
      case 'annule': return 'Annulé';
      case 'termine': return 'Terminé';
      default: return status;
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.appointmentDate}>
            {new Date(appointment.date).toLocaleDateString('fr-FR')}
          </Text>
          <Text style={styles.appointmentTime}>{appointment.heure}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(appointment.status) }
        ]}>
          <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
        </View>
      </View>

      <View style={styles.patientInfo}>
        <Ionicons name="person" size={20} color="#666" />
        <Text style={styles.patientName}>
          {appointment.patient?.nom || 'Patient inconnu'}
        </Text>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="call" size={16} color="#666" />
          <Text style={styles.detailText}>
            {appointment.patient?.telephone || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#666" />
          <Text style={styles.detailText}>{formatPrice(appointment.tarif)}</Text>
        </View>
      </View>

      {appointment.status === 'en_attente' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => updateAppointmentStatus(appointment.id, 'confirme')}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              Alert.alert(
                'Annuler le rendez-vous',
                'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
                [
                  { text: 'Non', style: 'cancel' },
                  {
                    text: 'Oui, annuler',
                    onPress: () => updateAppointmentStatus(appointment.id, 'annule'),
                    style: 'destructive'
                  }
                ]
              );
            }}
          >
            <Ionicons name="close" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {appointment.status === 'confirme' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton]}
          onPress={() => updateAppointmentStatus(appointment.id, 'termine')}
        >
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Marquer comme terminé</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
          <Text style={styles.title}>Mes Rendez-vous</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive
            ]}>
              Tous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'today' && styles.filterButtonActive]}
            onPress={() => setFilter('today')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'today' && styles.filterButtonTextActive
            ]}>
              Aujourd'hui
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'pending' && styles.filterButtonTextActive
            ]}>
              En attente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'confirmed' && styles.filterButtonActive]}
            onPress={() => setFilter('confirmed')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'confirmed' && styles.filterButtonTextActive
            ]}>
              Confirmés
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Chargement des rendez-vous...</Text>
          </View>
        ) : appointments.length > 0 ? (
          appointments.map(renderAppointmentCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
            <Text style={styles.emptyText}>
              {filter === 'all' 
                ? 'Vous n\'avez aucun rendez-vous pour le moment'
                : `Aucun rendez-vous ${filter === 'today' ? 'aujourd\'hui' : filter}`
              }
            </Text>
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2E8B57',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
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
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  appointmentDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  confirmButton: {
    backgroundColor: '#27AE60',
  },
  cancelButton: {
    backgroundColor: '#E74C3C',
  },
  completeButton: {
    backgroundColor: '#3498DB',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});