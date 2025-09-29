import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

class LocationService {
  private currentLocation: LocationData | null = null;

  /**
   * Demander les permissions de localisation
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissions refusées',
          'Les permissions de localisation sont nécessaires pour trouver les médecins près de vous.',
          [
            { text: 'OK', style: 'default' }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur demande permissions localisation:', error);
      return false;
    }
  }

  /**
   * Obtenir la position actuelle de l'utilisateur
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        return null;
      }

      console.log('📍 Récupération de la position...');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Géocodage inverse pour obtenir l'adresse
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          locationData.address = `${place.street || ''} ${place.streetNumber || ''}`.trim();
          locationData.city = place.city || place.subregion || '';
          locationData.country = place.country || '';
        }
      } catch (geocodeError) {
        console.warn('Erreur géocodage inverse:', geocodeError);
      }

      this.currentLocation = locationData;
      console.log('✅ Position obtenue:', locationData);

      return locationData;
    } catch (error) {
      console.error('Erreur récupération position:', error);
      Alert.alert(
        'Erreur de localisation',
        'Impossible de récupérer votre position. Vérifiez que le GPS est activé.',
        [{ text: 'OK', style: 'default' }]
      );
      return null;
    }
  }

  /**
   * Calculer la distance entre deux points (en km)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Obtenir la position actuelle stockée
   */
  getCurrentLocationData(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * Créer URL Google Maps pour navigation
   */
  createMapsUrl(destinationLat: number, destinationLon: number): string {
    if (this.currentLocation) {
      return `https://www.google.com/maps/dir/${this.currentLocation.latitude},${this.currentLocation.longitude}/${destinationLat},${destinationLon}`;
    } else {
      return `https://www.google.com/maps/search/?api=1&query=${destinationLat},${destinationLon}`;
    }
  }

  /**
   * Formater l'adresse pour affichage
   */
  formatAddress(location: LocationData): string {
    const parts = [];
    
    if (location.address && location.address.trim()) {
      parts.push(location.address);
    }
    
    if (location.city && location.city.trim()) {
      parts.push(location.city);
    }

    if (parts.length === 0) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }

    return parts.join(', ');
  }

  /**
   * Simuler des médecins avec positions géographiques (Yaoundé)
   */
  getMockDoctorsWithLocation() {
    return [
      {
        id: 'geo-1',
        nom: 'Dr. Jean Atangana',
        specialite: 'Cardiologue',
        latitude: 3.8480,
        longitude: 11.5021,
        adresse: 'Avenue Charles de Gaulle, Yaoundé',
      },
      {
        id: 'geo-2', 
        nom: 'Dr. Marie Fouda',
        specialite: 'Généraliste',
        latitude: 3.8680,
        longitude: 11.5121,
        adresse: 'Quartier Bastos, Yaoundé',
      },
      {
        id: 'geo-3',
        nom: 'Dr. Paul Mbida',
        specialite: 'Pédiatre', 
        latitude: 3.8380,
        longitude: 11.4921,
        adresse: 'Carrefour Warda, Yaoundé',
      },
    ];
  }
}

export default new LocationService();