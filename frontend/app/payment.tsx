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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    icon: 'phone-portrait',
    description: 'Paiement via MTN Mobile Money'
  },
  {
    id: 'orange',
    name: 'Orange Money',
    icon: 'phone-portrait',
    description: 'Paiement via Orange Money'
  }
];

export default function Payment() {
  const params = useLocalSearchParams();
  const {
    doctorId,
    doctorName,
    specialite,
    tarif,
    date,
    time,
    patientNom,
    patientTelephone,
    motif
  } = params;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentPhone, setPaymentPhone] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Méthode de paiement', 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    if (!paymentPhone) {
      Alert.alert('Numéro de paiement', 'Veuillez entrer le numéro pour le paiement');
      return;
    }

    // Valider le numéro selon le mode de paiement
    const phoneRegex = /^(\+237|237)?[62-9]\d{8}$/;
    if (!phoneRegex.test(paymentPhone.replace(/\s/g, ''))) {
      Alert.alert(
        'Numéro invalide', 
        'Veuillez entrer un numéro de téléphone camerounais valide'
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Créer l'utilisateur patient
      const userResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: patientNom,
          telephone: patientTelephone,
          type: 'patient'
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Erreur lors de la création du profil patient');
      }

      const userData = await userResponse.json();

      // 2. Créer la réservation
      const appointmentResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: userData.id,
          doctor_id: doctorId,
          date: date,
          heure: time
        }),
      });

      if (!appointmentResponse.ok) {
        const errorData = await appointmentResponse.json();
        throw new Error(errorData.detail || 'Erreur lors de la création du rendez-vous');
      }

      const appointmentData = await appointmentResponse.json();

      // 3. Simuler le paiement Mobile Money
      await simulateMobileMoneyPayment();

      // 4. Confirmer le rendez-vous
      await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/appointments/${appointmentData.id}/confirm`, {
        method: 'PUT',
      });

      // Rediriger vers la page de confirmation
      router.replace({
        pathname: '/booking-confirmation',
        params: {
          appointmentId: appointmentData.id,
          doctorName: doctorName as string,
          specialite: specialite as string,
          date: date as string,
          time: time as string,
          patientNom: patientNom as string,
          tarif: tarif as string
        }
      });

    } catch (error) {
      console.error('Erreur de paiement:', error);
      Alert.alert('Erreur de paiement', error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateMobileMoneyPayment = async (): Promise<void> => {
    return new Promise((resolve) => {
      // Simuler un délai de traitement du paiement
      setTimeout(() => {
        resolve();
      }, 2000);
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
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Paiement</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content}>
          {/* Payment Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Consultation</Text>
              <Text style={styles.summaryValue}>{doctorName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Spécialité</Text>
              <Text style={styles.summaryValue}>{specialite}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Heure</Text>
              <Text style={styles.summaryValue}>
                {new Date(date as string).toLocaleDateString('fr-FR')} à {time}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Patient</Text>
              <Text style={styles.summaryValue}>{patientNom}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalValue}>{formatPrice(tarif as string)}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.paymentCard}>
            <Text style={styles.paymentTitle}>Choisir le mode de paiement</Text>
            
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id && styles.paymentMethodSelected
                ]}
                onPress={() => handlePaymentMethodSelect(method.id)}
                disabled={isProcessing}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons name={method.icon as any} size={24} color="#2E8B57" />
                </View>
                <View style={styles.paymentMethodInfo}>
                  <Text style={styles.paymentMethodName}>{method.name}</Text>
                  <Text style={styles.paymentMethodDesc}>{method.description}</Text>
                </View>
                <View style={styles.paymentMethodRadio}>
                  {selectedPaymentMethod === method.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#2E8B57" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment Phone Input */}
          {selectedPaymentMethod && (
            <View style={styles.phoneCard}>
              <Text style={styles.phoneTitle}>Numéro de téléphone pour le paiement</Text>
              <TextInput
                style={styles.phoneInput}
                value={paymentPhone}
                onChangeText={setPaymentPhone}
                placeholder="Ex: +237 690 123 456"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                editable={!isProcessing}
              />
              <Text style={styles.phoneNote}>
                Vous recevrez un code de confirmation sur ce numéro
              </Text>
            </View>
          )}

          {/* Payment Button */}
          <TouchableOpacity
            style={[
              styles.payButton,
              (!selectedPaymentMethod || !paymentPhone || isProcessing) && styles.payButtonDisabled
            ]}
            onPress={handlePayment}
            disabled={!selectedPaymentMethod || !paymentPhone || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#FFFFFF" />
                <Text style={styles.payButtonText}>
                  Payer {formatPrice(tarif as string)}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {isProcessing && (
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color="#2E8B57" />
              <Text style={styles.processingText}>
                Traitement du paiement en cours...
              </Text>
              <Text style={styles.processingSubtext}>
                Veuillez patienter et ne pas fermer l'application
              </Text>
            </View>
          )}
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
    shadowOffset: { width: 0, height: 2 },
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  paymentCard: {
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
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: '#2E8B57',
    backgroundColor: '#E8F5E8',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethodDesc: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethodRadio: {
    width: 24,
    height: 24,
  },
  phoneCard: {
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
  phoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    color: '#333',
    marginBottom: 8,
  },
  phoneNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  payButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});