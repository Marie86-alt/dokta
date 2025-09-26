import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

interface PatientInfo {
  nom: string;
  telephone: string;
  motif: string;
}

export default function PatientForm() {
  const params = useLocalSearchParams();
  const { doctorId, doctorName, specialite, tarif, date, time } = params;

  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    nom: '',
    telephone: '',
    motif: ''
  });

  const handleInputChange = (field: keyof PatientInfo, value: string) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinueToPayment = () => {
    if (!patientInfo.nom || !patientInfo.telephone) {
      Alert.alert('Information requise', 'Veuillez remplir votre nom et numéro de téléphone');
      return;
    }

    // Valider le format du numéro de téléphone camerounais
    const phoneRegex = /^(\+237|237)?[62-9]\d{8}$/;
    if (!phoneRegex.test(patientInfo.telephone.replace(/\s/g, ''))) {
      Alert.alert(
        'Numéro invalide', 
        'Veuillez entrer un numéro de téléphone camerounais valide (ex: 690123456 ou +237690123456)'
      );
      return;
    }

    router.push({
      pathname: '/mobile-money-payment',
      params: {
        appointmentId: 'temp-id', // Sera remplacé par l'ID réel après création
        doctorName: doctorName as string,
        patientName: patientInfo.nom,
        date: date as string,
        time: time as string,
        consultationType: 'cabinet', // Type par défaut
        price: tarif as string,
      }
    });
  };

  const formatPrice = (price: string) => {
    return `${parseInt(price).toLocaleString()} FCFA`;
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
        <View style={styles.headerContent}>
          <Text style={styles.title}>Vos Informations</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content}>
          {/* Booking Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Résumé de la réservation</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="person" size={16} color="#666" />
              <Text style={styles.summaryText}>{doctorName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="medical" size={16} color="#666" />
              <Text style={styles.summaryText}>{specialite}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar" size={16} color="#666" />
              <Text style={styles.summaryText}>
                {new Date(date as string).toLocaleDateString('fr-FR')} à {time}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="cash" size={16} color="#666" />
              <Text style={[styles.summaryText, styles.summaryPrice]}>
                {formatPrice(tarif as string)}
              </Text>
            </View>
          </View>

          {/* Patient Information Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Vos informations personnelles</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Nom complet <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.nom}
                onChangeText={(value) => handleInputChange('nom', value)}
                placeholder="Entrez votre nom complet"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Numéro de téléphone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={patientInfo.telephone}
                onChangeText={(value) => handleInputChange('telephone', value)}
                placeholder="Ex: +237 690 123 456"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Motif de consultation (optionnel)
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={patientInfo.motif}
                onChangeText={(value) => handleInputChange('motif', value)}
                placeholder="Décrivez brièvement le motif de votre consultation"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={20} color="#2E8B57" />
              <Text style={styles.infoText}>
                Vos informations sont confidentielles et utilisées uniquement pour cette consultation.
              </Text>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueToPayment}
          >
            <Text style={styles.continueButtonText}>
              Procéder au paiement
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoid: {
    flex: 1,
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
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
  },
  summaryPrice: {
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#E74C3C',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2E8B57',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 32,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});