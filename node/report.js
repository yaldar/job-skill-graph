// Prints four reports. Usage: npm run report -- [jobId]
import { driver, run } from './db.js';
import { MATCH_SCORE, SKILL_GAP, LEARN_NEXT, SIMILAR_JOBS } from './queries.js';

const me = 'Yaldar';
const jobId = process.argv[2] || 'neo4j-aura-instances';

try {
  console.log('\n1. How well do I match each job? (good skills / required skills)');
  console.table(await run(MATCH_SCORE, { me }));

  console.log(`\n2. Skill gap for job "${jobId}"`);
  const gap = await run(SKILL_GAP, { me, jobId });
  if (gap.length === 0) console.log(`No job with id "${jobId}". Check data/graph.json.`);
  else console.table(gap);

  console.log('\n3. What should I learn next?');
  console.table((await run(LEARN_NEXT, { me })).map((r) => ({ ...r, jobs: r.jobs.join(', ') })));

  console.log(`\n4. Jobs similar to "${jobId}"`);
  console.table((await run(SIMILAR_JOBS, { jobId })).map((r) => ({ ...r, skills: r.skills.join(', ') })));
} catch (err) {
  console.error('Report failed:', err.message);
  process.exitCode = 1;
} finally {
  await driver.close();
}
