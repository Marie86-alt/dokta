#!/bin/bash

echo "🏥 === EXPLORATEUR BASE DOKTA ==="
echo ""

# Fonction pour afficher le menu
show_menu() {
    echo "Choisissez une option:"
    echo "1) Voir tous les médecins"
    echo "2) Voir tous les rendez-vous"  
    echo "3) Voir les utilisateurs"
    echo "4) Statistiques générales"
    echo "5) Rechercher un médecin par nom"
    echo "6) Voir les rendez-vous d'aujourd'hui"
    echo "7) Accès MongoDB direct"
    echo "8) Quitter"
    echo ""
}

# Boucle principale
while true; do
    show_menu
    read -p "Votre choix (1-8): " choice
    
    case $choice in
        1)
            echo "📋 === LISTE DES MÉDECINS ==="
            mongosh mongodb://localhost:27017/test_database --eval "db.doctors.find({}, {nom: 1, specialite: 1, tarif: 1, telephone: 1}).pretty()"
            ;;
        2)
            echo "📅 === LISTE DES RENDEZ-VOUS ==="
            mongosh mongodb://localhost:27017/test_database --eval "db.appointments.find({}, {patient_name: 1, doctor_id: 1, date: 1, heure: 1, time: 1, status: 1}).limit(10).pretty()"
            ;;
        3)
            echo "👥 === LISTE DES UTILISATEURS ==="
            mongosh mongodb://localhost:27017/test_database --eval "db.users.find({}, {nom: 1, telephone: 1, type: 1}).pretty()"
            ;;
        4)
            echo "📊 === STATISTIQUES DOKTA ==="
            mongosh mongodb://localhost:27017/test_database --eval "
            console.log('Nombre total de médecins:', db.doctors.countDocuments());
            console.log('Nombre total de rendez-vous:', db.appointments.countDocuments());
            console.log('Nombre total d\'utilisateurs:', db.users.countDocuments());
            console.log('');
            console.log('=== RÉPARTITION PAR SPÉCIALITÉ ===');
            db.doctors.aggregate([{\$group: {_id: '\$specialite', count: {\$sum: 1}}}]).forEach(doc => console.log(doc._id + ':', doc.count));
            console.log('');
            console.log('=== RENDEZ-VOUS PAR STATUT ===');
            db.appointments.aggregate([{\$group: {_id: '\$status', count: {\$sum: 1}}}]).forEach(doc => console.log(doc._id + ':', doc.count));
            "
            ;;
        5)
            read -p "Entrez le nom du médecin à rechercher: " doctor_name
            echo "🔍 === RECHERCHE MÉDECIN: $doctor_name ==="
            mongosh mongodb://localhost:27017/test_database --eval "db.doctors.find({nom: {'\$regex': '$doctor_name', '\$options': 'i'}}).pretty()"
            ;;
        6)
            today=$(date +%Y-%m-%d)
            echo "📅 === RENDEZ-VOUS D'AUJOURD'HUI ($today) ==="
            mongosh mongodb://localhost:27017/test_database --eval "db.appointments.find({date: '$today'}).pretty()"
            ;;
        7)
            echo "🔧 === ACCÈS MONGODB DIRECT ==="
            echo "Connexion à MongoDB Shell..."
            mongosh mongodb://localhost:27017/test_database
            ;;
        8)
            echo "👋 Au revoir !"
            break
            ;;
        *)
            echo "❌ Option invalide. Veuillez choisir entre 1 et 8."
            ;;
    esac
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    echo ""
done