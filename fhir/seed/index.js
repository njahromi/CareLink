const PARTITION_SYSTEM = 'https://carelink.local/fhir/partition';

const tag = (code, display) => [{
  system: PARTITION_SYSTEM,
  code,
  display
}];

const orgPlan = {
  resourceType: 'Organization',
  id: 'carelink-health-plan',
  meta: {
    tag: tag('payer-internal', 'Payer Internal')
  },
  identifier: [{
    system: 'http://hl7.org/fhir/sid/us-npi',
    value: '1999999991'
  }],
  active: true,
  type: [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/organization-type',
      code: 'ins',
      display: 'Insurance Company'
    }]
  }],
  name: 'CareLink Health Plan',
  telecom: [{ system: 'phone', value: '800-555-0199' }]
};

const orgClinic = {
  resourceType: 'Organization',
  id: 'riverside-clinic',
  meta: {
    tag: tag('provider-access', 'Provider Access')
  },
  identifier: [{
    system: 'http://hl7.org/fhir/sid/us-npi',
    value: '1999999992'
  }],
  active: true,
  type: [{
    coding: [{
      system: 'http://terminology.hl7.org/CodeSystem/organization-type',
      code: 'prov',
      display: 'Healthcare Provider'
    }]
  }],
  name: 'Riverside Clinic'
};

const practitioner = {
  resourceType: 'Practitioner',
  id: 'sarah-johnson',
  meta: {
    tag: tag('provider-access', 'Provider Access')
  },
  identifier: [{
    system: 'http://hl7.org/fhir/sid/us-npi',
    value: '1234567893'
  }],
  active: true,
  name: [{
    use: 'official',
    family: 'Johnson',
    given: ['Sarah'],
    prefix: ['Dr.']
  }],
  gender: 'female'
};

function patientAlex() {
  const partition = tag('patient-access', 'Patient Access');
  const subject = { reference: 'Patient/alex-rivera', display: 'Alex Rivera' };

  return [
    {
      resourceType: 'Patient',
      id: 'alex-rivera',
      meta: {
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'],
        tag: partition
      },
      identifier: [
        { system: 'http://carelink.local/member-id', value: 'MBR-10001' },
        { type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MB' }] }, system: 'http://carelink.local/member-id', value: 'MBR-10001' }
      ],
      active: true,
      name: [{ use: 'official', family: 'Rivera', given: ['Alex', 'M'] }],
      telecom: [
        { system: 'phone', value: '555-0101', use: 'home' },
        { system: 'email', value: 'alex.rivera@example.com' }
      ],
      gender: 'male',
      birthDate: '1978-04-12',
      address: [{
        use: 'home',
        line: ['1842 Cedar Ave'],
        city: 'Oakland',
        state: 'CA',
        postalCode: '94610',
        country: 'US'
      }]
    },
    {
      resourceType: 'Observation',
      id: 'alex-hr-1',
      meta: { tag: partition },
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }]
      }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }]
      },
      subject,
      effectiveDateTime: '2026-10-08T10:15:00Z',
      valueQuantity: { value: 72, unit: 'beats/min', system: 'http://unitsofmeasure.org', code: '/min' }
    },
    {
      resourceType: 'Observation',
      id: 'alex-sysbp-1',
      meta: { tag: partition },
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
      }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }]
      },
      subject,
      effectiveDateTime: '2026-10-08T10:15:00Z',
      valueQuantity: { value: 128, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
    },
    {
      resourceType: 'Observation',
      id: 'alex-diabp-1',
      meta: { tag: partition },
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
      }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }]
      },
      subject,
      effectiveDateTime: '2026-10-08T10:15:00Z',
      valueQuantity: { value: 82, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
    },
    {
      resourceType: 'Observation',
      id: 'alex-temp-1',
      meta: { tag: partition },
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
      }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }]
      },
      subject,
      effectiveDateTime: '2026-10-08T10:15:00Z',
      valueQuantity: { value: 98.4, unit: '°F', system: 'http://unitsofmeasure.org', code: '[degF]' }
    },
    {
      resourceType: 'Observation',
      id: 'alex-a1c-1',
      meta: { tag: partition },
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory' }]
      }],
      code: {
        coding: [{ system: 'http://loinc.org', code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood' }]
      },
      subject,
      effectiveDateTime: '2026-09-20T14:00:00Z',
      valueQuantity: { value: 7.1, unit: '%', system: 'http://unitsofmeasure.org', code: '%' }
    },
    {
      resourceType: 'Condition',
      id: 'alex-t2dm',
      meta: {
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-problems-health-concerns'],
        tag: partition
      },
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' }]
      }],
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '44054006', display: 'Type 2 diabetes mellitus' }],
        text: 'Type 2 diabetes mellitus'
      },
      subject,
      onsetDateTime: '2019-06-01'
    },
    {
      resourceType: 'MedicationRequest',
      id: 'alex-metformin',
      meta: { tag: partition },
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '860975', display: 'metformin hydrochloride 500 MG Oral Tablet' }],
        text: 'Metformin 500 mg'
      },
      subject,
      authoredOn: '2026-01-15',
      requester: { reference: 'Practitioner/sarah-johnson', display: 'Dr. Sarah Johnson' },
      dosageInstruction: [{ text: '500 mg twice daily with meals' }]
    },
    {
      resourceType: 'CarePlan',
      id: 'alex-dm-plan',
      meta: { tag: partition },
      status: 'active',
      intent: 'plan',
      title: 'Diabetes Management Plan',
      description: 'US Core-aligned plan for Type 2 diabetes: A1c control, medication adherence, and follow-up.',
      subject,
      period: { start: '2026-01-01', end: '2026-12-31' },
      activity: [
        { detail: { status: 'in-progress', description: 'Metformin 500mg twice daily' } },
        { detail: { status: 'in-progress', description: 'Home glucose checks before breakfast' } }
      ]
    },
    {
      resourceType: 'Appointment',
      id: 'alex-followup',
      meta: { tag: partition },
      status: 'booked',
      serviceType: [{ coding: [{ code: 'follow-up', display: 'Follow-up' }], text: 'Diabetes follow-up' }],
      description: 'Quarterly diabetes follow-up',
      start: '2026-10-20T14:00:00Z',
      end: '2026-10-20T14:30:00Z',
      minutesDuration: 30,
      participant: [
        { actor: subject, status: 'accepted' },
        { actor: { reference: 'Practitioner/sarah-johnson', display: 'Dr. Sarah Johnson' }, status: 'accepted' }
      ]
    },
    {
      resourceType: 'AllergyIntolerance',
      id: 'alex-penicillin',
      meta: { tag: partition },
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] },
      code: { coding: [{ system: 'http://snomed.info/sct', code: '91936005', display: 'Allergy to penicillin' }], text: 'Penicillin' },
      patient: subject
    },
    {
      resourceType: 'Coverage',
      id: 'alex-coverage',
      meta: {
        profile: ['http://hl7.org/fhir/us/carin-bb/StructureDefinition/C4BB-Coverage'],
        tag: partition
      },
      status: 'active',
      subscriberId: 'MBR-10001',
      beneficiary: subject,
      relationship: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/subscriber-relationship', code: 'self' }] },
      payor: [{ reference: 'Organization/carelink-health-plan', display: 'CareLink Health Plan' }],
      class: [{
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class', code: 'plan' }] },
        value: 'GOLD-HMO',
        name: 'Gold HMO'
      }]
    },
    {
      resourceType: 'ExplanationOfBenefit',
      id: 'alex-eob-1',
      meta: {
        profile: ['http://hl7.org/fhir/us/carin-bb/StructureDefinition/C4BB-ExplanationOfBenefit-Inpatient-Institutional'],
        tag: partition
      },
      status: 'active',
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'pharmacy' }] },
      use: 'claim',
      patient: subject,
      created: '2026-09-12',
      insurer: { reference: 'Organization/carelink-health-plan' },
      provider: { reference: 'Organization/riverside-clinic' },
      outcome: 'complete',
      insurance: [{
        focal: true,
        coverage: { reference: 'Coverage/alex-coverage' }
      }],
      item: [{
        sequence: 1,
        productOrService: { text: 'Metformin 500 mg tablet' },
        adjudication: [{
          category: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/adjudication', code: 'benefit' }] },
          amount: { value: 12.4, currency: 'USD' }
        }]
      }],
      total: [{
        category: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/adjudication', code: 'benefit' }] },
        amount: { value: 12.4, currency: 'USD' }
      }]
    }
  ];
}

function patientJordan() {
  const partition = tag('patient-access', 'Patient Access');
  const subject = { reference: 'Patient/jordan-lee', display: 'Jordan Lee' };

  return [
    {
      resourceType: 'Patient',
      id: 'jordan-lee',
      meta: {
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient'],
        tag: partition
      },
      identifier: [{ system: 'http://carelink.local/member-id', value: 'MBR-10002' }],
      active: true,
      name: [{ use: 'official', family: 'Lee', given: ['Jordan'] }],
      telecom: [{ system: 'email', value: 'jordan.lee@example.com' }],
      gender: 'female',
      birthDate: '1989-11-03',
      address: [{
        use: 'home',
        line: ['55 Market St'],
        city: 'San Jose',
        state: 'CA',
        postalCode: '95113',
        country: 'US'
      }]
    },
    {
      resourceType: 'Observation',
      id: 'jordan-sysbp-1',
      meta: { tag: partition },
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
      }],
      code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
      subject,
      effectiveDateTime: '2026-10-07T16:40:00Z',
      valueQuantity: { value: 138, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
    },
    {
      resourceType: 'Observation',
      id: 'jordan-hr-1',
      meta: { tag: partition },
      status: 'final',
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }]
      }],
      code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }] },
      subject,
      effectiveDateTime: '2026-10-07T16:40:00Z',
      valueQuantity: { value: 80, unit: 'beats/min', system: 'http://unitsofmeasure.org', code: '/min' }
    },
    {
      resourceType: 'Condition',
      id: 'jordan-htn',
      meta: { tag: partition },
      clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
      verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
      category: [{
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'problem-list-item' }]
      }],
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertensive disorder' }],
        text: 'Essential hypertension'
      },
      subject,
      onsetDateTime: '2022-03-01'
    },
    {
      resourceType: 'MedicationRequest',
      id: 'jordan-lisinopril',
      meta: { tag: partition },
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '314076', display: 'lisinopril 10 MG Oral Tablet' }],
        text: 'Lisinopril 10 mg'
      },
      subject,
      authoredOn: '2026-02-01',
      requester: { reference: 'Practitioner/sarah-johnson' },
      dosageInstruction: [{ text: '10 mg daily' }]
    },
    {
      resourceType: 'CarePlan',
      id: 'jordan-htn-plan',
      meta: { tag: partition },
      status: 'active',
      intent: 'plan',
      title: 'Hypertension Management',
      description: 'Blood pressure control, sodium reduction, and medication adherence.',
      subject,
      period: { start: '2026-02-01' },
      activity: [
        { detail: { status: 'in-progress', description: 'Lisinopril 10mg daily' } },
        { detail: { status: 'in-progress', description: 'Home BP log three times weekly' } }
      ]
    },
    {
      resourceType: 'Appointment',
      id: 'jordan-followup',
      meta: { tag: partition },
      status: 'booked',
      description: 'Hypertension follow-up',
      start: '2026-10-18T09:00:00Z',
      end: '2026-10-18T09:20:00Z',
      minutesDuration: 20,
      participant: [
        { actor: subject, status: 'accepted' },
        { actor: { reference: 'Practitioner/sarah-johnson', display: 'Dr. Sarah Johnson' }, status: 'accepted' }
      ]
    },
    {
      resourceType: 'Coverage',
      id: 'jordan-coverage',
      meta: { tag: partition },
      status: 'active',
      subscriberId: 'MBR-10002',
      beneficiary: subject,
      relationship: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/subscriber-relationship', code: 'self' }] },
      payor: [{ reference: 'Organization/carelink-health-plan' }],
      class: [{
        type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class', code: 'plan' }] },
        value: 'SILVER-PPO',
        name: 'Silver PPO'
      }]
    },
    {
      resourceType: 'ExplanationOfBenefit',
      id: 'jordan-eob-1',
      meta: { tag: partition },
      status: 'active',
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'professional' }] },
      use: 'claim',
      patient: subject,
      created: '2026-08-03',
      insurer: { reference: 'Organization/carelink-health-plan' },
      provider: { reference: 'Practitioner/sarah-johnson' },
      outcome: 'complete',
      insurance: [{ focal: true, coverage: { reference: 'Coverage/jordan-coverage' } }],
      total: [{
        category: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/adjudication', code: 'benefit' }] },
        amount: { value: 85.0, currency: 'USD' }
      }]
    }
  ];
}

function patientSam() {
  const partition = tag('payer-internal', 'Payer Internal');
  const subject = { reference: 'Patient/sam-okonkwo', display: 'Sam Okonkwo' };

  return [
    {
      resourceType: 'Patient',
      id: 'sam-okonkwo',
      meta: { tag: partition },
      identifier: [{ system: 'http://carelink.local/member-id', value: 'MBR-20001' }],
      active: true,
      name: [{ use: 'official', family: 'Okonkwo', given: ['Sam'] }],
      gender: 'male',
      birthDate: '1971-01-22'
    },
    {
      resourceType: 'Coverage',
      id: 'sam-coverage',
      meta: { tag: partition },
      status: 'active',
      subscriberId: 'MBR-20001',
      beneficiary: subject,
      payor: [{ reference: 'Organization/carelink-health-plan' }]
    },
    {
      resourceType: 'ExplanationOfBenefit',
      id: 'sam-eob-1',
      meta: { tag: partition },
      status: 'active',
      type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/claim-type', code: 'institutional' }] },
      use: 'claim',
      patient: subject,
      created: '2026-07-01',
      insurer: { reference: 'Organization/carelink-health-plan' },
      provider: { reference: 'Organization/riverside-clinic' },
      outcome: 'complete',
      insurance: [{ focal: true, coverage: { reference: 'Coverage/sam-coverage' } }],
      total: [{
        category: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/adjudication', code: 'benefit' }] },
        amount: { value: 2400.0, currency: 'USD' }
      }]
    }
  ];
}

function toTransaction(resources) {
  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: resources.map((resource) => ({
      fullUrl: `${resource.resourceType}/${resource.id}`,
      resource,
      request: {
        method: 'PUT',
        url: `${resource.resourceType}/${resource.id}`
      }
    }))
  };
}

function allResources() {
  return [
    orgPlan,
    orgClinic,
    practitioner,
    ...patientAlex(),
    ...patientJordan(),
    ...patientSam()
  ];
}

function allBundles() {
  return {
    foundation: toTransaction([orgPlan, orgClinic, practitioner]),
    'alex-rivera': toTransaction(patientAlex()),
    'jordan-lee': toTransaction(patientJordan()),
    'sam-okonkwo': toTransaction(patientSam())
  };
}

module.exports = {
  PARTITION_SYSTEM,
  allResources,
  allBundles,
  toTransaction
};
