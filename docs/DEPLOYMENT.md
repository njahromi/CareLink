# CareLink Deployment Guide

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Azure Deployment](#azure-deployment)
3. [Production Configuration](#production-configuration)
4. [Monitoring and Observability](#monitoring-and-observability)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- Node.js 18+
- Docker Desktop
- Azure CLI (for Azure deployment)
- Terraform (for infrastructure)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd carelink
```

2. **Set up environment variables**
```bash
# Backend
cp backend/env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/env.example frontend/.env
# Edit frontend/.env with your configuration
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
- Grafana: http://localhost:3001 (admin/admin)

### Manual Setup

1. **Install backend dependencies**
```bash
cd backend
npm install
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Start backend**
```bash
cd backend
npm run dev
```

4. **Start frontend**
```bash
cd frontend
npm run dev
```

## Azure Deployment

### Prerequisites

- Azure subscription
- Azure CLI installed and configured
- Terraform installed
- GitHub repository with secrets configured

### Automated Deployment (CI/CD)

1. **Configure GitHub Secrets**
   - `AZURE_CREDENTIALS`: Service principal credentials
   - `SMART_CLIENT_ID`: SMART on FHIR client ID
   - `SMART_CLIENT_SECRET`: SMART on FHIR client secret
   - `VITE_API_BASE_URL`: Production API URL

2. **Push to main branch**
   - The GitHub Actions workflow will automatically deploy to Azure

### Manual Azure Deployment

1. **Login to Azure**
```bash
az login
az account set --subscription <subscription-id>
```

2. **Deploy infrastructure**
```bash
cd infra
terraform init
terraform plan
terraform apply
```

3. **Deploy applications**
```bash
# Backend
cd backend
npm run build
az webapp deployment source config-zip --resource-group carelink-rg --name carelink-backend-xxx --src dist.zip

# Frontend
cd frontend
npm run build
az webapp deployment source config-zip --resource-group carelink-rg --name carelink-frontend-xxx --src dist.zip
```

### Infrastructure Components

The Terraform configuration creates:

- **Resource Group**: `carelink-rg`
- **Virtual Network**: With subnets for app and database
- **Application Gateway**: Load balancer and SSL termination
- **App Service Plan**: P1v2 for both frontend and backend
- **Azure SQL Database**: For structured data
- **Cosmos DB**: For NoSQL data (chat, logs)
- **Service Bus**: For messaging and events
- **Application Insights**: For monitoring

## Production Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=<cosmos-db-connection-string>
AZURE_SQL_CONNECTION_STRING=<sql-connection-string>
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
SMART_CLIENT_ID=<your-smart-client-id>
SMART_CLIENT_SECRET=<your-smart-client-secret>
JWT_SECRET=<secure-random-string>
FRONTEND_URL=https://your-frontend-domain.com
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
VITE_SMART_CLIENT_ID=<your-smart-client-id>
```

### SSL/TLS Configuration

1. **Purchase SSL certificate** or use Azure App Service managed certificates
2. **Configure custom domain** in Azure App Service
3. **Enable HTTPS redirect** in Application Gateway

### Database Configuration

1. **Azure SQL Database**
   - Enable connection pooling
   - Configure firewall rules
   - Set up automated backups

2. **Cosmos DB**
   - Configure consistency level
   - Set up geo-replication if needed
   - Configure throughput

### Security Hardening

1. **Network Security**
   - Configure NSG rules
   - Enable Azure DDoS Protection
   - Use Azure Firewall if needed

2. **Application Security**
   - Enable Azure Security Center
   - Configure Azure Key Vault for secrets
   - Enable Azure AD authentication

## Monitoring and Observability

### Application Insights

1. **Enable Application Insights** in Azure App Service
2. **Configure custom metrics** for business KPIs
3. **Set up alerts** for critical thresholds

### Logging

1. **Structured logging** with Winston
2. **Log aggregation** with Azure Monitor
3. **Log retention** policies

### Health Checks

1. **Application health endpoint**: `/health`
2. **Database connectivity checks**
3. **External service monitoring**

### Performance Monitoring

1. **Azure Monitor** for infrastructure metrics
2. **Application Performance Monitoring** (APM)
3. **Custom dashboards** in Grafana

## Security Considerations

### Authentication & Authorization

1. **JWT Token Security**
   - Use strong secrets
   - Implement token refresh
   - Set appropriate expiration times

2. **SMART on FHIR**
   - Validate tokens properly
   - Implement scope checking
   - Secure client credentials

3. **Role-Based Access Control**
   - Implement proper role checks
   - Validate user permissions
   - Audit access logs

### Data Protection

1. **Encryption**
   - Encrypt data at rest
   - Encrypt data in transit
   - Use Azure Key Vault for keys

2. **HIPAA Compliance**
   - Implement data access controls
   - Audit logging
   - Data retention policies

3. **Privacy**
   - Implement data anonymization
   - User consent management
   - Data portability

### Network Security

1. **Firewall Rules**
   - Restrict database access
   - Configure application gateway
   - Use private endpoints

2. **VNet Integration**
   - Deploy in private subnets
   - Use service endpoints
   - Configure NSG rules

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check connection strings
   # Verify firewall rules
   # Test connectivity
   ```

2. **Authentication Problems**
   ```bash
   # Verify JWT secret
   # Check token expiration
   # Validate SMART credentials
   ```

3. **Performance Issues**
   ```bash
   # Check Application Insights
   # Monitor database performance
   # Review scaling settings
   ```

### Debug Commands

1. **Check application logs**
```bash
az webapp log tail --name carelink-backend-xxx --resource-group carelink-rg
```

2. **Test database connectivity**
```bash
# Test SQL connection
sqlcmd -S <server>.database.windows.net -U <username> -P <password>

# Test MongoDB connection
mongo <connection-string>
```

3. **Verify infrastructure**
```bash
terraform plan
terraform show
```

### Performance Optimization

1. **Database Optimization**
   - Index optimization
   - Query performance tuning
   - Connection pooling

2. **Application Optimization**
   - Caching strategies
   - CDN configuration
   - Image optimization

3. **Infrastructure Optimization**
   - Auto-scaling rules
   - Load balancer configuration
   - Resource sizing

## Maintenance

### Regular Tasks

1. **Security Updates**
   - Update dependencies
   - Patch vulnerabilities
   - Review access logs

2. **Backup Verification**
   - Test database backups
   - Verify restore procedures
   - Document recovery steps

3. **Performance Monitoring**
   - Review metrics
   - Optimize slow queries
   - Scale resources as needed

### Disaster Recovery

1. **Backup Strategy**
   - Database backups
   - Configuration backups
   - Code repository

2. **Recovery Procedures**
   - Document recovery steps
   - Test recovery procedures
   - Maintain runbooks

3. **Business Continuity**
   - Define RTO/RPO
   - Implement failover procedures
   - Test disaster scenarios 