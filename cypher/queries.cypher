// Queries to paste into the Query tool in the Aura console.
// Run them one at a time. Load the data first with: npm run load

// 0. See the whole graph (switch the result view to "Graph").
MATCH p = ()-->()
RETURN p
LIMIT 200;

// 1. Picture for your README: what the Neo4j job wants, and what Yaldar has.
MATCH p = (:Job {id: 'neo4j-aura-instances'})-[:REQUIRES]->(:Skill)<-[:HAS_SKILL]-(:Person {name: 'Yaldar'})
RETURN p;

// 2. How well do I match each job?
MATCH (me:Person {name: 'Yaldar'})
MATCH (c:Company)-[:POSTED]->(j:Job)-[:REQUIRES]->(s:Skill)
OPTIONAL MATCH (me)-[h:HAS_SKILL]->(s)
WITH c, j,
     count(s) AS required,
     sum(CASE WHEN h.level = 'good' THEN 1 ELSE 0 END) AS good,
     sum(CASE WHEN h.level = 'basic' THEN 1 ELSE 0 END) AS basic
RETURN c.name AS company, j.title AS job, required, good, basic,
       toInteger(round(100.0 * good / required)) AS matchPercent
ORDER BY matchPercent DESC;

// 3. Skill gap for the Neo4j job.
MATCH (j:Job {id: 'neo4j-aura-instances'})-[r:REQUIRES]->(s:Skill)
OPTIONAL MATCH (:Person {name: 'Yaldar'})-[h:HAS_SKILL]->(s)
RETURN s.name AS skill, r.importance AS importance, coalesce(h.level, 'missing') AS myLevel
ORDER BY CASE myLevel WHEN 'missing' THEN 0 WHEN 'basic' THEN 1 ELSE 2 END, importance, skill;

// 4. What should I learn next?
MATCH (s:Skill)<-[:REQUIRES]-(j:Job)
WHERE NOT EXISTS { MATCH (:Person {name: 'Yaldar'})-[:HAS_SKILL {level: 'good'}]->(s) }
WITH s, collect(j.title) AS jobs
RETURN s.name AS skill, size(jobs) AS jobCount, jobs
ORDER BY jobCount DESC, skill;

// 5. Which jobs are similar to the Neo4j job?
MATCH (a:Job {id: 'neo4j-aura-instances'})-[:REQUIRES]->(s:Skill)<-[:REQUIRES]-(b:Job)
MATCH (c:Company)-[:POSTED]->(b)
RETURN c.name AS company, b.title AS job, count(s) AS sharedSkills, collect(s.name) AS skills
ORDER BY sharedSkills DESC;

// 6. Practice: when you start to learn Kubernetes, add it. Then run query 2 and 3 again.
MATCH (me:Person {name: 'Yaldar'})
MERGE (s:Skill {name: 'Kubernetes'})
MERGE (me)-[h:HAS_SKILL]->(s)
SET h.level = 'basic'
RETURN me.name, s.name, h.level;

// 7. Start again: delete everything (careful!). Then run npm run load.
// MATCH (n) DETACH DELETE n;
