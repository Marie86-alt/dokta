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
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface Template {
  id: string;
  name: string;
  type: 'prescription' | 'certificate' | 'report';
  content: string;
}

interface GeneratedDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  patient: string;
  content: string;
}

export default function DoctorDocuments() {
  const [activeTab, setActiveTab] = useState<'create' | 'templates' | 'history'>('create');
  const [documentType, setDocumentType] = useState<'prescription' | 'certificate' | 'report'>('prescription');
  const [patientName, setPatientName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Ordonnance standard',
      type: 'prescription',
      content: 'Prescription médicale\n\nPatient: [PATIENT_NAME]\nDate: [DATE]\n\nMédication:\n- \n\nPosologie:\n- \n\nDurée du traitement: \n\nRecommandations: \n\nDr. [DOCTOR_NAME]'
    },
    {
      id: '2',
      name: 'Certificat médical',
      type: 'certificate',
      content: 'Certificat médical\n\nJe soussigné Dr. [DOCTOR_NAME], certifie avoir examiné [PATIENT_NAME] ce jour.\n\nConclusion: \n\nRecommandation d\'arrêt de travail: \n\nDurée: \n\nFait à Yaoundé, le [DATE]'
    }
  ]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);

  const documentTypes = [
    { key: 'prescription', label: 'Ordonnance', icon: 'medical' },
    { key: 'certificate', label: 'Certificat', icon: 'document-text' },
    { key: 'report', label: 'Rapport', icon: 'clipboard' },
  ];

  const generateDocument = async () => {
    if (!patientName.trim() || !documentContent.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir le nom du patient et le contenu');
      return;
    }

    const newDoc: GeneratedDocument = {
      id: Date.now().toString(),
      name: `${getDocumentTypeLabel(documentType)} - ${patientName}`,
      type: documentType,
      date: new Date().toISOString().split('T')[0],
      patient: patientName,
      content: documentContent
    };

    setGeneratedDocs(prev => [newDoc, ...prev]);
    
    // Générer le fichier PDF (simulation)
    try {
      const fileName = `${newDoc.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, documentContent);
      
      Alert.alert(
        'Document créé',
        'Le document a été généré avec succès',
        [
          { text: 'OK' },
          { 
            text: 'Partager', 
            onPress: () => Sharing.shareAsync(fileUri) 
          }
        ]
      );
      
      // Reset form
      setPatientName('');
      setDocumentContent('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le document');
    }
  };

  const useTemplate = (template: Template) => {
    const content = template.content
      .replace(/\[PATIENT_NAME\]/g, patientName || '[Nom du patient]')
      .replace(/\[DATE\]/g, new Date().toLocaleDateString('fr-FR'))
      .replace(/\[DOCTOR_NAME\]/g, 'Dr. Marie Ngono'); // À récupérer du profil médecin
    
    setDocumentContent(content);
    setDocumentType(template.type);
    setActiveTab('create');
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'prescription': return 'Ordonnance';
      case 'certificate': return 'Certificat médical';
      case 'report': return 'Rapport de consultation';
      default: return 'Document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prescription': return '#2E8B57';
      case 'certificate': return '#3498DB';
      case 'report': return '#9B59B6';
      default: return '#666';
    }
  };

  const renderCreateTab = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.tabContent}
    >
      <ScrollView>
        {/* Document Type Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Type de document</Text>
          <View style={styles.documentTypeGrid}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  documentType === type.key && styles.typeButtonActive
                ]}
                onPress={() => setDocumentType(type.key as any)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={documentType === type.key ? '#FFFFFF' : '#666'}
                />
                <Text style={[
                  styles.typeButtonText,
                  documentType === type.key && styles.typeButtonTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Patient Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Informations patient</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nom complet du patient"
            value={patientName}
            onChangeText={setPatientName}
          />
        </View>

        {/* Document Content */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contenu du document</Text>
          <TextInput
            style={styles.textArea}
            placeholder={`Rédigez votre ${getDocumentTypeLabel(documentType).toLowerCase()} ici...`}
            value={documentContent}
            onChangeText={setDocumentContent}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity style={styles.generateButton} onPress={generateDocument}>
          <Ionicons name="create" size={20} color="#FFFFFF" />
          <Text style={styles.generateButtonText}>Générer le document</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderTemplatesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.tabDescription}>
        Utilisez des modèles prédéfinis pour créer rapidement vos documents
      </Text>
      
      {templates.map((template) => (
        <View key={template.id} style={styles.templateCard}>
          <View style={styles.templateHeader}>
            <View style={styles.templateIcon}>
              <Ionicons
                name={documentTypes.find(t => t.key === template.type)?.icon as any}
                size={24}
                color={getTypeColor(template.type)}
              />
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateType}>{getDocumentTypeLabel(template.type)}</Text>
            </View>
          </View>
          
          <Text style={styles.templatePreview} numberOfLines={3}>
            {template.content}
          </Text>
          
          <TouchableOpacity
            style={styles.useTemplateButton}
            onPress={() => useTemplate(template)}
          >
            <Text style={styles.useTemplateText}>Utiliser ce modèle</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent}>
      {generatedDocs.length > 0 ? (
        generatedDocs.map((doc) => (
          <View key={doc.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyIcon}>
                <Ionicons
                  name="document-text"
                  size={24}
                  color={getTypeColor(doc.type)}
                />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{doc.name}</Text>
                <Text style={styles.historyDate}>
                  {new Date(doc.date).toLocaleDateString('fr-FR')}
                </Text>
                <Text style={styles.historyPatient}>Patient: {doc.patient}</Text>
              </View>
            </View>
            
            <View style={styles.historyActions}>
              <TouchableOpacity style={styles.historyActionButton}>
                <Ionicons name="eye-outline" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.historyActionButton}>
                <Ionicons name="share-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Aucun document généré</Text>
          <Text style={styles.emptyText}>
            Les documents que vous créerez apparaîtront ici
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E8B57" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Documents Médicaux</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && styles.tabActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            Créer
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Modèles
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'templates' && renderTemplatesTab()}
      {activeTab === 'history' && renderHistoryTab()}
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
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2E8B57',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#2E8B57',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  tabDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  documentTypeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  typeButtonActive: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    minHeight: 150,
  },
  generateButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  templateType: {
    fontSize: 12,
    color: '#666',
  },
  templatePreview: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  useTemplateButton: {
    backgroundColor: '#2E8B57',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  useTemplateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyPatient: {
    fontSize: 12,
    color: '#666',
  },
  historyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  historyActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});