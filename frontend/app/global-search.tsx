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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface SearchResult {
  id: string;
  type: 'doctor' | 'patient' | 'specialty';
  title: string;
  subtitle: string;
  metadata?: string;
  data?: any;
}

export default function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Cardiologie',
    'Dr. Marie Ngono',
    'Pédiatrie',
    'Généraliste'
  ]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Recherche des médecins
      const doctorsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors`);
      const doctors = await doctorsResponse.json();
      
      const filteredDoctors = doctors.filter((doctor: any) =>
        doctor.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialite.toLowerCase().includes(searchQuery.toLowerCase())
      );

      filteredDoctors.forEach((doctor: any) => {
        searchResults.push({
          id: doctor.id,
          type: 'doctor',
          title: doctor.nom,
          subtitle: doctor.specialite,
          metadata: `${doctor.tarif.toLocaleString()} FCFA • ${doctor.experience}`,
          data: doctor
        });
      });

      // Recherche des spécialités
      const specialtiesResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/specialties`);
      const specialties = await specialtiesResponse.json();
      
      const filteredSpecialties = specialties.filter((specialty: any) =>
        specialty.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

      filteredSpecialties.forEach((specialty: any) => {
        searchResults.push({
          id: specialty.value,
          type: 'specialty',
          title: specialty.label,
          subtitle: 'Spécialité médicale',
          metadata: `Voir tous les médecins`,
          data: specialty
        });
      });

      // Simulation recherche patients (à implémenter avec une vraie API)
      if (searchQuery.toLowerCase().includes('patient') || searchQuery.toLowerCase().includes('amina')) {
        searchResults.push({
          id: 'patient-1',
          type: 'patient',
          title: 'Amina Nkomo',
          subtitle: 'Patient',
          metadata: 'Dernière consultation: 24/09/2024',
          data: { nom: 'Amina Nkomo', telephone: '+237695123456' }
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultPress = (result: SearchResult) => {
    // Ajouter à l'historique de recherche
    if (!recentSearches.includes(result.title)) {
      setRecentSearches(prev => [result.title, ...prev.slice(0, 4)]);
    }

    switch (result.type) {
      case 'doctor':
        router.push(`/booking/${result.id}`);
        break;
      case 'specialty':
        router.push(`/doctor-search?specialty=${encodeURIComponent(result.data.value)}`);
        break;
      case 'patient':
        // Navigation vers le dossier patient (à implémenter)
        router.push(`/patient-profile?patientId=${result.id}`);
        break;
    }
  };

  const handleRecentSearchPress = (search: string) => {
    setSearchQuery(search);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'doctor': return 'person';
      case 'patient': return 'person-circle';
      case 'specialty': return 'medical';
      default: return 'search';
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case 'doctor': return '#2E8B57';
      case 'patient': return '#3498DB';
      case 'specialty': return '#9B59B6';
      default: return '#666';
    }
  };

  const renderSearchSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>Suggestions de recherche</Text>
      <View style={styles.suggestionsList}>
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => setSearchQuery('Cardiologie')}
        >
          <Ionicons name="heart" size={16} color="#E74C3C" />
          <Text style={styles.suggestionText}>Cardiologie</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => setSearchQuery('Généraliste')}
        >
          <Ionicons name="medical" size={16} color="#2E8B57" />
          <Text style={styles.suggestionText}>Généraliste</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => setSearchQuery('Pédiatrie')}
        >
          <Ionicons name="happy" size={16} color="#F39C12" />
          <Text style={styles.suggestionText}>Pédiatrie</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.suggestionChip}
          onPress={() => setSearchQuery('Dermatologie')}
        >
          <Ionicons name="body" size={16} color="#9B59B6" />
          <Text style={styles.suggestionText}>Dermatologie</Text>
        </TouchableOpacity>
      </View>
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
        <Text style={styles.title}>Recherche globale</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher médecins, patients, spécialités..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        )}

        {/* Search Results */}
        {results.length > 0 && !loading && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </Text>
            
            {results.map((result) => (
              <TouchableOpacity
                key={`${result.type}-${result.id}`}
                style={styles.resultCard}
                onPress={() => handleResultPress(result)}
              >
                <View style={[
                  styles.resultIcon,
                  { backgroundColor: getResultColor(result.type) + '20' }
                ]}>
                  <Ionicons
                    name={getResultIcon(result.type) as any}
                    size={24}
                    color={getResultColor(result.type)}
                  />
                </View>
                
                <View style={styles.resultContent}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                  <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                  {result.metadata && (
                    <Text style={styles.resultMetadata}>{result.metadata}</Text>
                  )}
                </View>
                
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Results */}
        {results.length === 0 && !loading && searchQuery.length >= 2 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={64} color="#CCC" />
            <Text style={styles.noResultsTitle}>Aucun résultat</Text>
            <Text style={styles.noResultsText}>
              Aucun résultat trouvé pour "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Recent Searches */}
        {searchQuery.length === 0 && recentSearches.length > 0 && (
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>Recherches récentes</Text>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentItem}
                onPress={() => handleRecentSearchPress(search)}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.recentText}>{search}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {searchQuery.length === 0 && renderSearchSuggestions()}

        {/* Search Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Conseils de recherche</Text>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={16} color="#F39C12" />
            <Text style={styles.tipText}>
              Utilisez le nom du médecin ou la spécialité
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={16} color="#F39C12" />
            <Text style={styles.tipText}>
              Tapez au moins 2 caractères pour commencer
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="bulb-outline" size={16} color="#F39C12" />
            <Text style={styles.tipText}>
              Recherchez par spécialité pour voir tous les médecins
            </Text>
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
  backButton: {
    marginRight: 16,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    width: 24,
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
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#2E8B57',
    marginBottom: 2,
  },
  resultMetadata: {
    fontSize: 12,
    color: '#666',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  recentContainer: {
    marginBottom: 24,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});