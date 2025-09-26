import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  appointmentId: string;
  appointmentType: 'cabinet' | 'domicile';
  doctorName: string;
  appointmentTime: string;
  address: string;
  latitude?: string;
  longitude?: string;
  mapsUrl: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Enregistrer l'appareil pour les notifications push
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Les notifications push nécessitent un appareil physique');
        return null;
      }

      // Vérifier les permissions existantes
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Demander les permissions si nécessaires
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission refusée pour les notifications push');
        return null;
      }

      // Obtenir le token Expo
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log('Token push Expo:', this.expoPushToken);

      // Configurer les catégories de notifications
      await this.setupNotificationCategories();

      return this.expoPushToken;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des notifications:', error);
      return null;
    }
  }

  /**
   * Configurer les catégories de notifications avec actions
   */
  private async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('appointment-reminder', [
      {
        identifier: 'view-maps',
        buttonTitle: 'Voir itinéraire',
        options: {
          foreground: true,
        },
      },
      {
        identifier: 'view-appointment',
        buttonTitle: 'Voir RDV',
        options: {
          foreground: true,
        },
      },
    ]);
  }

  /**
   * Enregistrer le token sur le serveur backend
   */
  async registerTokenWithBackend(userId: string, token: string): Promise<boolean> {
    try {
      const EXPO_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const response = await fetch(`${EXPO_BACKEND_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          expo_token: token,
          device_info: {
            platform: Platform.OS,
            deviceName: Device.deviceName,
            osVersion: Device.osVersion,
          },
        }),
      });

      if (response.ok) {
        console.log('Token enregistré avec succès sur le serveur');
        return true;
      } else {
        console.error('Erreur lors de l\'enregistrement du token:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Erreur réseau lors de l\'enregistrement du token:', error);
      return false;
    }
  }

  /**
   * Configurer les gestionnaires de notifications
   */
  setupNotificationHandlers() {
    // Notification reçue en premier plan
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    // Réponse à une notification (clic utilisateur)
    Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      const { actionIdentifier } = response;

      console.log('Réponse notification:', { data, actionIdentifier });

      this.handleNotificationResponse(data as NotificationData, actionIdentifier);
    });
  }

  /**
   * Gérer les réponses aux notifications
   */
  private async handleNotificationResponse(data: NotificationData, actionIdentifier: string) {
    const { Linking } = require('expo-linking');

    switch (actionIdentifier) {
      case 'view-maps':
        if (data.mapsUrl) {
          await Linking.openURL(data.mapsUrl);
        }
        break;

      case 'view-appointment':
        // Navigation vers les détails du rendez-vous
        // Cette logique sera implémentée selon votre système de navigation
        console.log('Navigation vers RDV:', data.appointmentId);
        break;

      default:
        // Clic par défaut sur la notification
        if (data.mapsUrl) {
          await Linking.openURL(data.mapsUrl);
        }
        break;
    }
  }

  /**
   * Programmer une notification locale de test
   */
  async scheduleTestNotification(seconds: number = 5) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test DOKTA 🩺',
          body: 'Votre rendez-vous dans 1 heure',
          data: {
            appointmentId: 'test-123',
            appointmentType: 'cabinet',
            doctorName: 'Dr Mbarga',
            mapsUrl: 'https://maps.google.com/?q=Yaoundé,Cameroon',
          },
          categoryIdentifier: 'appointment-reminder',
          sound: 'default',
        },
        trigger: {
          seconds: seconds,
        },
      });

      console.log(`Notification de test programmée dans ${seconds} secondes`);
    } catch (error) {
      console.error('Erreur programmation notification test:', error);
    }
  }

  /**
   * Annuler toutes les notifications programmées
   */
  async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Toutes les notifications programmées ont été annulées');
  }

  /**
   * Obtenir le nombre de notifications en attente
   */
  async getPendingNotificationsCount(): Promise<number> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  }
}

export default new NotificationService();