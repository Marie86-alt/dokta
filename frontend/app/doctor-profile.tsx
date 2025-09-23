import React, { useState, useEffect } from 'react';
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
  Platform,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Doctor {
  id: string;
  nom: string;
  specialite: string;
  experience: string;
  tarif: number;
  telephone: string;
  disponible: boolean;
}

export default function DoctorProfile() {
  const { doctorId } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    experience: '',
    tarif: '',
    disponible: true
  });

  useEffect(() => {
    fetchDoctorProfile();
  }, [doctorId]);

  const fetchDoctorProfile = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}`);
      const data = await response.json();
      
      setDoctor(data);
      setFormData({
        nom: data.nom,
        telephone: data.telephone,
        experience: data.experience,
        tarif: data.tarif.toString(),
        disponible: data.disponible
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.nom || !formData.telephone || !formData.experience || !formData.tarif) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);

    try {
      const updates = {
        nom: formData.nom,
        telephone: formData.telephone,
        experience: formData.experience,
        tarif: parseInt(formData.tarif),
        disponible: formData.disponible
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors/${doctorId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedDoctor = await response.json();
        setDoctor(updatedDoctor);
        setEditMode(false);
        Alert.alert('Succès', 'Profil mis à jour avec succès');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (doctor) {
      setFormData({
        nom: doctor.nom,
        telephone: doctor.telephone,
        experience: doctor.experience,
        tarif: doctor.tarif.toString(),
        disponible: doctor.disponible
      });
    }
    setEditMode(false);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Chargement du profil...</Text>
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
          <Text style={styles.title}>Mon Profil</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editMode ? handleSaveProfile() : setEditMode(true)}
          disabled={saving}
        >
          <Ionicons 
            name={editMode ? "checkmark" : "pencil"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content}>
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={100} color="#2E8B57" />
            </View>
            <Text style={styles.doctorName}>
              {editMode ? formData.nom : doctor?.nom}
            </Text>
            <Text style={styles.doctorSpecialty}>{doctor?.specialite}</Text>
          </View>

          {/* Profile Information */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet</Text>
              {editMode ? (
                <TextInput
                  style={styles.textInput}
                  value={formData.nom}
                  onChangeText={(value) => setFormData(prev => ({...prev, nom: value}))}
                  placeholder="Nom complet"
                  placeholderTextColor="#999"
                />
              ) : (
                <View style={styles.infoDisplay}>
                  <Text style={styles.infoValue}>{doctor?.nom}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              {editMode ? (
                <TextInput
                  style={styles.textInput}
                  value={formData.telephone}
                  onChangeText={(value) => setFormData(prev => ({...prev, telephone: value}))}
                  placeholder="Numéro de téléphone"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={styles.infoDisplay}>
                  <Text style={styles.infoValue}>{doctor?.telephone}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expérience</Text>
              {editMode ? (
                <TextInput
                  style={styles.textInput}
                  value={formData.experience}
                  onChangeText={(value) => setFormData(prev => ({...prev, experience: value}))}
                  placeholder="Ex: 5 ans"
                  placeholderTextColor="#999"
                />
              ) : (
                <View style={styles.infoDisplay}>
                  <Text style={styles.infoValue}>{doctor?.experience}</Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tarif de consultation (FCFA)</Text>
              {editMode ? (
                <TextInput
                  style={styles.textInput}
                  value={formData.tarif}
                  onChangeText={(value) => setFormData(prev => ({...prev, tarif: value}))}
                  placeholder="Tarif en FCFA"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              ) : (
                <View style={styles.infoDisplay}>
                  <Text style={styles.infoValue}>{formatPrice(doctor?.tarif || 0)}</Text>
                </View>
              )}
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.inputLabel}>Disponible pour de nouveaux patients</Text>
              <Switch
                value={editMode ? formData.disponible : doctor?.disponible}
                onValueChange={(value) => {
                  if (editMode) {
                    setFormData(prev => ({...prev, disponible: value}));
                  }
                }}
                trackColor={{ false: '#CCC', true: '#2E8B57' }}
                thumbColor={editMode ? (formData.disponible ? '#FFFFFF' : '#F4F3F4') : (doctor?.disponible ? '#FFFFFF' : '#F4F3F4')}
                disabled={!editMode}
              />
            </View>
          </View>

          {/* Speciality Card (Read-only) */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Spécialité médicale</Text>
            <View style={styles.specialtyDisplay}>
              <Ionicons name="medical" size={24} color="#2E8B57" />
              <Text style={styles.specialtyText}>{doctor?.specialite}</Text>
            </View>
            <Text style={styles.specialtyNote}>
              La spécialité ne peut pas être modifiée via l'application. 
              Contactez l'administration si nécessaire.
            </Text>
          </View>

          {/* Action Buttons */}
          {editMode && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Ionicons name="close" size={20} color="#E74C3C" />
                <Text style={[styles.actionButtonText, { color: '#E74C3C' }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, saving && styles.disabledButton]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Statistics Card */}
          <View style={styles.statsCard}>
            <Text style={styles.cardTitle}>Statistiques du profil</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={20} color="#3498DB" />
                <Text style={styles.statLabel}>Membre depuis</Text>
                <Text style={styles.statValue}>2024</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={20} color="#F39C12" />
                <Text style={styles.statLabel}>Évaluation</Text>
                <Text style={styles.statValue}>4.8/5</Text>
              </View>
            </View>
          </View>
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
  editButton: {
    marginLeft: 16,
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
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  infoDisplay: {
    paddingVertical: 12,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  specialtyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  specialtyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E8B57',
    marginLeft: 12,
  },
  specialtyNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  saveButton: {
    backgroundColor: '#2E8B57',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});