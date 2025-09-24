import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl
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
}

interface Appointment {
  id: string;
  date: string;
  heure: string;
  status: string;
  tarif: number;
  doctor?: {
    nom: string;
    specialite: string;
  };
}

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
}

export default function PatientTabs() {
  const [activeTab, setActiveTab] = useState<'home' | 'appointments' | 'documents' | 'messages' | 'profile'>('home');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'home') {
      fetchSpecialties();
      fetchDoctors();
    } else if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchSpecialties = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/specialties`);
      const data = await response.json();
      setSpecialties(data);
    } catch (error) {
      console.error('Erreur spécialités:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors`);
      const data = await response.json();
      setDoctors(data.slice(0, 3)); // Prendre les 3 premiers
    } catch (error) {
      console.error('Erreur médecins:', error);
    }
  };

  const fetchAppointments = () => {
    // Simulation - à remplacer par vraie API
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        date: '2024-09-25',
        heure: '09:00',
        status: 'confirme',
        tarif: 15000,
        doctor: { nom: 'Dr. Marie Ngono', specialite: 'Généraliste' }
      },
      {
        id: '2',
        date: '2024-09-20',
        heure: '14:30',
        status: 'termine',
        tarif: 25000,
        doctor: { nom: 'Dr. Jean Mbarga', specialite: 'Cardiologie' }
      }
    ];
    setAppointments(mockAppointments);
  };

  const fetchDocuments = () => {
    // Simulation - à remplacer par vraie API
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Ordonnance - Dr. Marie Ngono',
        type: 'prescription',
        date: '2024-09-20'
      },
      {
        id: '2',
        name: 'Résultats analyse sanguine',
        type: 'result',
        date: '2024-09-15'
      }
    ];
    setDocuments(mockDocuments);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      if (activeTab === 'home') {
        fetchSpecialties();
        fetchDoctors();
      } else if (activeTab === 'appointments') {
        fetchAppointments();
      } else if (activeTab === 'documents') {
        fetchDocuments();
      }
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

  const renderHome = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('appointments')}
          >
            <Ionicons name="calendar" size={24} color="#2E8B57" />
            <Text style={styles.quickActionText}>Mes RDV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="medical" size={24} color="#E74C3C" />
            <Text style={styles.quickActionText}>Urgence</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('documents')}
          >
            <Ionicons name="document-text" size={24} color="#2E8B57" />
            <Text style={styles.quickActionText}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <Ionicons name="videocam" size={24} color="#3498DB" />
            <Text style={styles.quickActionText}>Téléconsultation</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spécialités populaires</Text>
        <View style={styles.specialtyGrid}>
          {specialties.slice(0, 4).map((specialty) => (
            <TouchableOpacity
              key={specialty.value}
              style={styles.specialtyCard}
              onPress={() => router.push(`/doctor-search?specialty=${encodeURIComponent(specialty.value)}`)}
            >
              <Ionicons name="medical" size={20} color="#2E8B57" />
              <Text style={styles.specialtyText}>{specialty.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Doctors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Médecins disponibles</Text>
        {doctors.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            style={styles.doctorCard}
            onPress={() => router.push(`/booking/${doctor.id}`)}
          >
            <Ionicons name="person-circle" size={50} color="#2E8B57" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.nom}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialite}</Text>
              <Text style={styles.doctorPrice}>{formatPrice(doctor.tarif)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
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
              {appointment.doctor && (
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>{appointment.doctor.nom}</Text>
                  <Text style={styles.doctorSpecialty}>{appointment.doctor.specialite}</Text>
                  <Text style={styles.doctorPrice}>{formatPrice(appointment.tarif)}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => setActiveTab('home')}
            >
              <Text style={styles.bookButtonText}>Réserver un rendez-vous</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderDocuments = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes documents</Text>
        {documents.length > 0 ? (
          documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <Ionicons name="document-text" size={24} color="#2E8B57" />
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.name}</Text>
                <Text style={styles.documentDate}>
                  {new Date(doc.date).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Aucun document</Text>
            <Text style={styles.emptyText}>Vos documents médicaux apparaîtront ici</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderMessages = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
        <Text style={styles.comingSoonTitle}>Messages</Text>
        <Text style={styles.comingSoonText}>
          La messagerie avec vos médecins sera bientôt disponible
        </Text>
      </View>
    </View>
  );

  const renderProfile = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon profil</Text>
        <View style={styles.profileCard}>
          <Ionicons name="person-circle" size={80} color="#2E8B57" />
          <Text style={styles.profileName}>Patient</Text>
          <Text style={styles.profileEmail}>patient@example.com</Text>
        </View>
        
        <View style={styles.profileOptions}>
          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.profileOptionText}>Informations personnelles</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="notifications" size={20} color="#666" />
            <Text style={styles.profileOptionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="help-circle" size={20} color="#666" />
            <Text style={styles.profileOptionText}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCC" />
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
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'home' && 'Accueil'}
          {activeTab === 'appointments' && 'Rendez-vous'}
          {activeTab === 'documents' && 'Documents'}
          {activeTab === 'messages' && 'Messages'}
          {activeTab === 'profile' && 'Profil'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'appointments' && renderAppointments()}
      {activeTab === 'documents' && renderDocuments()}
      {activeTab === 'messages' && renderMessages()}
      {activeTab === 'profile' && renderProfile()}

      {/* Bottom Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'home' && styles.tabActive]}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'home' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'home' && styles.tabTextActive
          ]}>
            Accueil
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
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons
            name={activeTab === 'messages' ? 'chatbubbles' : 'chatbubbles-outline'}
            size={24}
            color={activeTab === 'messages' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'messages' && styles.tabTextActive
          ]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={24}
            color={activeTab === 'profile' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'profile' && styles.tabTextActive
          ]}>
            Profil
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specialtyCard: {
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
  specialtyText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  doctorCard: {
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
  doctorInfo: {
    flex: 1,
    marginLeft: 16,
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
    marginBottom: 4,
  },
  doctorPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E8B57',
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
  documentCard: {
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
  documentInfo: {
    flex: 1,
    marginLeft: 16,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 14,
    color: '#666',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
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
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  bookButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#2E8B57',
  },
});