// graphql-ws v6 exposes server handlers via the "./use/ws" export subpath, which
// classic CommonJS moduleResolution can't map to dist/. Re-export the types from
// the concrete dist path so the import in main.ts type-checks.
declare module 'graphql-ws/use/ws' {
    export * from 'graphql-ws/dist/use/ws';
}
