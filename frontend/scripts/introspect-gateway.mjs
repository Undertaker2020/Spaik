// Introspect the Hive federated supergraph and emit a clean SDL for codegen.
//
// We can't point codegen straight at the gateway URL: Hive advertises the
// built-in @deprecated directive on the DIRECTIVE_DEFINITION location, which
// graphql@16's parser rejects ("Unexpected Name DIRECTIVE_DEFINITION").
// Round-tripping introspection through buildClientSchema -> printSchema drops
// the built-in directives from the emitted SDL, sidestepping the bad location.
import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { getIntrospectionQuery, buildClientSchema, printSchema } from 'graphql';

const url = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:4002/graphql';
const out = new URL('../schema.gateway.graphql', import.meta.url);

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: getIntrospectionQuery() }),
}).catch((err) => {
  console.error(`Could not reach the gateway at ${url}: ${err.message}`);
  process.exit(1);
});

if (!res.ok) {
  console.error(`Introspection failed: ${res.status} ${res.statusText} (is the gateway running at ${url}?)`);
  process.exit(1);
}

const { data, errors } = await res.json();
if (errors?.length) {
  console.error('Introspection returned errors:', JSON.stringify(errors, null, 2));
  process.exit(1);
}

writeFileSync(out, printSchema(buildClientSchema(data)));
console.log(`Wrote federated SDL from ${url} -> schema.gateway.graphql`);
