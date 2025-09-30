module.exports = {
  mongodb: {
    server: 'localhost',
    port: 27017,
    
    // Configuration pour votre base DOKTA
    admin: false,
    auth: [
      {
        database: 'test_database',
        username: '',
        password: ''
      }
    ],
    
    // Nom d'affichage
    connectionName: 'DOKTA MongoDB'
  },
  
  site: {
    baseUrl: '/',
    cookieKeyName: 'mongo-express',
    cookieSecret: 'dokta-secret-key',
    host: '0.0.0.0',
    port: 8081,
    requestSizeLimit: '50mb',
    sessionSecret: 'dokta-session-secret',
    sslEnabled: false,
    sslCert: '',
    sslKey: ''
  },
  
  // Configuration par défaut
  defaultDatabase: 'test_database',
  
  // Options d'affichage
  options: {
    console: true,
    //documentsPerPage: 10,
    editorTheme: 'rubyblue',
    maxPropSize: 100,
    //noDelete: false,
    //noExport: false,
    //readOnly: false,
    //gridFSEnabled: true,
    logger: {},
    collapsibleJSON: true,
    collapsibleJSONDefaultUnfurled: false,
    //nestMax: 100
  },
  
  // Interface personnalisée
  useBasicAuth: false
};