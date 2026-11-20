// Loads data/graph.json into Neo4j. Safe to run more than once (it uses MERGE).
import { readFile } from 'node:fs/promises';
import { driver, run } from './db.js';
import { CONSTRAINTS, LOAD_PERSON, LOAD_JOBS } from './queries.js';

const data = JSON.parse(await readFile(new URL('../data/graph.json', import.meta.url), 'utf8'));

try {
  await driver.verifyConnectivity();
  console.log('Connected to Neo4j.');

  for (const c of CONSTRAINTS) await run(c);
  console.log(`Created ${CONSTRAINTS.length} constraints (or they already existed).`);

  await run(LOAD_PERSON, { person: data.person });
  console.log(`Loaded ${data.person.name} with ${data.person.skills.length} skills.`);

  await run(LOAD_JOBS, { jobs: data.jobs });
  console.log(`Loaded ${data.jobs.length} jobs.`);

  const [counts] = await run('MATCH (n) RETURN count(n) AS nodes, COUNT { ()-->() } AS relationships');
  console.log(`The graph now has ${counts.nodes} nodes and ${counts.relationships} relationships.`);
} catch (err) {
  console.error('Load failed:', err.message);
  process.exitCode = 1;
} finally {
  await driver.close();
}
