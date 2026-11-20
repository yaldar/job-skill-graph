
// All Cypher queries in one place.
// $name values are parameters. The driver sends them separately from the query text.

// Uniqueness constraints: stop duplicates and make MERGE fast (it uses the index).
export const CONSTRAINTS = [
  'CREATE CONSTRAINT person_name IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE',
  'CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE',
  'CREATE CONSTRAINT company_name IF NOT EXISTS FOR (c:Company) REQUIRE c.name IS UNIQUE',
  'CREATE CONSTRAINT job_id IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE',
];

// MERGE = "find it, or create it if it does not exist". You can run the load again safely.
export const LOAD_PERSON = `
MERGE (p:Person {name: $person.name})
WITH p
UNWIND $person.skills AS sk
MERGE (s:Skill {name: sk.name})
MERGE (p)-[h:HAS_SKILL]->(s)
SET h.level = sk.level
`;

export const LOAD_JOBS = `
UNWIND $jobs AS job
MERGE (c:Company {name: job.company})
MERGE (j:Job {id: job.id})
SET j.title = job.title, j.source = job.source
MERGE (c)-[:POSTED]->(j)
WITH j, job
UNWIND job.requires AS req
MERGE (s:Skill {name: req.skill})
MERGE (j)-[r:REQUIRES]->(s)
SET r.importance = req.importance
`;

// 1. How well do I match each job?
export const MATCH_SCORE = `
MATCH (me:Person {name: $me})
MATCH (c:Company)-[:POSTED]->(j:Job)-[:REQUIRES]->(s:Skill)
OPTIONAL MATCH (me)-[h:HAS_SKILL]->(s)
WITH c, j,
     count(s) AS required,
     sum(CASE WHEN h.level = 'good' THEN 1 ELSE 0 END) AS good,
     sum(CASE WHEN h.level = 'basic' THEN 1 ELSE 0 END) AS basic
RETURN c.name AS company, j.title AS job, required, good, basic,
       toInteger(round(100.0 * good / required)) AS matchPercent
ORDER BY matchPercent DESC
`;

// 2. Skill gap for one job: what do I miss, and what do I only know a little?
export const SKILL_GAP = `
MATCH (j:Job {id: $jobId})-[r:REQUIRES]->(s:Skill)
OPTIONAL MATCH (:Person {name: $me})-[h:HAS_SKILL]->(s)
RETURN s.name AS skill, r.importance AS importance, coalesce(h.level, 'missing') AS myLevel
ORDER BY CASE myLevel WHEN 'missing' THEN 0 WHEN 'basic' THEN 1 ELSE 2 END, importance, skill
`;

// 3. What should I learn next? Skills that jobs want, where I am not "good" yet.
//    Each job gives points: 2 if the skill is "must", 1 if it is "nice".
export const LEARN_NEXT = `
MATCH (s:Skill)<-[r:REQUIRES]-(j:Job)
WHERE NOT EXISTS { MATCH (:Person {name: $me})-[:HAS_SKILL {level: 'good'}]->(s) }
WITH s,
     sum(CASE r.importance WHEN 'must' THEN 2 ELSE 1 END) AS score,
     collect(j.title) AS jobs
RETURN s.name AS skill, score, size(jobs) AS jobCount, jobs
ORDER BY score DESC, skill
`;

// 4. Which jobs are similar to this job? Count the skills they share.
export const SIMILAR_JOBS = `
MATCH (a:Job {id: $jobId})-[:REQUIRES]->(s:Skill)<-[:REQUIRES]-(b:Job)
MATCH (c:Company)-[:POSTED]->(b)
RETURN c.name AS company, b.title AS job, count(s) AS sharedSkills, collect(s.name) AS skills
ORDER BY sharedSkills DESC
`;
