# CareLink API Documentation

## Overview

The CareLink API is a RESTful service built with Node.js and Express, designed to support SMART on FHIR-enabled healthcare applications. It provides endpoints for patient management, vital signs monitoring, appointment scheduling, care plans, and secure messaging.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### SMART on FHIR Authentication

For healthcare provider authentication, the API supports SMART on FHIR OAuth2 flow:

1. **Launch URL**: `GET /auth/smart/launch?iss=<fhir-server>&launch=<launch-token>`
2. **Callback**: `GET /auth/smart/callback?code=<auth-code>&state=<state>`

## Endpoints

### Authentication

#### POST /auth/login
Authenticate with username and password.

**Request Body:**
```json
{
  "username": "demo",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "username": "demo",
      "name": "Demo User",
      "email": "demo@carelink.com",
      "role": "patient",
      "fhirPatientId": "example-patient-123"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "username": "demo",
      "name": "Demo User",
      "email": "demo@carelink.com",
      "role": "patient",
      "fhirPatientId": "example-patient-123"
    }
  }
}
```

### FHIR Integration

#### GET /fhir/patients/{patientId}
Get patient information from FHIR server.

**Headers:** `Authorization: Bearer <smart-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "resourceType": "Patient",
    "id": "example-patient-123",
    "name": [
      {
        "use": "official",
        "text": "John Doe",
        "family": "Doe",
        "given": ["John"]
      }
    ],
    "gender": "male",
    "birthDate": "1985-03-15"
  }
}
```

#### GET /fhir/patients/{patientId}/observations
Get patient vital signs from FHIR server.

**Query Parameters:**
- `category` (optional): Filter by observation category (e.g., "vital-signs")

**Response:**
```json
{
  "success": true,
  "data": {
    "observations": {
      "resourceType": "Bundle",
      "entry": [...]
    },
    "vitals": [
      {
        "id": "obs-1",
        "code": "8867-4",
        "display": "Heart rate",
        "value": 72,
        "unit": "beats/min",
        "date": "2024-01-15T10:30:00Z",
        "status": "final"
      }
    ]
  }
}
```

### Patients

#### GET /patients
Get all patients (admin/provider only).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "dateOfBirth": "1985-03-15",
      "gender": "male"
    }
  ]
}
```

#### GET /patients/{id}/vitals
Get patient vital signs.

**Query Parameters:**
- `period` (optional): Time period (e.g., "7d", "30d", "90d")

**Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "1",
    "period": "7d",
    "vitals": {
      "bloodPressure": [
        {
          "systolic": 120,
          "diastolic": 80,
          "date": "2024-01-15T10:30:00Z"
        }
      ],
      "heartRate": [
        {
          "value": 72,
          "date": "2024-01-15T10:30:00Z"
        }
      ]
    }
  }
}
```

### Appointments

#### GET /appointments
Get all appointments for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "patientId": "1",
      "patientName": "John Doe",
      "provider": "Dr. Sarah Johnson",
      "type": "Follow-up",
      "date": "2024-01-20T14:00:00Z",
      "duration": 30,
      "status": "Scheduled",
      "notes": "Routine check-up"
    }
  ]
}
```

#### POST /appointments
Create a new appointment.

**Request Body:**
```json
{
  "patientId": "1",
  "provider": "Dr. Sarah Johnson",
  "type": "Follow-up",
  "date": "2024-01-20T14:00:00Z",
  "duration": 30,
  "notes": "Routine check-up"
}
```

### Care Plans

#### GET /care-plans
Get all care plans for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "patientId": "1",
      "title": "Diabetes Management Plan",
      "description": "Comprehensive plan for managing Type 2 Diabetes",
      "status": "Active",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "goals": [
        "Maintain blood glucose levels between 80-130 mg/dL",
        "Achieve HbA1c < 7%"
      ],
      "activities": [
        {
          "type": "Medication",
          "description": "Metformin 500mg twice daily",
          "frequency": "Daily",
          "status": "Active"
        }
      ]
    }
  ]
}
```

### Chat

#### GET /chat/rooms
Get chat rooms for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "room-1",
      "name": "Dr. Sarah Johnson",
      "type": "provider",
      "lastMessage": {
        "content": "How are you feeling today?",
        "timestamp": "2024-01-15T10:35:00Z",
        "sender": "Dr. Sarah Johnson"
      },
      "unreadCount": 0
    }
  ]
}
```

#### GET /chat/messages?roomId={roomId}
Get messages for a specific chat room.

**Query Parameters:**
- `roomId` (required): Chat room ID
- `limit` (optional): Number of messages to retrieve (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "roomId": "room-1",
      "sender": {
        "id": "1",
        "name": "Dr. Sarah Johnson",
        "role": "provider"
      },
      "content": "Hello John, how are you feeling today?",
      "timestamp": "2024-01-15T10:30:00Z",
      "type": "text"
    }
  ]
}
```

#### POST /chat/messages
Send a new message.

**Request Body:**
```json
{
  "roomId": "room-1",
  "content": "I'm feeling much better, thank you!",
  "type": "text"
}
```

### Health Check

#### GET /health
Get system health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "uptime": 3600,
    "environment": "development",
    "version": "1.0.0",
    "services": {
      "database": "connected",
      "fhir": "connected",
      "redis": "connected"
    }
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Limit**: 100 requests per IP address
- **Headers**: Rate limit information is included in response headers

## WebSocket Support

For real-time features like chat, the API supports WebSocket connections:

- **Endpoint**: `ws://localhost:3000` (development)
- **Events**: `join-room`, `leave-room`, `send-message`, `typing`

## FHIR Integration

The API integrates with HAPI FHIR server for healthcare data:

- **Base URL**: `https://hapi.fhir.org/baseR4`
- **Resources**: Patient, Observation, CarePlan, Appointment, MedicationRequest, Condition
- **Authentication**: SMART on FHIR OAuth2

## Security

- **HTTPS**: All production endpoints use HTTPS
- **CORS**: Configured for specific origins
- **Helmet**: Security headers enabled
- **Input Validation**: All inputs are validated and sanitized
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers 