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
  
  // Fonction pour décoder les paramètres URL
  const decodeParam = (param: any): string | undefined => {
    if (Array.isArray(param)) {
      return param[0] ? decodeURIComponent(param[0]) : undefined;
    }
    return param ? decodeURIComponent(param) : undefined;
  };
  
  // Extraction et décodage robuste des paramètres avec fallbacks
  const doctorId = decodeParam(params.doctorId) || 'doc_001_general_yaounde';
  const doctorName = decodeParam(params.doctorName) || 'Dr. Marie NGONO';
  const patientName = decodeParam(params.patientName) || 'Patient Test';
  const patientAge = decodeParam(params.patientAge) || '30';
  const date = decodeParam(params.date) || '2025-10-04';
  const time = decodeParam(params.time) || '11:00';
  const consultationType = decodeParam(params.consultationType) || 'cabinet';
  const price = decodeParam(params.price) || '15000';

  console.log('📋 Paramètres Mobile Money décodés:', {
    doctorId,
    doctorName,
    patientName,
    patientAge,
    date,
    time,
    consultationType,
    price,
  });

  // Vérification si les paramètres sont bien reçus
  useEffect(() => {
    if (!doctorName || !patientName || !price) {
      console.warn('⚠️ Paramètres manquants détectés!');
      console.log('Paramètres bruts reçus:', params);
      
      // Logs détaillés pour debug
      if (!doctorName) console.log('❌ doctorName manquant ou mal décodé');
      if (!patientName) console.log('❌ patientName manquant ou mal décodé');  
      if (!price) console.log('❌ price manquant ou mal décodé');
    } else {
      console.log('✅ Tous les paramètres requis sont présents et décodés');
    }
  }, [doctorName, patientName, price, params]);

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
          
          // Redirection automatique vers la page récapitulative
          router.push({
            pathname: '/booking-confirmation',
            params: {
              appointmentId: 'auto_generated', // Sera créé côté backend
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
    if (!paymentId) {
      console.error('❌ Pas de paymentId pour confirmation manuelle');
      return;
    }

    console.log('🔄 Confirmation manuelle du paiement:', paymentId);

    try {
      const response = await fetch(`/api/mobile-money/confirm/${paymentId}`, {
        method: 'POST',
      });

      console.log('📨 Réponse API confirmation:', response.status);
      const result = await response.json();
      console.log('📋 Résultat confirmation:', result);

      if (response.ok) {
        setPaymentInProgress(false);
        console.log('✅ Paiement confirmé, redirection vers confirmation...');
        
        // Préparer les paramètres avec des fallbacks
        const confirmationParams = {
          appointmentId: result.appointment_id || `manual_${Date.now()}`,
          doctorName: doctorName || 'Médecin DOKTA',
          patientName: patientName || 'Patient',
          patientAge: patientAge || '30',
          appointmentDate: date || new Date().toISOString().split('T')[0],
          appointmentTime: time || '10:00',
          consultationType: consultationType || 'cabinet',
          price: price || '15000',
          paymentMethod: PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name || 'MTN Mobile Money',
          paymentId: paymentId,
        };
        
        console.log('📤 Paramètres de redirection:', confirmationParams);
        
        // Utiliser router.replace pour une navigation plus propre
        setTimeout(() => {
          router.replace({
            pathname: '/booking-confirmation',
            params: confirmationParams,
          });
        }, 500); // Petit délai pour s'assurer que l'état est mis à jour
        
      } else {
        console.error('❌ Erreur API confirmation:', result);
        Alert.alert('Erreur', result.message || 'Impossible de confirmer le paiement');
      }
    } catch (error) {
      console.error('💥 Erreur confirmation:', error);
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
          </View>
        )}
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
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 16,
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
    elevation: 3,
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
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  phoneSection: {
    marginBottom: 24,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingLeft: 8,
    color: '#333',
  },
  phoneHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  paymentSection: {
    marginBottom: 32,
  },
  paymentMethod: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMethod: {
    borderWidth: 2,
    backgroundColor: '#F8FFF8',
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  payButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentProgressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  manualConfirmButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF9800',
    borderRadius: 8,
  },
  manualConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});