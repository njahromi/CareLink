#!/usr/bin/env node
/**
 * Load CareLink US Core / CARIN-lite seed bundles into the local HAPI R4 repository.
 * Usage: node scripts/fhir-seed.js
 * Env: FHIR_SERVER_URL (default http://localhost:8080/fhir)
 */
const fs = require('fs');
const path = require('path');
const { allBundles } = require('../fhir/seed');

const FHIR_SERVER_URL = process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir';
const seedDir = path.join(__dirname, '..', 'fhir', 'seed');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForFhir(timeoutMs = 180000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${FHIR_SERVER_URL}/metadata`, {
        headers: { Accept: 'application/fhir+json' }
      });
      if (response.ok) {
        console.log(`FHIR repository ready at ${FHIR_SERVER_URL}`);
        return;
      }
    } catch (error) {
      process.stdout.write('.');
    }
    await sleep(3000);
  }
  throw new Error(`FHIR repository did not become ready at ${FHIR_SERVER_URL}`);
}

function writeBundleFiles(bundles) {
  Object.entries(bundles).forEach(([name, bundle]) => {
    const file = path.join(seedDir, `bundle-${name}.json`);
    fs.writeFileSync(file, JSON.stringify(bundle, null, 2));
    console.log(`Wrote ${file}`);
  });
}

async function postBundle(name, bundle) {
  const response = await fetch(FHIR_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json'
    },
    body: JSON.stringify(bundle)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bundle ${name} failed (${response.status}): ${text.slice(0, 400)}`);
  }
  const result = await response.json();
  const entries = result.entry || [];
  const failed = entries.filter((entry) => {
    const status = entry.response?.status || '';
    return !status.startsWith('2');
  });
  if (failed.length) {
    throw new Error(`Bundle ${name} had ${failed.length} failed entries`);
  }
  console.log(`Loaded bundle ${name} (${entries.length} entries)`);
}

async function main() {
  const bundles = allBundles();
  writeBundleFiles(bundles);
  await waitForFhir();
  for (const [name, bundle] of Object.entries(bundles)) {
    await postBundle(name, bundle);
  }
  console.log('Seed complete. Patients: alex-rivera, jordan-lee, sam-okonkwo');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
