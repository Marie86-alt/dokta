import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    icon: 'phone-portrait',
    color: '#FFDD00',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    icon: 'phone-portrait',
    color: '#FF6600',
  }
];

export default function MobileMoneyPayment() {
  const params = useLocalSearchParams();
  const {
    appointmentId,
    doctorName,
    patientName,
    date,
    time,
    consultationType,
    price,
  } = params;

  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'phone' | 'confirm' | 'processing'>('select');

  const formatPrice = (priceStr: string) => {
    return `${parseInt(priceStr).toLocaleString()} FCFA`;
  };

  const getConsultationTypeLabel = (type: string) => {
    switch (type) {
      case 'cabinet': return 'Consultation au cabinet';
      case 'domicile': return 'Consultation à domicile';
      case 'teleconsultation': return 'Téléconsultation';
      default: return 'Consultation';
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(\+237|237)?[62-9]\d{8}$/;
    return phoneRegex.test(cleanPhone);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep('phone');
  };

  const handlePhoneSubmit = () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert(
        'Numéro invalide',
        'Veuillez entrer un numéro de téléphone camerounais valide (ex: 690123456)'
      );
      return;
    }

    setStep('confirm');
  };

  const handlePayment = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      // Simuler le processus de paiement Mobile Money
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Redirection vers la confirmation
      router.replace({
        pathname: '/booking-confirmation',
        params: {
          appointmentId: appointmentId as string,
          doctorName: doctorName as string,
          patientName: patientName as string,
          date: date as string,
          time: time as string,
          consultationType: consultationType as string,
          price: price as string,
        }
      });
    } catch (error) {
      Alert.alert('Erreur', 'Le paiement a échoué. Veuillez réessayer.');
      setStep('confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.methodsContainer}>
      <Text style={styles.sectionTitle}>Choisir votre opérateur</Text>
      
      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[styles.methodCard, { borderColor: method.color }]}
          onPress={() => handleMethodSelect(method.id)}
        >
          <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
            <Ionicons name={method.icon as any} size={32} color={method.color} />
          </View>
          <Text style={styles.methodName}>{method.name}</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      ))}
      
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3498DB" />
        <Text style={styles.infoText}>
          Paiement sécurisé via Mobile Money. Vous recevrez un SMS de confirmation.
        </Text>
      </View>
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.phoneContainer}>
      <TouchableOpacity 
        style={styles.backStep}
        onPress={() => setStep('select')}
      >
        <Ionicons name="arrow-back" size={20} color="#2E8B57" />
        <Text style={styles.backStepText}>Changer d'opérateur</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
      
      <View style={styles.selectedMethod}>
        <Text style={styles.selectedMethodText}>
          {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}
        </Text>
      </View>

      <TextInput
        style={styles.phoneInput}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="Ex: 690 123 456"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        maxLength={15}
      />

      <TouchableOpacity
        style={[styles.continueButton, !phoneNumber.trim() && styles.continueButtonDisabled]}
        onPress={handlePhoneSubmit}
        disabled={!phoneNumber.trim()}
      >
        <Text style={styles.continueButtonText}>Continuer</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.confirmContainer}>
      <TouchableOpacity 
        style={styles.backStep}
        onPress={() => setStep('phone')}
      >
        <Ionicons name="arrow-back" size={20} color="#2E8B57" />
        <Text style={styles.backStepText}>Modifier le numéro</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Confirmation du paiement</Text>
      
      <View style={styles.confirmationCard}>
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Opérateur :</Text>
          <Text style={styles.confirmValue}>
            {PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}
          </Text>
        </View>
        
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Numéro :</Text>
          <Text style={styles.confirmValue}>{phoneNumber}</Text>
        </View>
        
        <View style={styles.confirmRow}>
          <Text style={styles.confirmLabel}>Montant :</Text>
          <Text style={[styles.confirmValue, styles.priceText]}>
            {formatPrice(price as string)}
          </Text>
        </View>
      </View>

      <View style={styles.warningCard}>
        <Ionicons name="warning" size={20} color="#E67E22" />
        <Text style={styles.warningText}>
          Assurez-vous que votre compte dispose du solde suffisant avant de continuer
        </Text>
      </View>

      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayment}
      >
        <Ionicons name="card" size={20} color="#FFFFFF" />
        <Text style={styles.payButtonText}>
          Payer {formatPrice(price as string)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color="#2E8B57" />
      <Text style={styles.processingTitle}>Paiement en cours...</Text>
      <Text style={styles.processingText}>
        Veuillez patienter pendant que nous traitons votre paiement
      </Text>
      <View style={styles.processingSteps}>
        <Text style={styles.processingStep}>✓ Connexion sécurisée établie</Text>
        <Text style={styles.processingStep}>⏳ Traitement du paiement...</Text>
        <Text style={styles.processingStepPending}>⏳ Confirmation en cours...</Text>
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
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement Mobile Money</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>
        <Text style={styles.summaryText}>Dr {doctorName}</Text>
        <Text style={styles.summaryText}>{getConsultationTypeLabel(consultationType as string)}</Text>
        <Text style={styles.summaryText}>
          {new Date(date as string).toLocaleDateString('fr-FR')} à {time}
        </Text>
        <Text style={styles.summaryPrice}>{formatPrice(price as string)}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {step === 'select' && renderMethodSelection()}
        {step === 'phone' && renderPhoneInput()}
        {step === 'confirm' && renderConfirmation()}
        {step === 'processing' && renderProcessing()}
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
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  methodsContainer: {
    flex: 1,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3498DB',
    marginLeft: 8,
    lineHeight: 20,
  },
  phoneContainer: {
    flex: 1,
  },
  backStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backStepText: {
    fontSize: 14,
    color: '#2E8B57',
    marginLeft: 4,
  },
  selectedMethod: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedMethodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  phoneInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  confirmContainer: {
    flex: 1,
  },
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confirmLabel: {
    fontSize: 14,
    color: '#666',
  },
  confirmValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  priceText: {
    color: '#2E8B57',
  },
  warningCard: {
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E67E22',
    marginLeft: 8,
    lineHeight: 20,
  },
  payButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginTop: 24,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  processingSteps: {
    alignSelf: 'stretch',
  },
  processingStep: {
    fontSize: 14,
    color: '#27AE60',
    marginBottom: 8,
    paddingLeft: 16,
  },
  processingStepPending: {
    fontSize: 14,
    color: '#E67E22',
    marginBottom: 8,
    paddingLeft: 16,
  },
});