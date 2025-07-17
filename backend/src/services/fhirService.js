const axios = require('axios');
const logger = require('../utils/logger');

class FHIRService {
  constructor() {
    this.baseUrl = process.env.FHIR_SERVER_URL || 'https://hapi.fhir.org/baseR4';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      }
    });
  }

  // Get patient information
  async getPatient(patientId) {
    try {
      const response = await this.client.get(`/Patient/${patientId}`);
      logger.info(`Retrieved patient data for ID: ${patientId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error retrieving patient ${patientId}:`, error.message);
      throw new Error(`Failed to retrieve patient: ${error.message}`);
    }
  }

  // Get patient observations (vital signs)
  async getPatientObservations(patientId, category = null) {
    try {
      let url = `/Observation?subject=Patient/${patientId}`;
      if (category) {
        url += `&category=${category}`;
      }
      
      const response = await this.client.get(url);
      logger.info(`Retrieved observations for patient ${patientId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error retrieving observations for patient ${patientId}:`, error.message);
      throw new Error(`Failed to retrieve observations: ${error.message}`);
    }
  }

  // Get patient care plans
  async getPatientCarePlans(patientId) {
    try {
      const response = await this.client.get(`/CarePlan?subject=Patient/${patientId}`);
      logger.info(`Retrieved care plans for patient ${patientId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error retrieving care plans for patient ${patientId}:`, error.message);
      throw new Error(`Failed to retrieve care plans: ${error.message}`);
    }
  }

  // Get patient appointments
  async getPatientAppointments(patientId) {
    try {
      const response = await this.client.get(`/Appointment?actor=Patient/${patientId}`);
      logger.info(`Retrieved appointments for patient ${patientId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error retrieving appointments for patient ${patientId}:`, error.message);
      throw new Error(`Failed to retrieve appointments: ${error.message}`);
    }
  }

  // Get patient medications
  async getPatientMedications(patientId) {
    try {
      const response = await this.client.get(`/MedicationRequest?subject=Patient/${patientId}`);
      logger.info(`Retrieved medications for patient ${patientId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error retrieving medications for patient ${patientId}:`, error.message);
      throw new Error(`Failed to retrieve medications: ${error.message}`);
    }
  }

  // Get patient conditions (diagnoses)
  async getPatientConditions(patientId) {
    try {
      const response = await this.client.get(`/Condition?subject=Patient/${patientId}`);
      logger.info(`Retrieved conditions for patient ${patientId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error retrieving conditions for patient ${patientId}:`, error.message);
      throw new Error(`Failed to retrieve conditions: ${error.message}`);
    }
  }

  // Search for patients
  async searchPatients(searchParams = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          params.append(key, searchParams[key]);
        }
      });

      const response = await this.client.get(`/Patient?${params.toString()}`);
      logger.info('Patient search completed');
      return response.data;
    } catch (error) {
      logger.error('Error searching patients:', error.message);
      throw new Error(`Failed to search patients: ${error.message}`);
    }
  }

  // Create observation (vital sign)
  async createObservation(observationData) {
    try {
      const response = await this.client.post('/Observation', observationData);
      logger.info('Created new observation');
      return response.data;
    } catch (error) {
      logger.error('Error creating observation:', error.message);
      throw new Error(`Failed to create observation: ${error.message}`);
    }
  }

  // Update care plan
  async updateCarePlan(carePlanId, carePlanData) {
    try {
      const response = await this.client.put(`/CarePlan/${carePlanId}`, carePlanData);
      logger.info(`Updated care plan ${carePlanId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error updating care plan ${carePlanId}:`, error.message);
      throw new Error(`Failed to update care plan: ${error.message}`);
    }
  }

  // Get FHIR server capabilities
  async getCapabilities() {
    try {
      const response = await this.client.get('/metadata');
      logger.info('Retrieved FHIR server capabilities');
      return response.data;
    } catch (error) {
      logger.error('Error retrieving FHIR capabilities:', error.message);
      throw new Error(`Failed to retrieve capabilities: ${error.message}`);
    }
  }

  // Validate FHIR resource
  async validateResource(resourceType, resourceData) {
    try {
      const response = await this.client.post(`/${resourceType}/$validate`, resourceData);
      logger.info(`Validated ${resourceType} resource`);
      return response.data;
    } catch (error) {
      logger.error(`Error validating ${resourceType} resource:`, error.message);
      throw new Error(`Failed to validate resource: ${error.message}`);
    }
  }

  // Helper method to format vital signs data
  formatVitalSigns(observations) {
    if (!observations.entry) return [];

    return observations.entry.map(entry => {
      const obs = entry.resource;
      return {
        id: obs.id,
        code: obs.code?.coding?.[0]?.code,
        display: obs.code?.coding?.[0]?.display,
        value: obs.valueQuantity?.value,
        unit: obs.valueQuantity?.unit,
        date: obs.effectiveDateTime,
        status: obs.status
      };
    });
  }

  // Helper method to format care plan data
  formatCarePlans(carePlans) {
    if (!carePlans.entry) return [];

    return carePlans.entry.map(entry => {
      const plan = entry.resource;
      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        period: plan.period,
        goals: plan.goal?.map(g => g.reference),
        activities: plan.activity?.map(a => ({
          detail: a.detail,
          outcomeCodeableConcept: a.outcomeCodeableConcept
        }))
      };
    });
  }
}

module.exports = new FHIRService(); 