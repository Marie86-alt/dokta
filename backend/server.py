from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, date, time
from typing import Optional, List
import uuid
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import logging
from pathlib import Path

# Import du système d'authentification
from auth import (
    UserRegistration, UserLogin, Token, get_password_hash, verify_password, 
    create_access_token, validate_cameroon_phone, get_current_user, TokenData
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class UserType(str, Enum):
    PATIENT = "patient"
    DOCTOR = "medecin"

class SpecialtyType(str, Enum):
    GENERALISTE = "Généraliste"
    CARDIOLOGIE = "Cardiologie"
    DERMATOLOGIE = "Dermatologie"
    PEDIATRIE = "Pédiatrie"
    GYNECOLOGIE = "Gynécologie"
    NEUROLOGIE = "Neurologie"
    ORTHOPÉDIE = "Orthopédie"
    OPHTALMOLOGIE = "Ophtalmologie"

class AppointmentStatus(str, Enum):
    PENDING = "en_attente"
    CONFIRMED = "confirme"
    CANCELLED = "annule"
    COMPLETED = "termine"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    telephone: str
    type: UserType
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    nom: str
    telephone: str
    type: UserType

class Doctor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    telephone: str
    specialite: SpecialtyType
    experience: str  # ex: "5 ans"
    tarif: int  # en FCFA
    disponible: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorCreate(BaseModel):
    nom: str
    telephone: str
    specialite: SpecialtyType
    experience: str
    tarif: int

class TimeSlot(BaseModel):
    heure: str  # Format: "09:00", "14:30", etc.
    disponible: bool = True

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    doctor_id: str
    date: str  # Format: "2024-01-15"
    heure: str  # Format: "09:00"
    status: AppointmentStatus = AppointmentStatus.PENDING
    tarif: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    date: str
    heure: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "API de Réservation Médicale - Cameroun"}

# User routes
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return User(**user)

# Doctor routes
@api_router.post("/doctors", response_model=Doctor)
async def create_doctor(doctor: DoctorCreate):
    doctor_dict = doctor.dict()
    doctor_obj = Doctor(**doctor_dict)
    await db.doctors.insert_one(doctor_obj.dict())
    return doctor_obj

@api_router.get("/doctors/{doctor_id}")
async def get_doctor_by_id(doctor_id: str):
    """Récupérer un médecin par son ID"""
    try:
        doctor = await db.doctors.find_one({"id": doctor_id}, {"_id": 0})
        if not doctor:
            raise HTTPException(status_code=404, detail="Médecin non trouvé")
        return doctor
    except Exception as e:
        print(f"Erreur récupération médecin {doctor_id}: {e}")
        raise HTTPException(status_code=500, detail="Erreur serveur")

@api_router.get("/doctors", response_model=List[Doctor])
async def get_doctors(specialite: Optional[SpecialtyType] = None):
    query = {"disponible": True}
    if specialite:
        query["specialite"] = specialite
    doctors = await db.doctors.find(query).to_list(100)
    return [Doctor(**doctor) for doctor in doctors]


# Specialties route
@api_router.get("/specialties")
async def get_specialties():
    return [{"value": spec.value, "label": spec.value} for spec in SpecialtyType]

# Available time slots
@api_router.get("/doctors/{doctor_id}/available-slots")
async def get_available_slots(doctor_id: str, date: str):
    # Vérifier si le médecin existe
    doctor = await db.doctors.find_one({"id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    
    # Créneaux standards (9h-17h, pause 12h-14h)
    all_slots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
    ]
    
    # Trouver les rendez-vous déjà pris
    taken_appointments = await db.appointments.find({
        "doctor_id": doctor_id,
        "date": date,
        "status": {"$ne": AppointmentStatus.CANCELLED}
    }).to_list(100)
    
    taken_times = []
    for appt in taken_appointments:
        # Handle both 'heure' and 'time' fields for backward compatibility
        time_value = appt.get("heure") or appt.get("time")
        if time_value:
            taken_times.append(time_value)
    
    # Retourner les créneaux disponibles
    available_slots = [
        {"heure": slot, "disponible": slot not in taken_times}
        for slot in all_slots
    ]
    
    return available_slots

# Appointment routes
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment: AppointmentCreate):
    # Vérifier si le créneau est disponible
    existing = await db.appointments.find_one({
        "doctor_id": appointment.doctor_id,
        "date": appointment.date,
        "heure": appointment.heure,
        "status": {"$ne": AppointmentStatus.CANCELLED}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Ce créneau n'est plus disponible")
    
    # Récupérer le tarif du médecin
    doctor = await db.doctors.find_one({"id": appointment.doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    
    appointment_dict = appointment.dict()
    appointment_dict["tarif"] = doctor["tarif"]
    appointment_obj = Appointment(**appointment_dict)
    
    await db.appointments.insert_one(appointment_obj.dict())
    return appointment_obj

@api_router.get("/appointments/{appointment_id}", response_model=Appointment)
async def get_appointment(appointment_id: str):
    appointment = await db.appointments.find_one({"id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    return Appointment(**appointment)

@api_router.get("/patients/{patient_id}/appointments", response_model=List[Appointment])
async def get_patient_appointments(patient_id: str):
    appointments = await db.appointments.find({"patient_id": patient_id}).to_list(100)
    return [Appointment(**appointment) for appointment in appointments]

# Route pour confirmer le paiement
@api_router.put("/appointments/{appointment_id}/confirm")
async def confirm_appointment(appointment_id: str):
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": AppointmentStatus.CONFIRMED}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    
    return {"message": "Rendez-vous confirmé avec succès"}

# Doctor Dashboard Routes
@api_router.get("/doctors/{doctor_id}/dashboard")
async def get_doctor_dashboard(doctor_id: str):
    # Vérifier si le médecin existe
    doctor = await db.doctors.find_one({"id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    
    # Statistiques des rendez-vous
    today = datetime.now().strftime('%Y-%m-%d')
    
    total_appointments = await db.appointments.count_documents({"doctor_id": doctor_id})
    today_appointments = await db.appointments.count_documents({
        "doctor_id": doctor_id,
        "date": today,
        "status": {"$ne": AppointmentStatus.CANCELLED}
    })
    confirmed_appointments = await db.appointments.count_documents({
        "doctor_id": doctor_id,
        "status": AppointmentStatus.CONFIRMED
    })
    pending_appointments = await db.appointments.count_documents({
        "doctor_id": doctor_id,
        "status": AppointmentStatus.PENDING
    })
    
    # Revenus du mois
    current_month = datetime.now().strftime('%Y-%m')
    monthly_appointments = await db.appointments.find({
        "doctor_id": doctor_id,
        "status": AppointmentStatus.CONFIRMED,
        "date": {"$regex": f"^{current_month}"}
    }).to_list(1000)
    
    monthly_revenue = sum(appt.get("tarif", 0) for appt in monthly_appointments)
    
    return {
        "doctor": Doctor(**doctor),
        "stats": {
            "total_appointments": total_appointments,
            "today_appointments": today_appointments,
            "confirmed_appointments": confirmed_appointments,
            "pending_appointments": pending_appointments,
            "monthly_revenue": monthly_revenue,
            "monthly_appointments": len(monthly_appointments)
        }
    }

@api_router.get("/doctors/{doctor_id}/appointments", response_model=List[dict])
async def get_doctor_appointments(doctor_id: str, status: Optional[str] = None, date: Optional[str] = None):
    query = {"doctor_id": doctor_id}
    if status:
        query["status"] = status
    if date:
        query["date"] = date
    
    appointments = await db.appointments.find(query).sort("date", 1).to_list(1000)
    
    # Enrichir avec les données patient
    enriched_appointments = []
    for appt in appointments:
        patient = await db.users.find_one({"id": appt["patient_id"]})
        appt_dict = Appointment(**appt).dict()
        appt_dict["patient"] = User(**patient).dict() if patient else None
        enriched_appointments.append(appt_dict)
    
    return enriched_appointments

@api_router.put("/doctors/{doctor_id}/appointments/{appointment_id}/status")
async def update_appointment_status(doctor_id: str, appointment_id: str, request: dict):
    # Récupérer le statut depuis le body de la requête
    status = request.get('status')
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Vérifier que le rendez-vous appartient au médecin
    appointment = await db.appointments.find_one({
        "id": appointment_id,
        "doctor_id": doctor_id
    })
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Rendez-vous non trouvé")
    
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": status}}
    )
    
    return {"message": f"Statut mis à jour: {status}"}

@api_router.put("/doctors/{doctor_id}/profile")
async def update_doctor_profile(doctor_id: str, updates: dict):
    allowed_fields = ["nom", "telephone", "experience", "tarif", "disponible"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée valide à mettre à jour")
    
    result = await db.doctors.update_one(
        {"id": doctor_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    
    # Retourner le profil mis à jour
    updated_doctor = await db.doctors.find_one({"id": doctor_id})
    return Doctor(**updated_doctor)

# Availability Management
class AvailabilitySlot(BaseModel):
    date: str
    heure: str
    disponible: bool

@api_router.put("/doctors/{doctor_id}/availability")
async def update_doctor_availability(doctor_id: str, slots: List[AvailabilitySlot]):
    doctor = await db.doctors.find_one({"id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    
    # Pour chaque créneau, créer ou supprimer un rendez-vous "bloqué"
    for slot in slots:
        if not slot.disponible:
            # Créer un rendez-vous de blocage
            existing = await db.appointments.find_one({
                "doctor_id": doctor_id,
                "date": slot.date,
                "heure": slot.heure,
                "status": "blocked"
            })
            
            if not existing:
                block_appointment = {
                    "id": str(uuid.uuid4()),
                    "patient_id": "blocked",
                    "doctor_id": doctor_id,
                    "date": slot.date,
                    "heure": slot.heure,
                    "status": "blocked",
                    "tarif": 0,
                    "created_at": datetime.utcnow()
                }
                await db.appointments.insert_one(block_appointment)
        else:
            # Supprimer le blocage s'il existe
            await db.appointments.delete_many({
                "doctor_id": doctor_id,
                "date": slot.date,
                "heure": slot.heure,
                "status": "blocked"
            })
    
    return {"message": "Disponibilités mises à jour avec succès"}

@api_router.get("/doctors/{doctor_id}/patients")
async def get_doctor_patients(doctor_id: str):
    # Récupérer tous les patients qui ont eu des rendez-vous avec ce médecin
    appointments = await db.appointments.find({
        "doctor_id": doctor_id,
        "status": {"$in": [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED]}
    }).to_list(1000)
    
    patient_ids = list(set(appt["patient_id"] for appt in appointments))
    patients = []
    
    for patient_id in patient_ids:
        patient = await db.users.find_one({"id": patient_id})
        if patient:
            # Compter les rendez-vous
            appt_count = len([appt for appt in appointments if appt["patient_id"] == patient_id])
            patient_data = User(**patient).dict()
            patient_data["appointment_count"] = appt_count
            patient_data["last_appointment"] = max(
                (appt["date"] for appt in appointments if appt["patient_id"] == patient_id),
                default=None
            )
            patients.append(patient_data)
    
    return sorted(patients, key=lambda p: p.get("last_appointment", ""), reverse=True)

# Global Search Route
@api_router.get("/search")
async def global_search(q: str):
    if len(q) < 2:
        return {"results": []}
    
    query_lower = q.lower()
    results = []
    
    try:
        # Recherche des médecins
        doctors = await db.doctors.find({"disponible": True}).to_list(100)
        for doctor in doctors:
            if (query_lower in doctor["nom"].lower() or 
                query_lower in doctor["specialite"].lower()):
                # Convert to Doctor model to handle serialization
                doctor_obj = Doctor(**doctor)
                results.append({
                    "id": doctor["id"],
                    "type": "doctor",
                    "title": doctor["nom"],
                    "subtitle": doctor["specialite"],
                    "metadata": f"{doctor['tarif']:,} FCFA • {doctor['experience']}",
                    "data": doctor_obj.dict()
                })
        
        # Recherche des spécialités
        specialties_list = [spec.value for spec in SpecialtyType]
        for specialty in specialties_list:
            if query_lower in specialty.lower():
                # Compter les médecins de cette spécialité
                count = await db.doctors.count_documents({
                    "specialite": specialty,
                    "disponible": True
                })
                results.append({
                    "id": specialty.lower().replace(" ", "_"),
                    "type": "specialty",
                    "title": specialty,
                    "subtitle": "Spécialité médicale",
                    "metadata": f"{count} médecin{'s' if count > 1 else ''} disponible{'s' if count > 1 else ''}",
                    "data": {"value": specialty, "label": specialty}
                })
        
        # Recherche des patients (pour les médecins connectés)
        # Cette partie nécessiterait l'ID du médecin connecté
        patients = await db.users.find({"type": "patient"}).to_list(100)
        for patient in patients:
            if query_lower in patient["nom"].lower():
                # Trouver la dernière consultation
                last_appointment = await db.appointments.find_one(
                    {"patient_id": patient["id"]},
                    sort=[("created_at", -1)]
                )
                last_date = last_appointment["date"] if last_appointment else None
                
                # Convert to User model to handle serialization
                patient_obj = User(**patient)
                results.append({
                    "id": patient["id"],
                    "type": "patient",
                    "title": patient["nom"],
                    "subtitle": "Patient",
                    "metadata": f"Dernière consultation: {last_date or 'Aucune'}",
                    "data": patient_obj.dict()
                })
        
        return {"results": results[:20]}  # Limiter à 20 résultats
        
    except Exception as e:
        print(f"Erreur de recherche: {e}")
        return {"results": []}

# Routes d'authentification
@api_router.post("/auth/register", response_model=Token)
async def register_user(user_data: UserRegistration):
    """Inscription d'un nouvel utilisateur (patient ou médecin)"""
    
    # Validation du numéro camerounais
    if not validate_cameroon_phone(user_data.telephone):
        raise HTTPException(
            status_code=400,
            detail="Numéro de téléphone camerounais invalide. Format attendu: +237XXXXXXXXX"
        )
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = await db.users.find_one({"telephone": user_data.telephone}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Un utilisateur avec ce numéro de téléphone existe déjà"
        )
    
    # Hasher le mot de passe
    hashed_password = get_password_hash(user_data.mot_de_passe)
    
    # Créer le nouvel utilisateur
    user_dict = {
        "id": str(uuid.uuid4()),
        "nom": user_data.nom,
        "telephone": user_data.telephone,
        "mot_de_passe": hashed_password,
        "type": user_data.type_utilisateur,
        "created_at": datetime.utcnow().isoformat(),
        "last_login": None
    }
    
    # Ajouter les champs spécifiques selon le type
    if user_data.type_utilisateur == "patient":
        user_dict.update({
            "age": user_data.age,
            "ville": user_data.ville
        })
    elif user_data.type_utilisateur == "medecin":
        user_dict.update({
            "specialite": user_data.specialite,
            "experience": user_data.experience,
            "tarif": user_data.tarif,
            "diplomes": user_data.diplomes,
            "disponible": True,
            "rating": 4.8  # Rating par défaut
        })
        
        # Ajouter aussi dans la collection doctors pour compatibilité
        doctor_dict = {
            "id": user_dict["id"],
            "nom": user_data.nom,
            "specialite": user_data.specialite,
            "experience": user_data.experience,
            "tarif": user_data.tarif,
            "diplomes": user_data.diplomes,
            "disponible": True,
            "rating": 4.8,
            "telephone": user_data.telephone,
            "created_at": datetime.utcnow().isoformat()
        }
        result = await db.doctors.insert_one(doctor_dict)
        print(f"Doctor inserted with _id: {result.inserted_id}")
    
    # Insérer l'utilisateur
    result = await db.users.insert_one(user_dict)
    print(f"User inserted with _id: {result.inserted_id}")
    
    # Créer le token JWT
    access_token = create_access_token(
        data={"sub": user_data.telephone, "user_type": user_data.type_utilisateur}
    )
    
    # Préparer les données utilisateur à retourner (sans mot de passe et sans _id)
    user_data_return = {k: v for k, v in user_dict.items() if k not in ["mot_de_passe", "_id"]}
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_data=user_data_return
    )

@api_router.post("/auth/login", response_model=Token)
async def login_user(login_data: UserLogin):
    """Connexion d'un utilisateur"""
    
    # Validation du numéro camerounais
    if not validate_cameroon_phone(login_data.telephone):
        raise HTTPException(
            status_code=400,
            detail="Numéro de téléphone camerounais invalide"
        )
    
    # Trouver l'utilisateur
    user = await db.users.find_one({"telephone": login_data.telephone}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Numéro de téléphone ou mot de passe incorrect"
        )
    
    # Vérifier le mot de passe
    if not verify_password(login_data.mot_de_passe, user["mot_de_passe"]):
        raise HTTPException(
            status_code=401,
            detail="Numéro de téléphone ou mot de passe incorrect"
        )
    
    # Mettre à jour le dernier login
    await db.users.update_one(
        {"telephone": login_data.telephone},
        {"$set": {"last_login": datetime.utcnow().isoformat()}}
    )
    
    # Créer le token JWT
    access_token = create_access_token(
        data={"sub": login_data.telephone, "user_type": user["type"]}
    )
    
    # Préparer les données utilisateur à retourner (sans mot de passe)
    user_data_return = {k: v for k, v in user.items() if k != "mot_de_passe"}
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_data=user_data_return
    )

@api_router.get("/auth/me")
async def get_current_user_profile(current_user: TokenData = Depends(get_current_user)):
    """Obtenir le profil de l'utilisateur actuel"""
    
    user = await db.users.find_one({"telephone": current_user.telephone}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Retourner les données sans le mot de passe
    user_data = {k: v for k, v in user.items() if k != "mot_de_passe"}
    return user_data

@api_router.put("/auth/profile")
async def update_user_profile(
    profile_data: dict,
    current_user: TokenData = Depends(get_current_user)
):
    """Mettre à jour le profil utilisateur"""
    
    # Enlever les champs non modifiables
    forbidden_fields = ["id", "telephone", "type", "created_at", "mot_de_passe"]
    update_data = {k: v for k, v in profile_data.items() if k not in forbidden_fields}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucune donnée à mettre à jour")
    
    # Mettre à jour l'utilisateur
    result = await db.users.update_one(
        {"telephone": current_user.telephone},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Si c'est un médecin, mettre à jour aussi la collection doctors
    if current_user.user_type == "medecin":
        await db.doctors.update_one(
            {"telephone": current_user.telephone},
            {"$set": update_data}
        )
    
    return {"message": "Profil mis à jour avec succès"}

@api_router.post("/appointments")
async def create_appointment(appointment_data: dict):
    """Créer un nouveau rendez-vous"""
    try:
        # Générer un ID unique pour le rendez-vous
        appointment_id = str(uuid.uuid4())
        
        # Créer l'objet rendez-vous
        appointment = {
            "id": appointment_id,
            "doctor_id": appointment_data.get("doctor_id"),
            "patient_name": appointment_data.get("patient_name"),
            "patient_age": appointment_data.get("patient_age"),
            "date": appointment_data.get("date"),
            "time": appointment_data.get("time"),
            "consultation_type": appointment_data.get("consultation_type"),
            "price": appointment_data.get("price"),
            "user_id": appointment_data.get("user_id"),
            "status": "confirmed",
            "created_at": datetime.utcnow().isoformat(),
            "payment_status": "pending"
        }
        
        # Vérifier que le créneau n'est pas déjà pris
        existing = await db.appointments.find_one({
            "doctor_id": appointment_data.get("doctor_id"),
            "date": appointment_data.get("date"),
            "time": appointment_data.get("time"),
            "status": {"$ne": "cancelled"}
        })
        
        if existing:
            raise HTTPException(status_code=409, detail="Ce créneau est déjà réservé")
        
        # Insérer le rendez-vous
        await db.appointments.insert_one(appointment)
        
        return {
            "id": appointment_id, 
            "status": "confirmed", 
            "message": "Rendez-vous créé avec succès",
            "appointment": appointment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur création rendez-vous: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la création du rendez-vous")

from fastapi import Request

@api_router.post("/appointments-simple")
async def create_appointment_simple(request: Request):
    """Créer un nouveau rendez-vous - version simplifiée"""
    try:
        appointment_data = await request.json()
        print(f"Données reçues: {appointment_data}")
        
        # Vérifier que le créneau n'est pas déjà pris
        existing = await db.appointments.find_one({
            "doctor_id": appointment_data.get("doctor_id"),
            "date": appointment_data.get("date"),
            "$or": [
                {"heure": appointment_data.get("time")},
                {"time": appointment_data.get("time")}
            ],
            "status": {"$ne": "cancelled"}
        })
        
        if existing:
            raise HTTPException(status_code=409, detail="Ce créneau est déjà réservé")
        
        # Générer un ID unique pour le rendez-vous
        appointment_id = str(uuid.uuid4())
        
        # Normaliser les données - utiliser 'heure' pour la cohérence
        normalized_data = appointment_data.copy()
        if "time" in normalized_data:
            normalized_data["heure"] = normalized_data.pop("time")
        
        # Créer l'objet rendez-vous
        appointment = {
            "id": appointment_id,
            **normalized_data,
            "status": "confirmed",
            "created_at": datetime.utcnow().isoformat(),
            "payment_status": "pending"
        }
        
        # Insérer le rendez-vous
        await db.appointments.insert_one(appointment)
        
        return {"id": appointment_id, "status": "confirmed"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur création rendez-vous: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===============================================
# ROUTES DE MIGRATION ATLAS (TEMPORAIRES)
# ===============================================

@api_router.get("/migration/test-atlas")
async def test_atlas_connection():
    """Test de connexion à MongoDB Atlas depuis le backend"""
    try:
        # URI Atlas fournie par l'utilisateur
        atlas_uri = "mongodb+srv://mariejulie552_db_user:vBkeJK66ILoNba6k@dokta-cluster.j60yq2i.mongodb.net/"
        
        # Test de connexion avec timeouts appropriés
        atlas_client = AsyncIOMotorClient(
            atlas_uri,
            connectTimeoutMS=10000,
            serverSelectionTimeoutMS=10000,
            socketTimeoutMS=20000
        )
        
        # Test ping
        await atlas_client.admin.command('ping')
        
        # Test base de données
        atlas_db = atlas_client['dokta_production']
        collections = await atlas_db.list_collection_names()
        
        atlas_client.close()
        
        return {
            "status": "success",
            "message": "✅ Connexion Atlas réussie depuis le backend!",
            "database": "dokta_production",
            "existing_collections": collections
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ Connexion Atlas échouée: {str(e)}",
            "error_type": type(e).__name__
        }

@api_router.post("/migration/migrate-to-atlas")
async def migrate_to_atlas():
    """Migration complète des données vers Atlas"""
    try:
        # URI Atlas
        atlas_uri = "mongodb+srv://mariejulie552_db_user:vBkeJK66ILoNba6k@dokta-cluster.j60yq2i.mongodb.net/"
        
        # Connexion Atlas
        atlas_client = AsyncIOMotorClient(
            atlas_uri,
            connectTimeoutMS=10000,
            serverSelectionTimeoutMS=10000,
            socketTimeoutMS=20000
        )
        atlas_db = atlas_client['dokta_production']
        
        # Collections à migrer
        collections = ['doctors', 'appointments', 'users']
        migration_results = {}
        
        for collection_name in collections:
            # Lire données locales
            local_collection = db[collection_name]
            local_data = await local_collection.find({}, {"_id": 0}).to_list(1000)
            
            if not local_data:
                migration_results[collection_name] = {
                    "status": "empty",
                    "local_count": 0,
                    "migrated_count": 0
                }
                continue
            
            # Collection Atlas
            atlas_collection = atlas_db[collection_name]
            
            # Vider la collection de destination
            await atlas_collection.delete_many({})
            
            # Insérer données
            result = await atlas_collection.insert_many(local_data)
            
            # Vérification
            atlas_count = await atlas_collection.count_documents({})
            
            migration_results[collection_name] = {
                "status": "success" if len(local_data) == atlas_count else "partial",
                "local_count": len(local_data),
                "migrated_count": atlas_count,
                "inserted_ids": len(result.inserted_ids)
            }
        
        atlas_client.close()
        
        return {
            "status": "success",
            "message": "🎉 Migration terminée!",
            "results": migration_results,
            "atlas_uri": atlas_uri.replace(atlas_uri.split('@')[0].split('://')[1], "***:***"),
            "new_database": "dokta_production"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ Erreur migration: {str(e)}",
            "error_type": type(e).__name__
        }

@api_router.get("/migration/status")
async def migration_status():
    """Statut des données locales et Atlas"""
    try:
        # Données locales
        local_stats = {}
        collections = ['doctors', 'appointments', 'users']
        
        for collection_name in collections:
            count = await db[collection_name].count_documents({})
            local_stats[collection_name] = count
        
        # Test Atlas si possible
        atlas_stats = {}
        try:
            atlas_uri = "mongodb+srv://mariejulie552_db_user:vBkeJK66ILoNba6k@dokta-cluster.j60yq2i.mongodb.net/"
            atlas_client = AsyncIOMotorClient(atlas_uri, serverSelectionTimeoutMS=5000)
            atlas_db = atlas_client['dokta_production']
            
            for collection_name in collections:
                count = await atlas_db[collection_name].count_documents({})
                atlas_stats[collection_name] = count
                
            atlas_client.close()
            atlas_connection = True
            
        except:
            atlas_connection = False
        
        return {
            "local_database": local_stats,
            "atlas_database": atlas_stats,
            "atlas_connection": atlas_connection,
            "total_local_documents": sum(local_stats.values()),
            "total_atlas_documents": sum(atlas_stats.values()) if atlas_connection else 0
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"❌ Erreur statut: {str(e)}"
        }

# ===============================================
# MOBILE MONEY PAYMENT ROUTES (MTN & ORANGE)
# ===============================================

from pydantic import BaseModel, Field, validator
from typing import Literal
from datetime import datetime, timedelta
import uuid

class MobileMoneyPayment(BaseModel):
    patient_name: str = Field(..., min_length=2, max_length=100)
    patient_phone: str = Field(..., pattern=r"^6[789]\d{7}$")  # Cameroun mobile format
    doctor_id: str
    consultation_type: Literal["cabinet", "domicile", "teleconsultation"]
    appointment_datetime: str
    payment_provider: Literal["mtn_momo", "orange_money"]
    notes: str = Field("", max_length=500)

@api_router.post("/mobile-money/initiate")
async def initiate_mobile_money_payment(payment_request: MobileMoneyPayment):
    """Initier un paiement Mobile Money (MTN ou Orange)"""
    try:
        # Récupérer les détails du médecin pour le tarif
        doctor = await db.doctors.find_one({"id": payment_request.doctor_id})
        if not doctor:
            raise HTTPException(status_code=404, detail="Médecin non trouvé")
        
        # Calculer le montant selon le type de consultation
        tarifs = {
            "cabinet": doctor["tarif"],
            "domicile": doctor.get("tarif_domicile", doctor["tarif"] + 10000),
            "teleconsultation": doctor.get("tarif_teleconsultation", doctor["tarif"] - 5000)
        }
        
        amount = tarifs[payment_request.consultation_type]
        reference_id = str(uuid.uuid4())
        
        # Créer l'enregistrement de paiement
        payment_record = {
            "id": reference_id,
            "patient_name": payment_request.patient_name,
            "patient_phone": payment_request.patient_phone,
            "doctor_id": payment_request.doctor_id,
            "consultation_type": payment_request.consultation_type,
            "appointment_datetime": payment_request.appointment_datetime,
            "amount": amount,
            "currency": "XAF",
            "payment_provider": payment_request.payment_provider,
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(minutes=10)).isoformat()
        }
        
        await db.mobile_payments.insert_one(payment_record)
        
        if payment_request.payment_provider == "mtn_momo":
            # Traitement MTN Mobile Money
            return {
                "payment_id": reference_id,
                "status": "PENDING",
                "provider": "MTN Mobile Money",
                "amount": amount,
                "currency": "XAF",
                "message": f"Composez *126# et suivez les instructions pour payer {amount} FCFA",
                "instructions": [
                    f"1. Composez *126# sur votre téléphone",
                    f"2. Sélectionnez 'Payer facture'", 
                    f"3. Entrez le code marchand: DOKTA",
                    f"4. Entrez le montant: {amount}",
                    f"5. Confirmez avec votre code PIN"
                ]
            }
        
        elif payment_request.payment_provider == "orange_money":
            # Traitement Orange Money
            return {
                "payment_id": reference_id,
                "status": "PENDING", 
                "provider": "Orange Money",
                "amount": amount,
                "currency": "XAF",
                "message": f"Composez #144# et suivez les instructions pour payer {amount} FCFA",
                "instructions": [
                    f"1. Composez #144# sur votre téléphone",
                    f"2. Sélectionnez 'Paiement marchand'",
                    f"3. Entrez le code DOKTA",
                    f"4. Entrez le montant: {amount}",
                    f"5. Confirmez avec votre code Orange Money"
                ]
            }
        
    except Exception as e:
        print(f"Erreur initiation paiement: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'initiation du paiement: {str(e)}")

@api_router.get("/mobile-money/status/{payment_id}")
async def check_mobile_money_status(payment_id: str):
    """Vérifier le statut d'un paiement Mobile Money"""
    try:
        payment = await db.mobile_payments.find_one({"id": payment_id})
        
        if not payment:
            raise HTTPException(status_code=404, detail="Paiement non trouvé")
        
        # Simuler la vérification du statut (en production, on appellerait les APIs MTN/Orange)
        # Pour le développement, on peut simuler des changements de statut
        
        current_time = datetime.utcnow()
        created_time = datetime.fromisoformat(payment["created_at"])
        elapsed_minutes = (current_time - created_time).total_seconds() / 60
        
        # Simuler un changement de statut après 2 minutes pour les tests
        if elapsed_minutes > 2 and payment["status"] == "PENDING":
            # Simuler succès pour les tests (70% de succès)
            import random
            success = random.random() > 0.3
            
            new_status = "SUCCESSFUL" if success else "FAILED"
            
            await db.mobile_payments.update_one(
                {"id": payment_id},
                {"$set": {"status": new_status, "completed_at": current_time.isoformat()}}
            )
            
            payment["status"] = new_status
        
        return {
            "payment_id": payment_id,
            "status": payment["status"],
            "amount": payment["amount"],
            "currency": payment["currency"],
            "provider": payment["payment_provider"],
            "created_at": payment["created_at"],
            "completed_at": payment.get("completed_at")
        }
        
    except Exception as e:
        print(f"Erreur vérification statut: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la vérification: {str(e)}")

@api_router.post("/mobile-money/confirm/{payment_id}")
async def confirm_mobile_money_payment(payment_id: str):
    """Confirmer manuellement un paiement (pour les tests)"""
    try:
        payment = await db.mobile_payments.find_one({"id": payment_id})
        
        if not payment:
            raise HTTPException(status_code=404, detail="Paiement non trouvé")
        
        if payment["status"] != "PENDING":
            return {"message": f"Paiement déjà {payment['status']}"}
        
        # Marquer comme réussi
        await db.mobile_payments.update_one(
            {"id": payment_id},
            {"$set": {"status": "SUCCESSFUL", "completed_at": datetime.utcnow().isoformat()}}
        )
        
        # Créer le rendez-vous confirmé
        appointment = {
            "id": str(uuid.uuid4()),
            "patient_name": payment["patient_name"],
            "patient_phone": payment["patient_phone"],
            "doctor_id": payment["doctor_id"],
            "consultation_type": payment["consultation_type"],
            "appointment_datetime": payment["appointment_datetime"],
            "amount": payment["amount"],
            "payment_id": payment_id,
            "status": "confirmed",
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db.appointments.insert_one(appointment)
        
        return {
            "message": "Paiement confirmé avec succès",
            "payment_status": "SUCCESSFUL",
            "appointment_id": appointment["id"]
        }
        
    except Exception as e:
        print(f"Erreur confirmation paiement: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la confirmation: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize demo data
@app.on_event("startup")
async def init_demo_data():
    # Vérifier si des données existent déjà
    doctors_count = await db.doctors.count_documents({})
    
    if doctors_count == 0:
        # Créer des médecins de démonstration
        demo_doctors = [
            {
                "id": str(uuid.uuid4()),
                "nom": "Dr. Marie Ngono",
                "telephone": "+237690123456",
                "specialite": "Généraliste",
                "experience": "8 ans",
                "tarif": 15000,
                "disponible": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "nom": "Dr. Jean Mbarga",
                "telephone": "+237691234567",
                "specialite": "Cardiologie",
                "experience": "12 ans",
                "tarif": 25000,
                "disponible": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "nom": "Dr. Grace Fouda",
                "telephone": "+237692345678",
                "specialite": "Pédiatrie",
                "experience": "6 ans",
                "tarif": 20000,
                "disponible": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "nom": "Dr. Paul Atangana",
                "telephone": "+237693456789",
                "specialite": "Dermatologie",
                "experience": "10 ans",
                "tarif": 18000,
                "disponible": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "nom": "Dr. Claudine Manga",
                "telephone": "+237694567890",
                "specialite": "Gynécologie",
                "experience": "9 ans",
                "tarif": 22000,
                "disponible": True,
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.doctors.insert_many(demo_doctors)
        logger.info("Données de démonstration créées avec succès")