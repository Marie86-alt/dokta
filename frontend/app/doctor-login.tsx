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
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function DoctorLogin() {
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDoctorLogin = async () => {
    if (!telephone) {
      Alert.alert('Numéro requis', 'Veuillez entrer votre numéro de téléphone');
      return;
    }

    setLoading(true);
    
    try {
      // Chercher le médecin par numéro de téléphone
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/doctors`);
      const doctors = await response.json();
      
      const doctor = doctors.find((d: any) => d.telephone === telephone);
      
      if (doctor) {
        router.replace({
          pathname: '/doctor-tabs',
          params: { doctorId: doctor.id }
        });
      } else {
        Alert.alert(
          'Médecin non trouvé',
          'Numéro de téléphone non reconnu. Souhaitez-vous créer un profil médecin ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Créer un profil', 
              onPress: () => router.push('/doctor-register')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      Alert.alert('Erreur', 'Impossible de se connecter. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.title}>Espace Médecin</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="medical" size={60} color="#2E8B57" />
            </View>
            <Text style={styles.welcomeTitle}>Bienvenue Docteur</Text>
            <Text style={styles.welcomeText}>
              Connectez-vous pour accéder à votre espace de gestion
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.loginCard}>
            <Text style={styles.formTitle}>Connexion</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={telephone}
                  onChangeText={setTelephone}
                  placeholder="Ex: +237 690 123 456"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleDoctorLogin}
              disabled={loading}
            >
              <Ionicons name="log-in" size={20} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/doctor-register')}
            >
              <Ionicons name="person-add" size={20} color="#2E8B57" />
              <Text style={styles.registerButtonText}>
                Créer un profil médecin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Demo Account */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Compte de démonstration</Text>
            <Text style={styles.demoText}>
              Utilisez un des numéros suivants pour tester l'interface médecin :
            </Text>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setTelephone('+237690123456')}
            >
              <Text style={styles.demoButtonText}>Dr. Marie Ngono - Généraliste</Text>
              <Text style={styles.demoPhone}>+237690123456</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => setTelephone('+237691234567')}
            >
              <Text style={styles.demoButtonText}>Dr. Jean Mbarga - Cardiologie</Text>
              <Text style={styles.demoPhone}>+237691234567</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  inputIcon: {
    marginLeft: 12,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#CCC',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  registerButton: {
    borderWidth: 1,
    borderColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  demoSection: {
    backgroundColor: '#FFF8DC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 14,
    color: '#8B4513',
    marginBottom: 16,
    lineHeight: 20,
  },
  demoButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  demoPhone: {
    fontSize: 12,
    color: '#2E8B57',
    marginTop: 2,
  },
});