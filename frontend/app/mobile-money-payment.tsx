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
  provider: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    icon: 'phone-portrait',
    color: '#FFDD00',
    provider: 'mtn_momo',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    icon: 'phone-portrait',
    color: '#FF6600',
    provider: 'orange_money',
  }
];

export default function MobileMoneyPayment() {
  const params = useLocalSearchParams();
  const {
    doctorId,
    doctorName,
    patientName,
    patientAge,
    date,
    time,
    consultationType,
    price,
  } = params;

  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');

  const formatPhoneNumber = (text: string) => {
    // Supprimer tous les caractères non numériques
    const cleaned = text.replace(/\D/g, '');
    
    // Limiter à 9 chiffres (format camerounais)
    const limited = cleaned.substring(0, 9);
    
    return limited;
  };

  const validateCameroonPhone = (phone: string) => {
    // Vérifier le format camerounais: 6XXXXXXXX (9 chiffres commençant par 6)
    const regex = /^6[789]\d{7}$/;
    return regex.test(phone);
  };

  const initiatePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    if (!phoneNumber || !validateCameroonPhone(phoneNumber)) {
      Alert.alert('Erreur', 'Numéro de téléphone invalide. Format: 6XXXXXXXX');
      return;
    }

    setLoading(true);

    try {
      const selectedProvider = PAYMENT_METHODS.find(m => m.id === selectedMethod);
      
      const paymentData = {
        patient_name: patientName,
        patient_phone: phoneNumber,
        doctor_id: doctorId,
        consultation_type: consultationType,
        appointment_datetime: `${date} ${time}`,
        payment_provider: selectedProvider?.provider,
        notes: `Consultation ${consultationType} avec ${doctorName}`
      };

      console.log('Initiation paiement:', paymentData);

      const response = await fetch(`/api/mobile-money/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentId(result.payment_id);
        setPaymentInProgress(true);
        
        // Afficher les instructions de paiement
        Alert.alert(
          `Paiement ${result.provider}`,
          result.message,
          [
            {
              text: 'Instructions détaillées',
              onPress: () => showPaymentInstructions(result.instructions)
            },
            {
              text: 'J\'ai payé',
              onPress: () => startPaymentMonitoring(result.payment_id)
            }
          ]
        );
      } else {
        throw new Error(result.detail || 'Erreur lors de l\'initiation du paiement');
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      Alert.alert('Erreur', `Impossible d'initier le paiement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showPaymentInstructions = (instructions: string[]) => {
    const instructionsText = instructions.join('\n');
    Alert.alert(
      'Instructions de paiement',
      instructionsText,
      [
        {
          text: 'J\'ai payé',
          onPress: () => startPaymentMonitoring(paymentId)
        }
      ]
    );
  };

  const startPaymentMonitoring = async (id: string) => {
    setPaymentInProgress(true);
    
    // Vérifier le statut du paiement toutes les 3 secondes
    const checkPaymentStatus = async () => {
      try {
        const selectedProvider = PAYMENT_METHODS.find(m => m.id === selectedMethod);
        const response = await fetch(`/api/mobile-money/status/${id}?provider=${selectedProvider?.provider}`);
        const result = await response.json();

        console.log('Statut paiement:', result);

        if (result.status === 'SUCCESSFUL') {
          setPaymentInProgress(false);
          Alert.alert(
            'Paiement réussi ! 🎉',
            'Votre rendez-vous est confirmé',
            [
              {
                text: 'Voir confirmation',
                onPress: () => {
                  router.push({
                    pathname: '/booking-confirmation',
                    params: {
                      doctorName,
                      patientName,
                      patientAge,
                      appointmentDate: date,
                      appointmentTime: time,
                      consultationType,
                      price: result.amount,
                      paymentMethod: selectedProvider?.name,
                      paymentId: id,
                    },
                  });
                }
              }
            ]
          );
        } else if (result.status === 'FAILED') {
          setPaymentInProgress(false);
          Alert.alert('Paiement échoué', 'Le paiement a échoué. Veuillez réessayer.');
        } else if (result.status === 'PENDING') {
          // Continuer à vérifier
          setTimeout(checkPaymentStatus, 3000);
        }
      } catch (error) {
        console.error('Erreur vérification paiement:', error);
        // Continuer à vérifier même en cas d'erreur réseau
        setTimeout(checkPaymentStatus, 5000);
      }
    };

    // Commencer la vérification
    setTimeout(checkPaymentStatus, 2000);
  };

  const confirmPaymentManually = async () => {
    if (!paymentId) return;

    try {
      const response = await fetch(`/api/mobile-money/confirm/${paymentId}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        setPaymentInProgress(false);
        Alert.alert(
          'Paiement confirmé ! 🎉',
          'Votre rendez-vous est confirmé',
          [
            {
              text: 'Voir confirmation',
              onPress: () => {
                router.push({
                  pathname: '/booking-confirmation',
                  params: {
                    doctorName,
                    patientName,
                    patientAge,
                    appointmentDate: date,
                    appointmentTime: time,
                    consultationType,
                    price,
                    paymentMethod: PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name,
                    paymentId,
                  },
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Erreur', result.message || 'Impossible de confirmer le paiement');
      }
    } catch (error) {
      console.error('Erreur confirmation:', error);
      Alert.alert('Erreur', 'Impossible de confirmer le paiement');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement Mobile Money</Text>
      </View>

      <View style={styles.content}>
        {/* Résumé de la consultation */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Résumé de la consultation</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Médecin:</Text>
            <Text style={styles.summaryValue}>{doctorName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Patient:</Text>
            <Text style={styles.summaryValue}>{patientName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{date} à {time}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>{consultationType}</Text>
          </View>
          <View style={[styles.summaryRow, styles.priceRow]}>
            <Text style={styles.summaryLabel}>Montant:</Text>
            <Text style={styles.priceValue}>{price} FCFA</Text>
          </View>
        </View>

        {!paymentInProgress ? (
          <>
            {/* Numéro de téléphone */}
            <View style={styles.phoneSection}>
              <Text style={styles.sectionTitle}>Numéro de téléphone</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.phonePrefix}>+237 </Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                  placeholder="6XXXXXXXX"
                  keyboardType="numeric"
                  maxLength={9}
                />
              </View>
              <Text style={styles.phoneHint}>Format: 6XXXXXXXX (9 chiffres)</Text>
            </View>

            {/* Méthodes de paiement */}
            <View style={styles.paymentSection}>
              <Text style={styles.sectionTitle}>Choisir une méthode de paiement</Text>
              
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedMethod === method.id && styles.selectedMethod,
                    { borderColor: method.color }
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
                    <Ionicons name={method.icon as any} size={24} color="#333" />
                  </View>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <View style={styles.radioButton}>
                    {selectedMethod === method.id && (
                      <View style={[styles.radioButtonInner, { backgroundColor: method.color }]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bouton de paiement */}
            <TouchableOpacity 
              style={[styles.payButton, (!selectedMethod || !phoneNumber || loading) && styles.payButtonDisabled]}
              onPress={initiatePayment}
              disabled={!selectedMethod || !phoneNumber || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.payButtonText}>Payer {price} FCFA</Text>
                  <Ionicons name="card" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          /* Interface de paiement en cours */
          <View style={styles.paymentProgressContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.progressTitle}>Paiement en cours...</Text>
            <Text style={styles.progressText}>
              Vérification du paiement Mobile Money
            </Text>
            <Text style={styles.progressSubtext}>
              Cela peut prendre quelques secondes
            </Text>
            
            {/* Bouton de confirmation manuelle pour les tests */}
            <TouchableOpacity 
              style={styles.manualConfirmButton}
              onPress={confirmPaymentManually}
            >
              <Text style={styles.manualConfirmText}>Confirmer manuellement (Test)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
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