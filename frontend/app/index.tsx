import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface SearchResult {
  id: string;
  type: 'doctor' | 'specialty';
  title: string;
  subtitle: string;
  metadata?: string;
}

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

export default function Index() {
  const [activeTab, setActiveTab] = useState<'accueil' | 'rendez-vous' | 'documents' | 'messages' | 'compte'>('accueil');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [featuredDoctors, setFeaturedDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const fetchInitialData = async () => {
    try {
      // Charger spécialités
      const specialtiesResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/specialties`);
      const specialtiesData = await specialtiesResponse.json();
      setSpecialties(specialtiesData);

      // Charger médecins populaires
      const doctorsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors`);
      const doctorsData = await doctorsResponse.json();
      setFeaturedDoctors(doctorsData.slice(0, 3));
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResultPress = (result: SearchResult) => {
    setSearchQuery('');
    setShowResults(false);
    
    if (result.type === 'doctor') {
      router.push(`/booking/${result.id}`);
    } else if (result.type === 'specialty') {
      router.push(`/doctor-search?specialty=${encodeURIComponent(result.title)}`);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const renderAccueilTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Main Search Section - Style Doctolib */}
      <View style={styles.mainSearchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchTitle}>Trouvez et prenez rendez-vous avec un professionnel de santé</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Spécialité, médecin, établissement..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setShowResults(false);
              }}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Results Overlay */}
          {showResults && searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {loading ? (
                <View style={styles.searchLoading}>
                  <Text style={styles.loadingText}>Recherche...</Text>
                </View>
              ) : (
                searchResults.slice(0, 5).map((result) => (
                  <TouchableOpacity
                    key={`${result.type}-${result.id}`}
                    style={styles.searchResultItem}
                    onPress={() => handleSearchResultPress(result)}
                  >
                    <Ionicons
                      name={result.type === 'doctor' ? 'person' : 'medical'}
                      size={20}
                      color="#2E8B57"
                    />
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultTitle}>{result.title}</Text>
                      <Text style={styles.searchResultSubtitle}>{result.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Services rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('rendez-vous')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="calendar" size={24} color="#2E8B57" />
            </View>
            <Text style={styles.quickActionText}>Prendre RDV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFE8E8' }]}>
              <Ionicons name="medical" size={24} color="#E74C3C" />
            </View>
            <Text style={styles.quickActionText}>Urgences</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="videocam" size={24} color="#3498DB" />
            </View>
            <Text style={styles.quickActionText}>Téléconsult.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setActiveTab('documents')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="document-text" size={24} color="#9B59B6" />
            </View>
            <Text style={styles.quickActionText}>Documents</Text>
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
                style={styles.specialtyChip}
                onPress={() => router.push(`/doctor-search?specialty=${encodeURIComponent(specialty.value)}`)}
              >
                <Ionicons name="medical-outline" size={16} color="#2E8B57" />
                <Text style={styles.specialtyChipText}>{specialty.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Featured Doctors */}
      <View style={styles.doctorsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Médecins recommandés</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {featuredDoctors.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            style={styles.doctorCard}
            onPress={() => router.push(`/booking/${doctor.id}`)}
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
            <View style={styles.doctorRating}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#F39C12" />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CCC" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Conseils santé</Text>
        <View style={styles.tipCard}>
          <Ionicons name="heart" size={24} color="#E74C3C" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Prévention cardiovasculaire</Text>
            <Text style={styles.tipDescription}>
              30 minutes d'activité physique par jour réduisent les risques
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderOtherTabs = (tabName: string) => (
    <View style={styles.comingSoonContainer}>
      <Ionicons
        name={
          tabName === 'rendez-vous' ? 'calendar-outline' :
          tabName === 'documents' ? 'document-text-outline' :
          tabName === 'messages' ? 'chatbubbles-outline' : 'person-circle-outline'
        }
        size={64}
        color="#CCC"
      />
      <Text style={styles.comingSoonTitle}>
        {tabName === 'rendez-vous' && 'Mes Rendez-vous'}
        {tabName === 'documents' && 'Mes Documents'}
        {tabName === 'messages' && 'Messages'}
        {tabName === 'compte' && 'Mon Compte'}
      </Text>
      <Text style={styles.comingSoonText}>
        {tabName === 'compte' 
          ? 'Connectez-vous pour accéder à votre compte'
          : 'Cette section sera bientôt disponible'
        }
      </Text>
      
      {tabName === 'compte' && (
        <View style={styles.accountActions}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => Alert.alert('Connexion Patient', 'Fonctionnalité bientôt disponible')}
          >
            <Ionicons name="person" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => Alert.alert('Inscription Patient', 'Fonctionnalité bientôt disponible')}
          >
            <Ionicons name="person-add" size={20} color="#2E8B57" />
            <Text style={styles.registerButtonText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>DOKTA</Text>
          <Text style={styles.appSubtitle}>Santé digitale - Cameroun</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'accueil' && renderAccueilTab()}
      {activeTab === 'rendez-vous' && renderOtherTabs('rendez-vous')}
      {activeTab === 'documents' && renderOtherTabs('documents')}
      {activeTab === 'messages' && renderOtherTabs('messages')}
      {activeTab === 'compte' && renderOtherTabs('compte')}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accueil' && styles.tabActive]}
          onPress={() => setActiveTab('accueil')}
        >
          <Ionicons
            name={activeTab === 'accueil' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'accueil' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'accueil' && styles.tabTextActive
          ]}>
            Accueil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'rendez-vous' && styles.tabActive]}
          onPress={() => setActiveTab('rendez-vous')}
        >
          <Ionicons
            name={activeTab === 'rendez-vous' ? 'calendar' : 'calendar-outline'}
            size={24}
            color={activeTab === 'rendez-vous' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'rendez-vous' && styles.tabTextActive
          ]}>
            Rendez-vous
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
          style={[styles.tab, activeTab === 'compte' && styles.tabActive]}
          onPress={() => setActiveTab('compte')}
        >
          <Ionicons
            name={activeTab === 'compte' ? 'person' : 'person-outline'}
            size={24}
            color={activeTab === 'compte' ? '#2E8B57' : '#999'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'compte' && styles.tabTextActive
          ]}>
            Compte
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Doctor Button */}
      <TouchableOpacity
        style={styles.doctorFloatingButton}
        onPress={() => router.push('/doctor-login')}
      >
        <Ionicons name="medical" size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#E8F5E8',
    marginTop: 2,
  },
  headerButton: {
    padding: 8,
  },
  tabContent: {
    flex: 1,
  },
  searchSection: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  searchContainer: {
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
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
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  searchResults: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 300,
    zIndex: 1000,
  },
  searchLoading: {
    padding: 16,
    alignItems: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultContent: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  quickActionsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
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
    justifyContent: 'space-between',
  },
  quickActionCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  specialtiesScrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  specialtyChipText: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '500',
  },
  doctorsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  doctorAvatar: {
    marginRight: 12,
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
  doctorRating: {
    alignItems: 'flex-end',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#F39C12',
    marginLeft: 2,
    fontWeight: '600',
  },
  tipsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 100,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabActive: {
    // Style géré par les couleurs d'icône et texte
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginTop: 2,
  },
  tabTextActive: {
    color: '#2E8B57',
  },
});