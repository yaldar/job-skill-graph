# job-skill-graph

A small Neo4j project. It stores my skills and some job ads as a graph. Then it answers questions with Cypher:

- How well do I match each job?
- Which skills does a job need that I do not have yet?
- Which skill should I learn next?
- Which jobs are similar to each other?

I use Neo4j AuraDB Free, a Node.js loader and report, and a small Go program.

## The graph model

```
(:Person {name})-[:HAS_SKILL {level: "good" | "basic"}]->(:Skill {name})
(:Company {name})-[:POSTED]->(:Job {id, title, source})-[:REQUIRES {importance: "must" | "nice"}]->(:Skill)
```

`Skill` nodes are shared. When a job and a person point to the same `Skill` node, that is a match. A graph is a good fit because the questions are about connections. In SQL the same questions need several join tables.

The Neo4j job comes from a real job ad. The other jobs are sample data. Edit `data/graph.json` to add real job ads.

## Project structure

```
data/graph.json        The data: my skills and the job ads
node/queries.js        All Cypher queries
node/load.js           Creates constraints and loads the data with UNWIND + MERGE
node/report.js         Runs the four reports and prints tables
go/main.go             Skill gap for one job, written in Go
cypher/queries.cypher  Queries to paste into the Aura Query tool
```

## Setup

You need: a free Neo4j Aura account, Node.js 20.6 or newer, and Go.

### 1. Create the database

1. Go to https://console.neo4j.io and sign up.
2. Create a new instance and select **AuraDB Free**.
3. Aura shows the password one time only. Download the credentials file.
4. Wait until the instance status is **Running**. This can take a few minutes.

### 2. Add your credentials

Copy the credentials file to the project root and rename it to `.env`. It must contain these lines:

```
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=...
```

`.env` is in `.gitignore`. Never commit it.

### 3. Load the data and run the report (Node.js)

```bash
cd node
npm install
npm run load      # creates constraints and loads data/graph.json
npm run report    # prints the four reports for the Neo4j job
npm run report -- sample-platform-go   # report for another job id
```

You can run `npm run load` again after you change `data/graph.json`. It uses `MERGE`, so it does not create duplicates.

### 4. Look at the graph in the Aura console

1. Open your instance in the Aura console and open the **Query** tool.
2. Paste the queries from `cypher/queries.cypher` one at a time.
3. For query 1, show the result as a graph. Take a screenshot and save it as `docs/graph.png` for this README.

### 5. Run the Go program

```bash
cd go
go mod tidy                    # downloads the Neo4j Go driver (v6)
set -a; source ../.env; set +a # loads the credentials into the shell
go run .                       # skill gap for the Neo4j job
go run . sample-backend-node   # skill gap for another job
```

### 6. Optional: the Aura CLI

The Aura CLI manages instances through the Aura API. The Aura Instances team at Neo4j builds this part of the product.

1. Download the latest release for your system from https://github.com/neo4j/aura-cli/releases.
2. In the Aura console, create API credentials (client ID and client secret).
3. Run:

```bash
aura-cli credential add --name "my-creds" --client-id "<ID>" --client-secret "<SECRET>"
aura-cli credential use --name "my-creds"
aura-cli instance list --output table
```

Use `aura-cli --help` to see the other commands.

## Notes about AuraDB Free

- You cannot pause a Free instance yourself. Aura pauses it automatically after 3 days without activity. You can resume it in the console.
- If a Free instance stays paused for more than 30 days, Aura deletes it.

## Cypher I used

- `MERGE` finds a node or relationship, or creates it if it does not exist. This makes the load safe to run again.
- `UNWIND` turns a list parameter into rows, so one query loads all jobs.
- Uniqueness constraints stop duplicates and give `MERGE` an index to use.
- `OPTIONAL MATCH` keeps a row when there is no match. The skill gap query uses it to find missing skills.
- `EXISTS { ... }` checks a pattern inside `WHERE`.
- Parameters (`$jobId`, `$me`) are sent apart from the query text. This is safer than string concatenation and lets Neo4j cache the query plan.

## What I learned

## What I learned

### Graph modeling
- I modeled the data as nodes (`Person`, `Skill`, `Company`, `Job`) and relationships (`HAS_SKILL`, `REQUIRES`, `POSTED`).
- Relationships can have properties. `level` on `HAS_SKILL` and `importance` on `REQUIRES` describe the connection itself.
- Shared `Skill` nodes make matching simple. A match is a `Skill` node that both a `Job` and a `Person` point to. In SQL, the same questions need join tables and several joins.

### Cypher
- `MERGE` finds a node or relationship, or creates it if it does not exist. Because of this, I can run the load again after I edit `graph.json`, and it does not create duplicates.
- `UNWIND` turns a list parameter into rows, so one query loads all jobs and their skills.
- Uniqueness constraints stop duplicate nodes and give `MERGE` an index to use.
- `OPTIONAL MATCH` keeps a row when there is no match. The skill-gap query uses it with `coalesce()` to show missing skills.
- Parameters (`$jobId`, `$me`) keep values out of the query text. This is safer than string concatenation, and Neo4j can reuse the query plan.

### Improving a query
- My first "learn next" query counted every job the same. Because of this, "nice to have" skills such as AWS were at the top.
- I added a variable to the `REQUIRES` relationship and used `sum()` with `CASE` on `r.importance`: 2 points for "must" and 1 point for "nice".
- Now Go and Kubernetes are at the top, and this matches the job ads better.

### Drivers
- **Node.js:** I used the official `neo4j-driver` with `executeQuery()`. The driver returns Neo4j `Integer` objects for numbers by default, so I set `disableLosslessIntegers` to get normal JavaScript numbers.
- **Go:** I used the official v6 driver with `neo4j.NewDriver` and `neo4j.ExecuteQuery`. I always set the database name in the query options.

### Aura and setup problems I solved
- You cannot pause AuraDB Free manually. It pauses automatically after 3 days without activity, and Aura deletes it after 30 days in the paused state.
- `go mod tidy` failed with "go.mod file not found", but the project had a `go.mod` file. The cause was an extra `go.mod` in my `$GOPATH` folder. Go ignores that folder as a module, and then it stops. I renamed the extra file, and the problem was solved.
- `source .env` failed because one value had a space and no quotes. The shell read the second word as a command. Node's `--env-file` reads the file in a different way, so only the Go step failed. I added quotes to fix it.
- The credentials stay in `.env`, and `.env` is in `.gitignore`.

### What I want to learn next
- Kubernetes: run the Go program in a container on a local cluster.
- Turn the Go program into a small HTTP API that returns the skill gap as JSON.

-
-
-

## Ideas for next steps

- Turn the Go program into a small HTTP API: `GET /jobs/{id}/gap` returns JSON.
- Add tests for the queries with a test database.
- Add `(:Person)-[:WORKED_AT]->(:Company)` and `(:Company)-[:USES]->(:Skill)` from my CV.
- Give "must" skills more weight than "nice" skills in the match score.


![Graph](docs/graph.png)