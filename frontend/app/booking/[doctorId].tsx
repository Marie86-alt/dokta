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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams, router } from 'expo-router';
import { format, addDays, isAfter, isToday } from 'date-fns';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  experience: string;
  tarif: number;
  telephone: string;
}

interface TimeSlot {
  heure: string;
  disponible: boolean;
}

export default function DoctorBooking() {
  const { doctorId } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchDoctor();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}`);
      const data = await response.json();
      setDoctor(data);
    } catch (error) {
      console.error('Erreur lors du chargement du médecin:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations du médecin');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/available-slots?date=${selectedDate}`
      );
      const data = await response.json();
      setAvailableSlots(data);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      Alert.alert('Erreur', 'Impossible de charger les créneaux disponibles');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
    setSelectedTime(''); // Reset selected time when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinueBooking = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Sélection incomplète', 'Veuillez sélectionner une date et un créneau horaire');
      return;
    }

    router.push({
      pathname: '/patient-form',
      params: {
        doctorId: doctorId as string,
        doctorName: doctor?.nom || '',
        specialite: doctor?.specialite || '',
        tarif: doctor?.tarif?.toString() || '',
        date: selectedDate,
        time: selectedTime
      }
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  // Generate marked dates for calendar (next 30 days available)
  const getMarkedDates = () => {
    const marked: any = {};
    const today = new Date();
    
    // Mark next 30 days as available
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      marked[dateString] = { 
        marked: true, 
        dotColor: '#2E8B57',
        disabled: false
      };
    }

    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#2E8B57'
      };
    }

    return marked;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>Chargement...</Text>
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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Réserver un RDV</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Doctor Info */}
        {doctor && (
          <View style={styles.doctorInfoCard}>
            <View style={styles.doctorHeader}>
              <Ionicons name="person-circle" size={60} color="#2E8B57" />
              <View style={styles.doctorDetails}>
                <Text style={styles.doctorName}>{doctor.nom}</Text>
                <Text style={styles.doctorSpecialty}>{doctor.specialite}</Text>
                <Text style={styles.doctorExperience}>{doctor.experience}</Text>
                <Text style={styles.doctorPrice}>{formatPrice(doctor.tarif)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sélectionnez une date</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={getMarkedDates()}
              minDate={format(new Date(), 'yyyy-MM-dd')}
              maxDate={format(addDays(new Date(), 30), 'yyyy-MM-dd')}
              theme={{
                todayTextColor: '#2E8B57',
                selectedDayBackgroundColor: '#2E8B57',
                selectedDayTextColor: '#FFFFFF',
                arrowColor: '#2E8B57',
                monthTextColor: '#2E8B57',
                textDayFontWeight: '600',
                textMonthFontWeight: 'bold',
                textMonthFontSize: 18
              }}
            />
          </View>
        </View>

        {/* Time Slots Section */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Créneaux disponibles - {format(new Date(selectedDate), 'dd/MM/yyyy')}
            </Text>
            
            {loadingSlots ? (
              <View style={styles.loadingSlotsContainer}>
                <ActivityIndicator size="small" color="#2E8B57" />
                <Text>Chargement des créneaux...</Text>
              </View>
            ) : (
              <View style={styles.timeSlotsGrid}>
                {availableSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.heure}
                    style={[
                      styles.timeSlot,
                      !slot.disponible && styles.timeSlotDisabled,
                      selectedTime === slot.heure && styles.timeSlotSelected
                    ]}
                    disabled={!slot.disponible}
                    onPress={() => handleTimeSelect(slot.heure)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      !slot.disponible && styles.timeSlotTextDisabled,
                      selectedTime === slot.heure && styles.timeSlotTextSelected
                    ]}>
                      {slot.heure}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Continue Button */}
        {selectedDate && selectedTime && (
          <View style={styles.continueSection}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinueBooking}
            >
              <Text style={styles.continueButtonText}>
                Continuer la réservation
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  doctorInfoCard: {
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
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorDetails: {
    flex: 1,
    marginLeft: 16,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#2E8B57',
    marginBottom: 4,
  },
  doctorExperience: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  doctorPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingSlotsContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E8B57',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#2E8B57',
  },
  timeSlotDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCC',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: '#999',
  },
  continueSection: {
    marginTop: 24,
    marginBottom: 32,
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
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});