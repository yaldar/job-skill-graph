// Prints the skill gap for one job. Usage: go run . [jobId]
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/neo4j/neo4j-go-driver/v6/neo4j"
)

const skillGapQuery = `
MATCH (j:Job {id: $jobId})-[r:REQUIRES]->(s:Skill)
OPTIONAL MATCH (:Person {name: $me})-[h:HAS_SKILL]->(s)
RETURN s.name AS skill, r.importance AS importance, coalesce(h.level, 'missing') AS myLevel
ORDER BY CASE myLevel WHEN 'missing' THEN 0 WHEN 'basic' THEN 1 ELSE 2 END, importance, skill
`

func main() {
	jobID := "neo4j-aura-instances"
	if len(os.Args) > 1 {
		jobID = os.Args[1]
	}

	// Same variable names as the Aura credentials file.
	uri, user, pass := os.Getenv("NEO4J_URI"), os.Getenv("NEO4J_USERNAME"), os.Getenv("NEO4J_PASSWORD")
	if uri == "" || user == "" || pass == "" {
		fmt.Fprintln(os.Stderr, "Missing NEO4J_URI, NEO4J_USERNAME or NEO4J_PASSWORD. Load the .env file first.")
		os.Exit(1)
	}
	database := os.Getenv("NEO4J_DATABASE")
	if database == "" {
		database = "neo4j"
	}

	ctx := context.Background()
	driver, err := neo4j.NewDriver(uri, neo4j.BasicAuth(user, pass, ""))
	if err != nil {
		fail(err)
	}
	defer driver.Close(ctx)

	if err := driver.VerifyConnectivity(ctx); err != nil {
		fail(err)
	}

	result, err := neo4j.ExecuteQuery(ctx, driver, skillGapQuery,
		map[string]any{"jobId": jobID, "me": "Yaldar"},
		neo4j.EagerResultTransformer,
		neo4j.ExecuteQueryWithDatabase(database))
	if err != nil {
		fail(err)
	}

	if len(result.Records) == 0 {
		fmt.Printf("No job with id %q. Check data/graph.json.\n", jobID)
		return
	}

	fmt.Printf("Skill gap for %s\n\n", jobID)
	fmt.Printf("%-20s %-10s %s\n", "SKILL", "IMPORTANCE", "MY LEVEL")
	for _, record := range result.Records {
		row := record.AsMap() // map[string]any with the RETURN names as keys
		fmt.Printf("%-20v %-10v %v\n", row["skill"], row["importance"], row["myLevel"])
	}
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, "Error:", err)
	os.Exit(1)
}
