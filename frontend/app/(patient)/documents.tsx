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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

interface Document {
  id: string;
  name: string;
  type: 'prescription' | 'certificate' | 'result' | 'report' | 'other';
  date: string;
  doctor?: string;
  size?: number;
  uri?: string;
}

export default function PatientDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    // Simulation de documents (à remplacer par une vraie API)
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Ordonnance - Dr. Marie Ngono',
        type: 'prescription',
        date: '2024-09-20',
        doctor: 'Dr. Marie Ngono',
        size: 245000,
      },
      {
        id: '2',
        name: 'Résultats analyse sanguine',
        type: 'result',
        date: '2024-09-15',
        doctor: 'Laboratoire Central',
        size: 180000,
      },
      {
        id: '3',
        name: 'Certificat médical',
        type: 'certificate',
        date: '2024-09-10',
        doctor: 'Dr. Jean Mbarga',
        size: 120000,
      },
    ];
    setDocuments(mockDocuments);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const newDocument: Document = {
          id: Date.now().toString(),
          name: asset.name || 'Document sans nom',
          type: 'other',
          date: new Date().toISOString().split('T')[0],
          size: asset.size,
          uri: asset.uri,
        };

        setDocuments(prev => [newDocument, ...prev]);
        Alert.alert('Succès', 'Document ajouté avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  };

  const shareDocument = async (doc: Document) => {
    try {
      if (doc.uri) {
        await Sharing.shareAsync(doc.uri);
      } else {
        Alert.alert('Information', 'Ce document ne peut pas être partagé');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager le document');
    }
  };

  const deleteDocument = (docId: string) => {
    Alert.alert(
      'Supprimer le document',
      'Êtes-vous sûr de vouloir supprimer ce document ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(doc => doc.id !== docId));
          }
        }
      ]
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Taille inconnue';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'prescription': return 'medical';
      case 'certificate': return 'document-text';
      case 'result': return 'analytics';
      case 'report': return 'clipboard';
      default: return 'document-outline';
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'prescription': return '#2E8B57';
      case 'certificate': return '#3498DB';
      case 'result': return '#F39C12';
      case 'report': return '#9B59B6';
      default: return '#666';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'prescription': return 'Ordonnance';
      case 'certificate': return 'Certificat';
      case 'result': return 'Résultat';
      case 'report': return 'Rapport';
      default: return 'Document';
    }
  };

  const filteredDocuments = documents.filter(doc => 
    filter === 'all' || doc.type === filter
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Mes Documents</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={pickDocument}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'Tous' },
            { key: 'prescription', label: 'Ordonnances' },
            { key: 'result', label: 'Résultats' },
            { key: 'certificate', label: 'Certificats' },
            { key: 'report', label: 'Rapports' },
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.key}
              style={[
                styles.filterButton,
                filter === filterOption.key && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterOption.key)}
            >
              <Text style={[
                styles.filterButtonText,
                filter === filterOption.key && styles.filterButtonTextActive
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {/* Storage Info */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Ionicons name="cloud" size={24} color="#2E8B57" />
            <Text style={styles.storageTitle}>Stockage</Text>
          </View>
          <Text style={styles.storageText}>
            {documents.length} document(s) • Sauvegarde automatique activée
          </Text>
        </View>

        {/* Documents List */}
        {filteredDocuments.length > 0 ? (
          <View style={styles.documentsContainer}>
            {filteredDocuments.map((doc) => (
              <View key={doc.id} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentIcon}>
                    <Ionicons
                      name={getDocumentIcon(doc.type) as any}
                      size={24}
                      color={getDocumentColor(doc.type)}
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={2}>
                      {doc.name}
                    </Text>
                    <View style={styles.documentMeta}>
                      <View style={styles.documentType}>
                        <Text style={[
                          styles.documentTypeText,
                          { color: getDocumentColor(doc.type) }
                        ]}>
                          {getTypeLabel(doc.type)}
                        </Text>
                      </View>
                      <Text style={styles.documentDate}>
                        {new Date(doc.date).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    {doc.doctor && (
                      <Text style={styles.documentDoctor}>{doc.doctor}</Text>
                    )}
                    <Text style={styles.documentSize}>
                      {formatFileSize(doc.size)}
                    </Text>
                  </View>
                </View>

                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => shareDocument(doc)}
                  >
                    <Ionicons name="share-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Aperçu', 'Fonctionnalité bientôt disponible')}
                  >
                    <Ionicons name="eye-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteDocument(doc.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>Aucun document</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Vous n\'avez aucun document pour le moment'
                : `Aucun document de type "${getTypeLabel(filter)}" trouvé`}
            </Text>
            <TouchableOpacity style={styles.addDocumentButton} onPress={pickDocument}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addDocumentText}>Ajouter un document</Text>
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
    paddingTop: 40,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2E8B57',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  storageCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2E8B57',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginLeft: 8,
  },
  storageText: {
    fontSize: 14,
    color: '#2E8B57',
  },
  documentsContainer: {
    gap: 12,
  },
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  documentType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  documentTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
  },
  documentDoctor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  documentSize: {
    fontSize: 12,
    color: '#999',
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addDocumentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});