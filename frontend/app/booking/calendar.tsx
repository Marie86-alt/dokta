import React, { useState, useEffect } from 'react';
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
import { Calendar } from 'react-native-calendars';
import { router, useLocalSearchParams } from 'expo-router';
// import { useAuth } from '../../contexts/AuthContext'; // Commenté temporairement
import NotificationService from '../../services/notificationService';

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookingCalendarScreen() {
  const { 
    doctorId, 
    consultationType, 
    doctorName, 
    price, 
    patientId, 
    patientName, 
    patientAge 
  } = useLocalSearchParams();
  
  // const { user } = useAuth(); // Commenté temporairement
  
  // Debug des paramètres reçus
  console.log('=== PARAMÈTRES CALENDRIER ===');
  console.log('doctorId:', doctorId);
  console.log('consultationType:', consultationType);
  console.log('doctorName:', doctorName);
  console.log('price:', price);
  console.log('patientName:', patientName);
  console.log('=== FIN PARAMÈTRES ===');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  // Générer les dates disponibles (jours ouvrés des 30 prochains jours)
  const getAvailableDates = () => {
    const dates: { [key: string]: any } = {};
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Exclure les dimanches (0)
      if (date.getDay() !== 0) {
        const dateString = date.toISOString().split('T')[0];
        dates[dateString] = {
          marked: true,
          dotColor: '#2E8B57',
          textColor: '#2E8B57',
        };
      }
    }
    
    return dates;
  };

  const [markedDates, setMarkedDates] = useState(getAvailableDates());

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadAvailableSlots = async (date: string) => {
    setLoading(true);
    try {
      // Appel API réel pour charger les créneaux disponibles
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/available-slots?date=${date}`);
      if (response.ok) {
        const slotsData = await response.json();
        // Transformer les données de l'API en format attendu par l'UI
        const formattedSlots: TimeSlot[] = slotsData.map((slot: any) => ({
          time: slot.heure,
          available: slot.disponible
        }));
        setAvailableSlots(formattedSlots);
      } else {
        throw new Error('Impossible de charger les créneaux');
      }
    } catch (error) {
      console.error('Erreur chargement créneaux:', error);
      // Fallback vers des créneaux simulés en cas d'erreur
      const fallbackSlots = generateTimeSlots(date);
      setAvailableSlots(fallbackSlots);
      Alert.alert('Info', 'Chargement des créneaux par défaut');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = (date: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const selectedDay = new Date(date).getDay();
    
    // Créneaux du matin (9h-12h)
    for (let hour = 9; hour < 12; hour++) {
      for (let minute of ['00', '30']) {
        const time = `${hour.toString().padStart(2, '0')}:${minute}`;
        // Simuler quelques créneaux indisponibles
        const available = Math.random() > 0.3; // 70% de chance d'être disponible
        slots.push({ time, available });
      }
    }
    
    // Créneaux de l'après-midi (14h-17h)
    for (let hour = 14; hour < 17; hour++) {
      for (let minute of ['00', '30']) {
        const time = `${hour.toString().padStart(2, '0')}:${minute}`;
        const available = Math.random() > 0.3;
        slots.push({ time, available });
      }
    }
    
    return slots;
  };

  const handleDateSelect = (day: any) => {
    const dateString = day.dateString;
    const today = new Date().toISOString().split('T')[0];
    
    if (dateString <= today) {
      Alert.alert('Date invalide', 'Veuillez sélectionner une date future');
      return;
    }
    
    setSelectedDate(dateString);
    setSelectedTime(''); // Reset time selection
    
    // Mettre à jour les dates marquées
    const newMarkedDates = { ...getAvailableDates() };
    newMarkedDates[dateString] = {
      ...newMarkedDates[dateString],
      selected: true,
      selectedColor: '#2E8B57',
    };
    setMarkedDates(newMarkedDates);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Sélection incomplète', 'Veuillez sélectionner une date et un horaire');
      return;
    }

    try {
      setLoading(true);

      // Demander les permissions de notifications lors de la première réservation
      let notificationToken = null;
      try {
        console.log('Demande de permissions de notifications...');
        notificationToken = await NotificationService.registerForPushNotifications();
        
        if (notificationToken) {
          console.log('Token de notification obtenu:', notificationToken);
          
          // Enregistrer le token sur le serveur
          await NotificationService.registerTokenWithBackend('anonymous', notificationToken);
          
          // Configurer les gestionnaires de notifications
          NotificationService.setupNotificationHandlers();
          
          Alert.alert(
            'Notifications activées 🔔',
            'Vous recevrez un rappel 1h avant votre rendez-vous avec l\'itinéraire.',
            [{ text: 'Parfait !', style: 'default' }]
          );
        } else {
          console.log('Permissions de notifications refusées ou non disponibles');
        }
      } catch (notifError) {
        console.error('Erreur notifications:', notifError);
        // Continue sans notifications
      }
      
      const bookingData = {
        doctor_id: doctorId,
        patient_name: patientName,
        patient_age: parseInt(patientAge as string),
        date: selectedDate,
        time: selectedTime,
        consultation_type: consultationType,
        price: parseInt(price as string),
        user_id: 'anonymous', // Temporaire - sera remplacé par authentification
        notification_token: notificationToken, // Inclure le token pour le backend
      };

      console.log('Données de réservation:', bookingData);

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/appointments-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const appointment = await response.json();
        console.log('Rendez-vous créé:', appointment);
        
        // Programmer une notification de test pour démonstration
        if (notificationToken) {
          try {
            await NotificationService.scheduleTestNotification(10); // Test dans 10 secondes
            console.log('Notification de test programmée');
          } catch (testError) {
            console.error('Erreur notification test:', testError);
          }
        }
        
        Alert.alert(
          'Rendez-vous confirmé ! ✅', 
          notificationToken 
            ? 'Votre rendez-vous a été créé avec succès. Vous recevrez un rappel 1h avant.'
            : 'Votre rendez-vous a été créé avec succès.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push({
                  pathname: '/booking-confirmation',
                  params: {
                    appointmentId: appointment.id,
                    doctorName: doctorName as string,
                    patientName: patientName as string,
                    date: selectedDate,
                    time: selectedTime,
                    consultationType: consultationType as string,
                    price: price as string,
                  }
                });
              }
            }
          ]
        );
      } else {
        const errorData = await response.text();
        console.error('Erreur API:', errorData);
        throw new Error('Erreur lors de la réservation');
      }
    } catch (error) {
      console.error('Erreur réservation:', error);
      Alert.alert('Erreur', 'Impossible de confirmer le rendez-vous. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <Text style={styles.headerTitle}>Choisir la date</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Médecin :</Text>
            <Text style={styles.summaryValue}>Dr {doctorName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Patient :</Text>
            <Text style={styles.summaryValue}>{patientName} ({patientAge} ans)</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type :</Text>
            <Text style={styles.summaryValue}>{getConsultationTypeLabel(consultationType as string)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarif :</Text>
            <Text style={styles.summaryPrice}>{formatPrice(price as string)}</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Sélectionnez une date</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={markedDates}
              minDate={new Date().toISOString().split('T')[0]}
              maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#2E8B57',
                selectedDayBackgroundColor: '#2E8B57',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#2E8B57',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#2E8B57',
                selectedDotColor: '#ffffff',
                arrowColor: '#2E8B57',
                monthTextColor: '#2E8B57',
                indicatorColor: '#2E8B57',
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
              }}
            />
          </View>
        </View>

        {/* Selected Date Info */}
        {selectedDate && (
          <View style={styles.selectedDateCard}>
            <View style={styles.selectedDateHeader}>
              <Ionicons name="calendar" size={20} color="#2E8B57" />
              <Text style={styles.selectedDateText}>
                {formatDate(selectedDate)}
              </Text>
            </View>
          </View>
        )}

        {/* Time Slots */}
        {selectedDate && (
          <View style={styles.timeSlotsSection}>
            <Text style={styles.sectionTitle}>
              Créneaux disponibles
              {loading && <Text style={styles.loadingText}> (chargement...)</Text>}
            </Text>
            
            {availableSlots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      !slot.available && styles.timeSlotUnavailable,
                      selectedTime === slot.time && styles.timeSlotSelected,
                    ]}
                    onPress={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      !slot.available && styles.timeSlotTextUnavailable,
                      selectedTime === slot.time && styles.timeSlotTextSelected,
                    ]}>
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              !loading && (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="time-outline" size={32} color="#CCC" />
                  <Text style={styles.noSlotsText}>
                    Aucun créneau disponible pour cette date
                  </Text>
                </View>
              )
            )}
          </View>
        )}

        {/* Selected Time Summary */}
        {selectedTime && (
          <View style={styles.finalSummaryCard}>
            <View style={styles.finalSummaryHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
              <Text style={styles.finalSummaryTitle}>Récapitulatif de votre rendez-vous</Text>
            </View>
            
            <View style={styles.finalSummaryContent}>
              <Text style={styles.finalSummaryText}>
                <Text style={styles.bold}>Date :</Text> {formatDate(selectedDate)}
              </Text>
              <Text style={styles.finalSummaryText}>
                <Text style={styles.bold}>Heure :</Text> {selectedTime}
              </Text>
              <Text style={styles.finalSummaryText}>
                <Text style={styles.bold}>Durée :</Text> 30 minutes
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Confirm Button */}
      {selectedDate && selectedTime && (
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmBooking}
          >
            <Text style={styles.confirmButtonText}>
              Confirmer le rendez-vous
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  summaryPrice: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: 'bold',
  },
  calendarSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  selectedDateCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 12,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: 'bold',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  timeSlotsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotUnavailable: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
  },
  timeSlotSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  timeSlotTextUnavailable: {
    color: '#999',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noSlotsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  finalSummaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
  finalSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  finalSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    marginLeft: 8,
  },
  finalSummaryContent: {
    gap: 4,
  },
  finalSummaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  bottomSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});