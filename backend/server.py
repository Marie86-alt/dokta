from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, time
from enum import Enum


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

@api_router.get("/doctors", response_model=List[Doctor])
async def get_doctors(specialite: Optional[SpecialtyType] = None):
    query = {"disponible": True}
    if specialite:
        query["specialite"] = specialite
    doctors = await db.doctors.find(query).to_list(100)
    return [Doctor(**doctor) for doctor in doctors]

@api_router.get("/doctors/{doctor_id}", response_model=Doctor)
async def get_doctor(doctor_id: str):
    doctor = await db.doctors.find_one({"id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    return Doctor(**doctor)

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
    
    taken_times = [appt["heure"] for appt in taken_appointments]
    
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