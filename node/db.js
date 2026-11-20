import neo4j from 'neo4j-driver';

// These names match the credentials file that Aura gives you when you create an instance.
const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD } = process.env;
export const DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  console.error('Missing NEO4J_URI, NEO4J_USERNAME or NEO4J_PASSWORD. Did you create the .env file?');
  process.exit(1);
}

// disableLosslessIntegers: return normal JS numbers instead of Neo4j Integer objects.
export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
  { disableLosslessIntegers: true },
);

// Run one query and return the rows as plain objects.
export async function run(query, params = {}) {
  const { records } = await driver.executeQuery(query, params, { database: DATABASE });
  return records.map((r) => r.toObject());
}
