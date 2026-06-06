import { RemoteGraphQLDataSource } from '@apollo/gateway';

// Bridges auth across the gateway:
//  - mobile (JWT): forwards the Authorization header to subgraphs
//  - web (express-session): forwards the request Cookie to subgraphs AND relays
//    any Set-Cookie the subgraphs return back to the browser, so cookie-based
//    login works through the gateway.
export class AuthForwardingDataSource extends RemoteGraphQLDataSource {
    public willSendRequest({ request, context }: any) {
        const authorization = context?.req?.headers?.authorization;
        if (authorization) {
            request.http?.headers.set('authorization', authorization);
        }

        const cookie = context?.req?.headers?.cookie;
        if (cookie) {
            request.http?.headers.set('cookie', cookie);
        }
    }

    public async didReceiveResponse({ response, context }: any) {
        const res = context?.res;
        const headers = response?.http?.headers;

        if (res && headers) {
            const setCookie =
                typeof headers.raw === 'function'
                    ? headers.raw()['set-cookie']
                    : headers.get('set-cookie');

            if (setCookie) {
                const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
                for (const c of cookies) {
                    res.append('Set-Cookie', c);
                }
            }
        }

        return response;
    }
}
