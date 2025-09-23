import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

export default function BookingConfirmation() {
  const params = useLocalSearchParams();
  const {
    appointmentId,
    doctorName,
    specialite,
    date,
    time,
    patientNom,
    tarif
  } = params;

  const handleBackHome = () => {
    router.replace('/');
  };

  const formatPrice = (price: string) => {
    return `${parseInt(price).toLocaleString()} FCFA`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Confirmation</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#27AE60" />
          </View>
          <Text style={styles.successTitle}>
            Réservation Confirmée !
          </Text>
          <Text style={styles.successSubtitle}>
            Votre rendez-vous a été confirmé avec succès
          </Text>
        </View>

        {/* Appointment Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Détails du rendez-vous</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="receipt" size={20} color="#2E8B57" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Numéro de réservation</Text>
              <Text style={styles.detailValue}>{appointmentId}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person" size={20} color="#2E8B57" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Médecin</Text>
              <Text style={styles.detailValue}>{doctorName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="medical" size={20} color="#2E8B57" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Spécialité</Text>
              <Text style={styles.detailValue}>{specialite}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={20} color="#2E8B57" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Heure</Text>
              <Text style={styles.detailValue}>
                {new Date(date as string).toLocaleDateString('fr-FR')} à {time}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person-circle" size={20} color="#2E8B57" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailValue}>{patientNom}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cash" size={20} color="#2E8B57" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Montant payé</Text>
              <Text style={[styles.detailValue, styles.priceValue]}>
                {formatPrice(tarif as string)}
              </Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instructions importantes</Text>
          
          <View style={styles.instructionItem}>
            <Ionicons name="time" size={16} color="#E67E22" />
            <Text style={styles.instructionText}>
              Veuillez arriver 15 minutes avant l'heure du rendez-vous
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="document-text" size={16} color="#E67E22" />
            <Text style={styles.instructionText}>
              Apportez vos documents médicaux et une pièce d'identité
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <Ionicons name="call" size={16} color="#E67E22" />
            <Text style={styles.instructionText}>
              En cas d'empêchement, contactez le cabinet 24h à l'avance
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleBackHome}
          >
            <Ionicons name="home" size={20} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>
              Retour à l'accueil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
          <Text style={styles.contactText}>
            Pour toute question concernant votre rendez-vous, contactez notre service client
          </Text>
          <TouchableOpacity style={styles.contactButton}>
            <Ionicons name="call" size={16} color="#2E8B57" />
            <Text style={styles.contactButtonText}>
              Contacter le support
            </Text>
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
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27AE60',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  detailsCard: {
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
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  priceValue: {
    color: '#2E8B57',
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: '#FFF8DC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#E67E22',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E67E22',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#8B4513',
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 24,
  },
  homeButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2E8B57',
    borderRadius: 8,
    gap: 4,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
  },
});