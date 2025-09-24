import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Index() {
  const handleUserTypeSelect = (userType: 'patient' | 'medecin') => {
    if (userType === 'patient') {
      router.push('/patient-tabs');
    } else {
      router.push('/doctor-login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="medical" size={40} color="#FFFFFF" />
          <Text style={styles.title}>MediBook Cameroun</Text>
          <Text style={styles.subtitle}>Votre santé, notre priorité</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Bienvenue</Text>
        <Text style={styles.welcomeText}>
          Réservez facilement vos consultations médicales en ligne
        </Text>
        
        <View style={styles.userTypeContainer}>
          <Text style={styles.sectionTitle}>Vous êtes :</Text>
          
          <TouchableOpacity
            style={styles.userTypeCard}
            onPress={() => handleUserTypeSelect('patient')}
          >
            <View style={styles.userTypeIcon}>
              <Ionicons name="person" size={30} color="#2E8B57" />
            </View>
            <View style={styles.userTypeContent}>
              <Text style={styles.userTypeTitle}>Patient</Text>
              <Text style={styles.userTypeDescription}>
                Rechercher et réserver un rendez-vous
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.userTypeCard}
            onPress={() => handleUserTypeSelect('medecin')}
          >
            <View style={styles.userTypeIcon}>
              <Ionicons name="medical" size={30} color="#2E8B57" />
            </View>
            <View style={styles.userTypeContent}>
              <Text style={styles.userTypeTitle}>Médecin</Text>
              <Text style={styles.userTypeDescription}>
                Gérer vos consultations et planning
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>
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
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  userTypeContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userTypeContent: {
    flex: 1,
  },
  userTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
});