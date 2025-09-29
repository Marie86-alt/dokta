import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocationService, { LocationData } from '../services/locationService';

interface LocationButtonProps {
  onLocationUpdate?: (location: LocationData | null) => void;
  compact?: boolean;
  style?: any;
}

export default function LocationButton({ 
  onLocationUpdate, 
  compact = false, 
  style 
}: LocationButtonProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Essayer de récupérer la position automatiquement au montage
    handleLocationRequest();
  }, []);

  const handleLocationRequest = async () => {
    setIsLoading(true);
    try {
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData);
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLocationText = () => {
    if (!location) return 'Localiser';
    
    if (compact) {
      return location.city || 'Position trouvée';
    }
    
    return LocationService.formatAddress(location);
  };

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactButton, style]}
        onPress={handleLocationRequest}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#2E8B57" />
        ) : (
          <Ionicons 
            name={location ? "location" : "location-outline"} 
            size={20} 
            color={location ? "#2E8B57" : "#666"} 
          />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.locationButton, style]}
      onPress={handleLocationRequest}
      activeOpacity={0.7}
    >
      <View style={styles.locationButtonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#2E8B57" />
        ) : (
          <Ionicons 
            name={location ? "location" : "location-outline"} 
            size={16} 
            color={location ? "#2E8B57" : "#666"} 
          />
        )}
        <Text 
          style={[
            styles.locationButtonText, 
            location && styles.locationButtonTextActive
          ]}
          numberOfLines={1}
        >
          {formatLocationText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  locationButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxWidth: 200,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  locationButtonTextActive: {
    color: '#2E8B57',
    fontWeight: '500',
  },
  compactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});