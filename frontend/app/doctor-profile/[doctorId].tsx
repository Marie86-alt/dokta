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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  experience: string;
  tarif: number;
  diplomes?: string;
  adresse?: string;
  telephone?: string;
  presentation?: string;
  rating?: number;
  disponible?: boolean;
}

export default function DoctorProfileScreen() {
  const { doctorId } = useLocalSearchParams();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    fetchDoctorProfile();
  }, [doctorId]);

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}`);
      const doctorData = await response.json();
      
      // Ajouter des données supplémentaires si elles n'existent pas
      const enhancedDoctor = {
        ...doctorData,
        adresse: doctorData.adresse || getDefaultAddress(doctorData.specialite),
        presentation: doctorData.presentation || getDefaultPresentation(doctorData.nom, doctorData.specialite, doctorData.experience),
        rating: doctorData.rating || 4.8,
        telephone: doctorData.telephone || '+237699123456',
      };
      
      setDoctor(enhancedDoctor);
    } catch (error) {
      console.error('Erreur chargement profil médecin:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil du médecin');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAddress = (specialite: string): string => {
    const addresses = {
      'Cardiologue': 'Centre Médical du Cœur, Rue 1.234, Bonanjo, Douala',
      'Généraliste': 'Cabinet Médical Central, Avenue Kennedy, Yaoundé',
      'Pédiatre': 'Clinique de l\'Enfant, Quartier Bonapriso, Douala',
      'Gynécologue': 'Centre de Santé de la Femme, Bastos, Yaoundé',
      'Dermatologue': 'Clinique Dermatologique, Akwa, Douala',
      'Ophtalmologue': 'Centre de la Vision, Mvan, Yaoundé',
      'Orthopédiste': 'Clinique Orthopédique, Bali, Douala',
      'Psychiatre': 'Centre de Santé Mentale, Essos, Yaoundé',
    };
    return addresses[specialite as keyof typeof addresses] || 'Cabinet Médical, Centre-ville, Douala';
  };

  const getDefaultPresentation = (nom: string, specialite: string, experience: string): string => {
    return `Dr ${nom} est un(e) ${specialite.toLowerCase()} expérimenté(e) avec ${experience}. 

Diplômé(e) de l'Université de Yaoundé I, Dr ${nom} s'est spécialisé(e) en ${specialite.toLowerCase()} et exerce dans les meilleures conditions.

Passionné(e) par son métier, Dr ${nom} accorde une attention particulière à l'écoute de ses patients et propose des soins de qualité adaptés aux besoins de chacun.

Consultations disponibles au cabinet, à domicile ou en téléconsultation selon vos préférences.`;
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const handleConsultationType = (type: 'cabinet' | 'domicile' | 'teleconsultation') => {
    console.log(`Clic sur ${type}, doctor:`, doctor);
    console.log('User context:', user);
    
    if (!user) {
      console.log('Pas d\'utilisateur connecté, affichage alerte connexion');
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour prendre rendez-vous', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => router.push('/login') }
      ]);
      return;
    }

    if (!doctor) {
      console.log('Pas d\'informations médecin disponibles');
      Alert.alert('Erreur', 'Informations médecin non disponibles');
      return;
    }

    switch (type) {
      case 'cabinet':
        // Rediriger vers la sélection du patient puis calendrier
        router.push({
          pathname: '/patient-selection',
          params: { 
            doctorId: doctorId as string,
            consultationType: 'cabinet',
            doctorName: doctor.nom,
            price: doctor.tarif.toString()
          }
        });
        break;
      case 'domicile':
        Alert.alert(
          'Consultation à domicile',
          `Tarif : ${formatPrice(doctor.tarif + 5000)} (+ 5000 FCFA frais de déplacement)\n\nConfirmer la demande ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Confirmer', onPress: () => 
              router.push({
                pathname: '/patient-selection',
                params: { 
                  doctorId: doctorId as string,
                  consultationType: 'domicile',
                  doctorName: doctor.nom,
                  price: (doctor.tarif + 5000).toString()
                }
              })
            }
          ]
        );
        break;
      case 'teleconsultation':
        Alert.alert(
          'Téléconsultation',
          `Tarif : ${formatPrice(doctor.tarif - 2000)} (-2000 FCFA en ligne)\n\nConfirmer la demande ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Confirmer', onPress: () =>
              router.push({
                pathname: '/patient-selection',
                params: { 
                  doctorId: doctorId as string,
                  consultationType: 'teleconsultation',
                  doctorName: doctor.nom,
                  price: (doctor.tarif - 2000).toString()
                }
              })
            }
          ]
        );
        break;
    }
  };

  const handleSendMessage = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour envoyer un message');
      return;
    }
    Alert.alert('Message', 'Fonctionnalité de messagerie bientôt disponible');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Médecin introuvable</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
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
          style={styles.headerBackButton}
          onPress={() => {
            console.log('CLICK RETOUR DÉTECTÉ');
            router.push('/');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil du médecin</Text>
      </View>

      <View style={styles.doctorsSection}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor Info Card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="person-circle" size={80} color="#2E8B57" />
            </View>
            <View style={styles.doctorMainInfo}>
              <Text style={styles.doctorName}>Dr {doctor.nom}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialite}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#F39C12" />
                <Text style={styles.ratingText}>{doctor.rating}</Text>
                <Text style={styles.ratingCount}>(127 avis)</Text>
              </View>
              <Text style={styles.doctorExperience}>{doctor.experience}</Text>
            </View>
          </View>
          
          {/* Price and Status */}
          <View style={styles.priceStatusRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Tarif consultation</Text>
              <Text style={styles.priceValue}>{formatPrice(doctor.tarif)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: doctor.disponible ? '#27AE60' : '#E74C3C' }]}>
              <Text style={styles.statusText}>
                {doctor.disponible ? 'Disponible' : 'Indisponible'}
              </Text>
            </View>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#2E8B57" />
            <Text style={styles.sectionTitle}>Adresse du cabinet</Text>
          </View>
          <Text style={styles.addressText}>{doctor.adresse}</Text>
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="map" size={16} color="#3498DB" />
            <Text style={styles.mapButtonText}>Voir sur la carte</Text>
          </TouchableOpacity>
        </View>

        {/* Presentation */}
        <View style={styles.presentationCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#2E8B57" />
            <Text style={styles.sectionTitle}>Présentation</Text>
          </View>
          <Text style={styles.presentationText}>{doctor.presentation}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={handleSendMessage}
          >
            <Ionicons name="chatbubbles" size={20} color="#3498DB" />
            <Text style={styles.messageButtonText}>Envoyer un message</Text>
          </TouchableOpacity>
        </View>

        {/* Consultation Types */}
        <View style={styles.consultationSection}>
          <Text style={styles.consultationTitle}>Choisir le type de consultation</Text>
          
          <TouchableOpacity 
            style={styles.consultationCard}
            onPress={() => handleConsultationType('cabinet')}
            activeOpacity={0.7}
          >
            <View style={styles.consultationHeader}>
              <View style={[styles.consultationIcon, { backgroundColor: '#E8F5E8' }]}>
                <Ionicons name="business" size={24} color="#2E8B57" />
              </View>
              <View style={styles.consultationInfo}>
                <Text style={styles.consultationName}>Consultation au cabinet</Text>
                <Text style={styles.consultationPrice}>{formatPrice(doctor.tarif)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
            <Text style={styles.consultationDescription}>
              Rendez-vous physique dans le cabinet médical
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.consultationCard}
            onPress={() => handleConsultationType('domicile')}
            activeOpacity={0.7}
          >
            <View style={styles.consultationHeader}>
              <View style={[styles.consultationIcon, { backgroundColor: '#FDF4E3' }]}>
                <Ionicons name="home" size={24} color="#F39C12" />
              </View>
              <View style={styles.consultationInfo}>
                <Text style={styles.consultationName}>Consultation à domicile</Text>
                <Text style={styles.consultationPrice}>{formatPrice(doctor.tarif + 5000)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
            <Text style={styles.consultationDescription}>
              Le médecin se déplace à votre domicile (+5000 FCFA frais)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.consultationCard}
            onPress={() => handleConsultationType('teleconsultation')}
            activeOpacity={0.7}
          >
            <View style={styles.consultationHeader}>
              <View style={[styles.consultationIcon, { backgroundColor: '#E8F4FD' }]}>
                <Ionicons name="videocam" size={24} color="#3498DB" />
              </View>
              <View style={styles.consultationInfo}>
                <Text style={styles.consultationName}>Téléconsultation</Text>
                <Text style={styles.consultationPrice}>{formatPrice(doctor.tarif - 2000)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
            <Text style={styles.consultationDescription}>
              Consultation par vidéo depuis chez vous (-2000 FCFA)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
  },
  headerBackButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  doctorCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  doctorAvatar: {
    marginRight: 16,
  },
  doctorMainInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '600',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 14,
    color: '#F39C12',
    fontWeight: '600',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  doctorExperience: {
    fontSize: 14,
    color: '#666',
  },
  priceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 14,
    color: '#3498DB',
    marginLeft: 4,
    fontWeight: '500',
  },
  presentationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  presentationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  messageButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498DB',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  consultationSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
    zIndex: 1,
  },
  consultationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  consultationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  consultationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consultationInfo: {
    flex: 1,
  },
  consultationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  consultationPrice: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: '600',
  },
  consultationDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  doctorsSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    zIndex: 1,
  },
});