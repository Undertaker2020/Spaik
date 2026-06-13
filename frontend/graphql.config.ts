import type {CodegenConfig} from "@graphql-codegen/cli";

const config: CodegenConfig = {
    // SDL of the federated supergraph (Hive gateway), produced by
    // `scripts/introspect-gateway.mjs` which runs before codegen. We can't point
    // codegen straight at the monolith (StreamModel there is only a @key stub
    // post-split) nor at the live gateway URL (its @deprecated declares the
    // DIRECTIVE_DEFINITION location, which graphql@16 can't parse).
    schema: './schema.gateway.graphql',
    documents: ['./src/graphql/**/*.graphql'],
    generates: {
        './src/graphql/generated/output.ts': {
            plugins: [
                'typescript',
                'typescript-operations',
                'typescript-react-apollo'
            ],
        }
    },
    ignoreNoDocuments: true
};

export default config;