import { RemoteGraphQLDataSource } from '@apollo/gateway';

// Forwards the incoming Authorization header to every subgraph so they can
// validate the JWT access token (stateless auth, shared JWT_SECRET).
export class AuthForwardingDataSource extends RemoteGraphQLDataSource {
    public willSendRequest({ request, context }: any) {
        const authorization = context?.req?.headers?.authorization;
        if (authorization) {
            request.http?.headers.set('authorization', authorization);
        }
    }
}
