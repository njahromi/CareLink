const axios = require('axios');
const logger = require('../utils/logger');
const { PARTITION_SYSTEM } = require('../config/platform');
const localFhir = require('./localFhirStore');

class FHIRService {
  constructor() {
    this.baseUrl = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';
    this.mode = process.env.FHIR_MODE || 'auto';
    this.embedded = this.mode === 'embedded';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json'
      }
    });
  }

  get repositoryUrl() {
    return this.embedded ? 'embedded://carelink-r4' : this.baseUrl;
  }

  async ensureBackend() {
    if (this.mode === 'embedded') {
      this.embedded = true;
      return;
    }
    if (this.mode === 'hapi') {
      this.embedded = false;
      return;
    }
    if (this._probePromise) {
      return this._probePromise;
    }
    this._probePromise = (async () => {
      try {
        await this.client.get('/metadata');
        this.embedded = false;
        logger.info(`Using HAPI FHIR repository at ${this.baseUrl}`);
      } catch (error) {
        this.embedded = true;
        logger.warn(`HAPI unavailable (${error.message}); using embedded FHIR store with seed data`);
      }
    })();
    return this._probePromise;
  }

  partitionParam(partition) {
    if (!partition) {
      return null;
    }
    return `${PARTITION_SYSTEM}|${partition}`;
  }

  hasPartition(resource, partition) {
    if (!partition) {
      return true;
    }
    return (resource.meta?.tag || []).some(
      (item) => item.system === PARTITION_SYSTEM && item.code === partition
    );
  }

  applyPartition(resource, partition) {
    if (!partition || !resource) {
      return resource;
    }
    const next = { ...resource };
    next.meta = { ...(resource.meta || {}) };
    const tags = [...(next.meta.tag || [])].filter(
      (item) => item.system !== PARTITION_SYSTEM
    );
    tags.push({
      system: PARTITION_SYSTEM,
      code: partition,
      display: partition
    });
    next.meta.tag = tags;
    return next;
  }

  async request(method, url, { params, data, headers } = {}) {
    await this.ensureBackend();
    if (this.embedded) {
      const verb = method.toLowerCase();
      if (verb === 'get') return localFhir.get(url, params);
      if (verb === 'post') return localFhir.post(url, data);
      if (verb === 'put') return localFhir.put(url, data);
    }
    try {
      const response = await this.client.request({
        method,
        url,
        params,
        data,
        headers
      });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const body = error.response?.data;
      const message = body?.issue?.[0]?.diagnostics || body?.error || error.message;
      logger.error(`FHIR ${method} ${url} failed: ${message}`);
      const wrapped = new Error(message);
      wrapped.statusCode = status || 502;
      wrapped.name = 'FHIRError';
      throw wrapped;
    }
  }

  async getPatient(patientId) {
    return this.request('GET', `/Patient/${patientId}`);
  }

  async search(resourceType, searchParams = {}, partition = null) {
    const params = { ...searchParams };
    const tag = this.partitionParam(partition);
    if (tag) {
      params._tag = tag;
    }
    return this.request('GET', `/${resourceType}`, { params });
  }

  async searchByPatient(resourceType, patientId, extra = {}, partition = null) {
    const subjectTypes = ['Observation', 'Condition', 'MedicationRequest', 'CarePlan', 'AllergyIntolerance', 'Coverage', 'ExplanationOfBenefit'];
    const actorTypes = ['Appointment'];
    const params = { ...extra };
    if (resourceType === 'Patient') {
      params._id = patientId;
    } else if (actorTypes.includes(resourceType)) {
      params.actor = `Patient/${patientId}`;
    } else if (subjectTypes.includes(resourceType) || extra.subject) {
      params.patient = params.patient || `Patient/${patientId}`;
      if (!['Coverage', 'ExplanationOfBenefit', 'AllergyIntolerance'].includes(resourceType)) {
        params.subject = params.subject || `Patient/${patientId}`;
      }
    }
    return this.search(resourceType, params, partition);
  }

  async getPatientObservations(patientId, category = null, partition = null) {
    const extra = {};
    if (category) {
      extra.category = category;
    }
    return this.searchByPatient('Observation', patientId, extra, partition);
  }

  async getPatientCarePlans(patientId, partition = null) {
    return this.searchByPatient('CarePlan', patientId, {}, partition);
  }

  async getPatientAppointments(patientId, partition = null) {
    return this.searchByPatient('Appointment', patientId, {}, partition);
  }

  async getPatientMedications(patientId, partition = null) {
    return this.searchByPatient('MedicationRequest', patientId, {}, partition);
  }

  async getPatientConditions(patientId, partition = null) {
    return this.searchByPatient('Condition', patientId, {}, partition);
  }

  async getPatientCoverage(patientId, partition = null) {
    return this.search('Coverage', { beneficiary: `Patient/${patientId}` }, partition);
  }

  async getPatientEobs(patientId, partition = null) {
    return this.search('ExplanationOfBenefit', { patient: `Patient/${patientId}` }, partition);
  }

  async getPatientAllergies(patientId, partition = null) {
    return this.search('AllergyIntolerance', { patient: `Patient/${patientId}` }, partition);
  }

  async searchPatients(searchParams = {}, partition = null) {
    return this.search('Patient', searchParams, partition);
  }

  async createResource(resourceType, resource, partition = null) {
    return this.request('POST', `/${resourceType}`, {
      data: this.applyPartition(resource, partition)
    });
  }

  async updateResource(resourceType, id, resource, partition = null) {
    return this.request('PUT', `/${resourceType}/${id}`, {
      data: this.applyPartition({ ...resource, id, resourceType }, partition)
    });
  }

  async createObservation(observationData, partition = null) {
    return this.createResource('Observation', {
      resourceType: 'Observation',
      status: 'final',
      ...observationData
    }, partition);
  }

  async updateCarePlan(carePlanId, carePlanData, partition = null) {
    return this.updateResource('CarePlan', carePlanId, carePlanData, partition);
  }

  async postTransaction(bundle, partition = null) {
    const next = { ...bundle, resourceType: 'Bundle', type: bundle.type || 'transaction' };
    if (partition && Array.isArray(next.entry)) {
      next.entry = next.entry.map((entry) => ({
        ...entry,
        resource: this.applyPartition(entry.resource, partition)
      }));
    }
    return this.request('POST', '/', { data: next });
  }

  async getCapabilities() {
    return this.request('GET', '/metadata');
  }

  async validateResource(resourceType, resourceData) {
    return this.request('POST', `/${resourceType}/$validate`, { data: resourceData });
  }

  async countByType() {
    await this.ensureBackend();
    if (this.embedded) {
      return localFhir.countByType();
    }
    const types = ['Patient', 'Observation', 'Condition', 'MedicationRequest', 'CarePlan', 'Appointment', 'Coverage', 'ExplanationOfBenefit', 'AuditEvent', 'Organization', 'Practitioner'];
    const counts = {};
    await Promise.all(types.map(async (type) => {
      try {
        const bundle = await this.search(type, { _summary: 'count' });
        counts[type] = bundle.total || 0;
      } catch (error) {
        counts[type] = null;
      }
    }));
    return counts;
  }

  bundleEntries(bundle) {
    return (bundle?.entry || []).map((entry) => entry.resource).filter(Boolean);
  }

  formatVitalSigns(observations) {
    return this.bundleEntries(observations).map((obs) => ({
      id: obs.id,
      code: obs.code?.coding?.[0]?.code,
      display: obs.code?.coding?.[0]?.display || obs.code?.text,
      value: obs.valueQuantity?.value,
      unit: obs.valueQuantity?.unit,
      date: obs.effectiveDateTime,
      status: obs.status
    }));
  }

  formatCarePlans(carePlans) {
    return this.bundleEntries(carePlans).map((plan) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      status: plan.status,
      period: plan.period,
      goals: plan.goal?.map((item) => item.display || item.reference) || [],
      activities: (plan.activity || []).map((item) => item.detail?.description || item.detail?.status)
    }));
  }

  formatAppointments(appointments) {
    return this.bundleEntries(appointments).map((item) => ({
      id: item.id,
      provider: item.participant?.find((part) => part.actor?.reference?.startsWith('Practitioner'))?.actor?.display || 'Provider',
      type: item.description || item.serviceType?.[0]?.text || 'Appointment',
      date: item.start,
      status: item.status
    }));
  }
}

module.exports = new FHIRService();
