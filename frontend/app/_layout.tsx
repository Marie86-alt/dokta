import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen 
          name="booking/[doctorId]" 
          options={{ 
            title: 'Réserver un rendez-vous',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="patient-form" 
          options={{ 
            title: 'Informations patient',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="payment" 
          options={{ 
            title: 'Paiement',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="booking-confirmation" 
          options={{ 
            title: 'Confirmation',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="doctor-login" 
          options={{ 
            title: 'Connexion Médecin',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="doctor-dashboard" 
          options={{ 
            title: 'Tableau de bord',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="doctor-profile" 
          options={{ 
            title: 'Mon profil',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="doctor-patients" 
          options={{ 
            title: 'Mes patients',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="doctor-availability" 
          options={{ 
            title: 'Disponibilités',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="global-search" 
          options={{ 
            title: 'Recherche globale',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="patient-tabs" 
          options={{ 
            title: 'Patient',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="doctor-tabs" 
          options={{ 
            title: 'Médecin',
            headerStyle: { backgroundColor: '#2E8B57' },
            headerTintColor: '#fff',
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}