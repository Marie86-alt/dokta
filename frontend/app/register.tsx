import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const [userType, setUserType] = useState<'patient' | 'medecin'>('patient');
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    mot_de_passe: '',
    confirmPassword: '',
    // Patient fields
    age: '',
    ville: '',
    // Medecin fields
    specialite: '',
    experience: '',
    tarif: '',
    diplomes: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const specialities = [
    'Généraliste', 'Cardiologue', 'Dermatologue', 'Gynécologue',
    'Pédiatre', 'Ophtalmologue', 'Orthopédiste', 'Psychiatre'
  ];

  const validateCameroonPhone = (phone: string) => {
    if (!phone.startsWith('+237')) return false;
    const numberPart = phone.substring(4);
    return numberPart.length === 9 && /^\d+$/.test(numberPart) && ['6', '7', '2'].includes(numberPart[0]);
  };

  const formatPhoneNumber = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('237')) {
      cleaned = '+' + cleaned;
    } else if (['6', '7', '2'].includes(cleaned[0]) && cleaned.length <= 9) {
      cleaned = '+237' + cleaned;
    }
    
    return cleaned;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'telephone') {
      value = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { nom, telephone, mot_de_passe, confirmPassword } = formData;
    
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return false;
    }

    if (!validateCameroonPhone(telephone)) {
      Alert.alert('Erreur', 'Numéro de téléphone camerounais invalide\nFormat: +237XXXXXXXXX');
      return false;
    }

    if (mot_de_passe.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (mot_de_passe !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return false;
    }

    if (userType === 'patient') {
      if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
        Alert.alert('Erreur', 'Veuillez entrer un âge valide (1-120 ans)');
        return false;
      }
      if (!formData.ville.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer votre ville');
        return false;
      }
    } else {
      if (!formData.specialite) {
        Alert.alert('Erreur', 'Veuillez sélectionner votre spécialité');
        return false;
      }
      if (!formData.experience.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer votre expérience');
        return false;
      }
      if (!formData.tarif || parseInt(formData.tarif) < 1000) {
        Alert.alert('Erreur', 'Veuillez entrer un tarif valide (minimum 1000 FCFA)');
        return false;
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const registerData = {
        nom: formData.nom.trim(),
        telephone: formData.telephone,
        mot_de_passe: formData.mot_de_passe,
        type_utilisateur: userType,
        ...(userType === 'patient' ? {
          age: parseInt(formData.age),
          ville: formData.ville.trim(),
        } : {
          specialite: formData.specialite,
          experience: formData.experience.trim(),
          tarif: parseInt(formData.tarif),
          diplomes: formData.diplomes.trim(),
        }),
      };

      await register(registerData);
      
      Alert.alert('Succès', 'Inscription réussie !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message || 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inscription</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* User Type Selection */}
          <View style={styles.userTypeSection}>
            <Text style={styles.sectionTitle}>Je suis :</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'patient' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('patient')}
              >
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={userType === 'patient' ? '#FFFFFF' : '#2E8B57'} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'patient' && styles.userTypeTextActive
                ]}>
                  Patient
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'medecin' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('medecin')}
              >
                <Ionicons 
                  name="medical" 
                  size={24} 
                  color={userType === 'medecin' ? '#FFFFFF' : '#2E8B57'} 
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'medecin' && styles.userTypeTextActive
                ]}>
                  Médecin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Common Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom complet *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Votre nom et prénom"
                  placeholderTextColor="#999"
                  value={formData.nom}
                  onChangeText={(value) => handleInputChange('nom', value)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numéro de téléphone *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="+237699123456"
                  placeholderTextColor="#999"
                  value={formData.telephone}
                  onChangeText={(value) => handleInputChange('telephone', value)}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>
              {formData.telephone && !validateCameroonPhone(formData.telephone) && (
                <Text style={styles.errorText}>
                  Format: +237XXXXXXXXX (9 chiffres après +237)
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor="#999"
                  value={formData.mot_de_passe}
                  onChangeText={(value) => handleInputChange('mot_de_passe', value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmer le mot de passe *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  style={styles.input}
                  placeholder="Répétez votre mot de passe"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Patient-specific fields */}
            {userType === 'patient' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Âge *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Votre âge"
                      placeholderTextColor="#999"
                      value={formData.age}
                      onChangeText={(value) => handleInputChange('age', value)}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Ville *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Douala, Yaoundé..."
                      placeholderTextColor="#999"
                      value={formData.ville}
                      onChangeText={(value) => handleInputChange('ville', value)}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Doctor-specific fields */}
            {userType === 'medecin' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Spécialité *</Text>
                  <View style={styles.pickerContainer}>
                    <Ionicons name="medical-outline" size={20} color="#666" />
                    <Picker
                      selectedValue={formData.specialite}
                      style={styles.picker}
                      onValueChange={(value) => handleInputChange('specialite', value)}
                    >
                      <Picker.Item label="Sélectionnez votre spécialité" value="" />
                      {specialities.map(spec => (
                        <Picker.Item key={spec} label={spec} value={spec} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Expérience *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 5 ans d'expérience"
                      placeholderTextColor="#999"
                      value={formData.experience}
                      onChangeText={(value) => handleInputChange('experience', value)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tarif de consultation (FCFA) *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="cash-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="15000"
                      placeholderTextColor="#999"
                      value={formData.tarif}
                      onChangeText={(value) => handleInputChange('tarif', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Diplômes (optionnel)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="school-outline" size={20} color="#666" />
                    <TextInput
                      style={styles.input}
                      placeholder="Vos diplômes et certifications"
                      placeholderTextColor="#999"
                      value={formData.diplomes}
                      onChangeText={(value) => handleInputChange('diplomes', value)}
                      multiline
                    />
                  </View>
                </View>
              </>
            )}

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.registerButtonText}>Créer mon compte</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
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
  userTypeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E8B57',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  userTypeButtonActive: {
    backgroundColor: '#2E8B57',
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
  },
  userTypeTextActive: {
    color: '#FFFFFF',
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#E74C3C',
    marginTop: 4,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    gap: 10,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  registerButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: 'bold',
  },
});