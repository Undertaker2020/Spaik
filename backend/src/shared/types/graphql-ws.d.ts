// graphql-ws v6 exposes its server handlers via the "./use/ws" export subpath.
// Classic CommonJS moduleResolution doesn't honour package "exports" maps, so it
// can't find the types for `graphql-ws/use/ws` even though Node resolves the
// runtime import fine. Re-export the types from the concrete dist path (which is
// resolvable by file) so the import in main.ts type-checks.
declare module 'graphql-ws/use/ws' {
    export * from 'graphql-ws/dist/use/ws';
}
