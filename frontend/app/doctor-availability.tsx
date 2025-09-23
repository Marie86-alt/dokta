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
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams, router } from 'expo-router';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface TimeSlot {
  heure: string;
  disponible: boolean;
}

const DEFAULT_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

export default function DoctorAvailability() {
  const { doctorId } = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weekView, setWeekView] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/available-slots?date=${selectedDate}`
      );
      const data = await response.json();
      setTimeSlots(data);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      Alert.alert('Erreur', 'Impossible de charger les créneaux disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const toggleTimeSlot = (heure: string) => {
    setTimeSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.heure === heure
          ? { ...slot, disponible: !slot.disponible }
          : slot
      )
    );
  };

  const handleSaveAvailability = async () => {
    if (!selectedDate) {
      Alert.alert('Date requise', 'Veuillez sélectionner une date');
      return;
    }

    setSaving(true);
    try {
      const availabilitySlots = timeSlots.map(slot => ({
        date: selectedDate,
        heure: slot.heure,
        disponible: slot.disponible
      }));

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(availabilitySlots),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Disponibilités mises à jour avec succès');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour les disponibilités');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllSlots = (disponible: boolean) => {
    setTimeSlots(prevSlots =>
      prevSlots.map(slot => ({ ...slot, disponible }))
    );
  };

  const applyToWeek = () => {
    Alert.alert(
      'Appliquer à toute la semaine',
      'Voulez-vous appliquer cette configuration à tous les jours de la semaine ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appliquer', onPress: handleApplyToWeek }
      ]
    );
  };

  const handleApplyToWeek = async () => {
    if (!selectedDate) return;

    const startDate = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 }); // Start on Monday
    const weekSlots = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(startDate, i);
      const dateString = format(currentDate, 'yyyy-MM-dd');
      
      timeSlots.forEach(slot => {
        weekSlots.push({
          date: dateString,
          heure: slot.heure,
          disponible: slot.disponible
        });
      });
    }

    setSaving(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weekSlots),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Disponibilités appliquées à toute la semaine');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour les disponibilités');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Generate marked dates for calendar
  const getMarkedDates = () => {
    const marked: any = {};
    const today = new Date();
    
    // Mark next 60 days as available for configuration
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      marked[dateString] = { 
        marked: true, 
        dotColor: '#2E8B57'
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

  const renderTimeSlots = () => (
    <View style={styles.timeSlotsContainer}>
      <View style={styles.slotsHeader}>
        <Text style={styles.slotsTitle}>
          Créneaux du {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => toggleAllSlots(true)}
          >
            <Text style={styles.quickActionText}>Tout sélectionner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => toggleAllSlots(false)}
          >
            <Text style={styles.quickActionText}>Tout déselectionner</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.timeGrid}>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot.heure}
            style={[
              styles.timeSlot,
              slot.disponible ? styles.timeSlotAvailable : styles.timeSlotUnavailable
            ]}
            onPress={() => toggleTimeSlot(slot.heure)}
          >
            <Text style={[
              styles.timeSlotText,
              slot.disponible ? styles.timeSlotTextAvailable : styles.timeSlotTextUnavailable
            ]}>
              {slot.heure}
            </Text>
            <Ionicons
              name={slot.disponible ? "checkmark-circle" : "close-circle"}
              size={16}
              color={slot.disponible ? "#27AE60" : "#E74C3C"}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.weekButton}
          onPress={applyToWeek}
        >
          <Ionicons name="calendar" size={16} color="#2E8B57" />
          <Text style={styles.weekButtonText}>Appliquer à la semaine</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveAvailability}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>
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
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mes Disponibilités</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#2E8B57" />
          <View style={styles.instructionsText}>
            <Text style={styles.instructionsTitle}>Gérer vos disponibilités</Text>
            <Text style={styles.instructionsDescription}>
              Sélectionnez une date dans le calendrier, puis activez ou désactivez vos créneaux horaires. 
              Les créneaux désactivés n'apparaîtront pas aux patients.
            </Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>Sélectionner une date</Text>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={getMarkedDates()}
            minDate={format(new Date(), 'yyyy-MM-dd')}
            maxDate={format(addDays(new Date(), 60), 'yyyy-MM-dd')}
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

        {/* Time Slots */}
        {selectedDate && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text>Chargement des créneaux...</Text>
              </View>
            ) : (
              renderTimeSlots()
            )}
          </>
        )}

        {/* Quick Setup Presets */}
        <View style={styles.presetsCard}>
          <Text style={styles.sectionTitle}>Configurations rapides</Text>
          <Text style={styles.presetsDescription}>
            Utilisez ces configurations prédéfinies pour gagner du temps
          </Text>
          
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => {
              setTimeSlots(DEFAULT_TIME_SLOTS.map(heure => ({ heure, disponible: true })));
            }}
          >
            <Ionicons name="time" size={20} color="#2E8B57" />
            <View style={styles.presetContent}>
              <Text style={styles.presetTitle}>Journée complète</Text>
              <Text style={styles.presetDescription}>Tous les créneaux disponibles (9h-17h)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => {
              const morningSlots = DEFAULT_TIME_SLOTS.map(heure => ({
                heure,
                disponible: heure < "12:00"
              }));
              setTimeSlots(morningSlots);
            }}
          >
            <Ionicons name="sunny" size={20} color="#F39C12" />
            <View style={styles.presetContent}>
              <Text style={styles.presetTitle}>Matinée uniquement</Text>
              <Text style={styles.presetDescription}>Créneaux de 9h à 11h30</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => {
              const afternoonSlots = DEFAULT_TIME_SLOTS.map(heure => ({
                heure,
                disponible: heure >= "14:00"
              }));
              setTimeSlots(afternoonSlots);
            }}
          >
            <Ionicons name="moon" size={20} color="#9B59B6" />
            <View style={styles.presetContent}>
              <Text style={styles.presetTitle}>Après-midi uniquement</Text>
              <Text style={styles.presetDescription}>Créneaux de 14h à 17h</Text>
            </View>
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
  instructionsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 4,
  },
  instructionsDescription: {
    fontSize: 14,
    color: '#2E8B57',
    lineHeight: 20,
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
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  timeSlotsContainer: {
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
  slotsHeader: {
    marginBottom: 16,
  },
  slotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
  },
  quickActionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: '30%',
    gap: 4,
  },
  timeSlotAvailable: {
    backgroundColor: '#E8F5E8',
    borderColor: '#27AE60',
  },
  timeSlotUnavailable: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E74C3C',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeSlotTextAvailable: {
    color: '#27AE60',
  },
  timeSlotTextUnavailable: {
    color: '#E74C3C',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  weekButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2E8B57',
    borderRadius: 8,
    gap: 4,
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E8B57',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#2E8B57',
    borderRadius: 8,
    gap: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  presetsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  presetsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  presetContent: {
    flex: 1,
    marginLeft: 12,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  presetDescription: {
    fontSize: 12,
    color: '#666',
  },
});