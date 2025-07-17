# CareLink - SMART on FHIR-Enabled Patient Dashboard

A comprehensive remote care coordination platform where patients and healthcare providers can view medical records, monitor vital signs, chat securely, schedule appointments, and view care plan summaries.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Infrastructure │
│   (Vue.js)      │◄──►│  (Node.js +     │◄──►│   (Azure +      │
│                 │    │   Express)      │    │   Terraform)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FHIR Client   │    │   SMART on FHIR │    │   Azure App     │
│   (HAPI FHIR)   │    │   OAuth2 Auth   │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Features

- **FHIR Integration**: Real-time medical record access via HAPI FHIR Server
- **SMART on FHIR Authentication**: OAuth2-based healthcare provider authentication
- **Patient Dashboard**: View vitals, appointments, care plans, and medical records
- **Secure Chat**: Real-time communication between patients and providers
- **Appointment Scheduling**: Integrated calendar and booking system
- **Role-Based Access Control**: Different views for patients, providers, and admins
- **Real-time Monitoring**: Live vital signs and health metrics
- **Care Plan Management**: View and update treatment plans

## 🛠️ Tech Stack

### Frontend
- **Vue.js 3** with Composition API
- **Vuex** for state management
- **Vue Router** for navigation
- **Vite** for build tooling
- **Axios** for API communication
- **Socket.io-client** for real-time features

### Backend
- **Node.js** with Express.js
- **SMART on FHIR** authentication
- **HAPI FHIR** client integration
- **Socket.io** for real-time chat
- **JWT** for session management
- **MongoDB** for chat and unstructured data
- **Azure SQL** for structured data

### Infrastructure
- **Azure App Service** for hosting
- **Azure SQL Database** for relational data
- **Azure Cosmos DB** for NoSQL data
- **Azure Service Bus** for messaging
- **Azure Application Gateway** for load balancing
- **Terraform** for infrastructure as code

### DevOps
- **GitHub Actions** for CI/CD
- **Docker** for containerization
- **Azure Monitor** for observability
- **OpenAPI/Swagger** for API documentation

## 📁 Project Structure

```
carelink/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/    # API route handlers
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utilities
│   ├── tests/              # Unit and integration tests
│   └── package.json
├── frontend/               # Vue.js SPA
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page components
│   │   ├── store/          # Vuex store
│   │   ├── router/         # Vue Router config
│   │   ├── services/       # API services
│   │   └── utils/          # Utilities
│   ├── public/             # Static assets
│   └── package.json
├── infra/                  # Terraform configurations
│   ├── modules/
│   │   ├── app-service/    # Azure App Service
│   │   ├── database/       # Azure SQL & Cosmos DB
│   │   ├── networking/     # VNet, Subnets, etc.
│   │   └── monitoring/     # Azure Monitor
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── prod/
│   └── main.tf
├── docs/                   # Documentation
│   ├── api/                # OpenAPI specs
│   ├── architecture/       # System diagrams
│   └── postman/            # API testing collections
├── .github/
│   └── workflows/          # CI/CD pipelines
└── docker-compose.yml      # Local development
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop
- Azure CLI
- Terraform

### Local Development

1. **Clone and setup**
```bash
git clone <repository-url>
cd carelink
```

2. **Start backend**
```bash
cd backend
npm install
npm run dev
```

3. **Start frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Start infrastructure (optional)**
```bash
cd infra
terraform init
terraform plan
terraform apply
```

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/carelink
AZURE_SQL_CONNECTION_STRING=your_connection_string
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
SMART_CLIENT_ID=your_smart_client_id
SMART_CLIENT_SECRET=your_smart_client_secret
JWT_SECRET=your_jwt_secret
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
VITE_SMART_CLIENT_ID=your_smart_client_id
```

## 📋 Agile Development

### Epics
- [ ] **FHIR Integration Epic**
  - SMART on FHIR authentication
  - Patient data retrieval
  - Vital signs monitoring
- [ ] **Patient Dashboard Epic**
  - Medical records view
  - Appointment scheduling
  - Care plan management
- [ ] **Communication Epic**
  - Secure chat system
  - Real-time notifications
  - File sharing
- [ ] **Infrastructure Epic**
  - Azure deployment
  - CI/CD pipelines
  - Monitoring setup

### User Stories
- As a patient, I want to view my medical records so I can stay informed about my health
- As a provider, I want to access patient data securely so I can provide better care
- As a patient, I want to schedule appointments so I can manage my healthcare
- As a provider, I want to chat with patients so I can provide remote care
- As an admin, I want to manage user roles so I can control access appropriately

## 🔧 API Documentation

### Core Endpoints
- `GET /api/patients` - Get patient list
- `GET /api/patients/:id` - Get patient details
- `GET /api/patients/:id/observations` - Get patient vitals
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `GET /api/care-plans` - Get care plans
- `POST /api/chat/messages` - Send chat message
- `GET /api/chat/messages` - Get chat history

### Authentication
All API calls require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 🚀 Deployment

### Azure Deployment
1. **Setup Azure Resources**
```bash
cd infra
terraform init
terraform plan
terraform apply
```

2. **Deploy Backend**
```bash
cd backend
npm run build
docker build -t carelink-backend .
docker push <azure-registry>/carelink-backend
```

3. **Deploy Frontend**
```bash
cd frontend
npm run build
docker build -t carelink-frontend .
docker push <azure-registry>/carelink-frontend
```

### CI/CD Pipeline
The project includes GitHub Actions workflows for:
- Code linting and testing
- Docker image building
- Terraform infrastructure deployment
- Azure App Service deployment

## 📊 Monitoring & Observability

- **Azure Monitor** for application insights
- **Health checks** at `/api/health`
- **Structured logging** with Winston
- **Performance metrics** tracking
- **Error tracking** and alerting

## 🔒 Security

- **OAuth2/SMART on FHIR** authentication
- **JWT** token-based sessions
- **Role-based access control** (RBAC)
- **HTTPS** encryption
- **Input validation** and sanitization
- **SQL injection** prevention
- **XSS protection**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**CareLink** - Connecting patients and providers through secure, FHIR-enabled healthcare technology.
