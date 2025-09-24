import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ConsultationChoiceScreen() {
  const consultationTypes = [
    {
      id: 'cabinet',
      title: 'Consultation au cabinet',
      subtitle: 'Rendez-vous physique chez le médecin',
      icon: 'business',
      color: '#2E8B57',
      bgColor: '#E8F5E8',
      description: 'Consultation classique dans le cabinet médical',
      available: true,
    },
    {
      id: 'domicile',
      title: 'Consultation à domicile',
      subtitle: 'Le médecin se déplace chez vous',
      icon: 'home',
      color: '#F39C12',
      bgColor: '#FDF4E3',
      description: 'Service de consultation à votre domicile',
      available: true,
    },
    {
      id: 'teleconsultation',
      title: 'Téléconsultation',
      subtitle: 'Consultation par vidéo en ligne',
      icon: 'videocam',
      color: '#3498DB',
      bgColor: '#E8F4FD',
      description: 'Consultation à distance par visioconférence',
      available: true,
    },
  ];

  const handleConsultationChoice = (type: string) => {
    switch (type) {
      case 'cabinet':
        // Rediriger vers la liste des médecins pour consultation classique
        router.back();
        break;
      case 'domicile':
        Alert.alert(
          'Consultation à domicile',
          'Service de consultation à domicile bientôt disponible.\n\nTarifs majurés selon la distance.'
        );
        break;
      case 'teleconsultation':
        Alert.alert(
          'Téléconsultation',
          'Service de téléconsultation bientôt disponible.\n\nConsultez un médecin depuis chez vous par vidéo.'
        );
        break;
    }
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
        <Text style={styles.headerTitle}>Type de consultation</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Comment souhaitez-vous consulter ?</Text>
          <Text style={styles.introSubtitle}>
            Choisissez le type de consultation qui vous convient le mieux
          </Text>
        </View>

        {/* Consultation Options */}
        <View style={styles.optionsSection}>
          {consultationTypes.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                !option.available && styles.optionCardDisabled
              ]}
              onPress={() => handleConsultationChoice(option.id)}
              disabled={!option.available}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.optionIcon, { backgroundColor: option.bgColor }]}>
                  <Ionicons name={option.icon as any} size={32} color={option.color} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <View style={styles.optionArrow}>
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </View>
              </View>
              
              <Text style={styles.optionDescription}>{option.description}</Text>

              {/* Special badges */}
              {option.id === 'domicile' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Frais de déplacement</Text>
                </View>
              )}
              
              {option.id === 'teleconsultation' && (
                <View style={[styles.badge, { backgroundColor: '#E8F4FD' }]}>
                  <Text style={[styles.badgeText, { color: '#3498DB' }]}>Depuis chez vous</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#2E8B57" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Besoin d'aide pour choisir ?</Text>
              <Text style={styles.infoText}>
                • Cabinet : Consultation classique recommandée pour les examens physiques
                {'\n'}• Domicile : Idéal pour les personnes à mobilité réduite
                {'\n'}• Téléconsultation : Parfait pour les suivis et consultations simples
              </Text>
            </View>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  introSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsSection: {
    paddingHorizontal: 16,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  optionArrow: {
    marginLeft: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#FDF4E3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});