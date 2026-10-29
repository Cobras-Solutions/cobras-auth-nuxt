/**
 * Server-side auth plugin
 *
 * PERFORMANCE:
 * - In PUBLIC mode: Non-blocking, auth check happens client-side
 * - In INTERNAL mode: Blocks SSR only if globalMiddleware is enabled
 */
declare const _default: import("#imports").Plugin<{
    cobrasAuth: {
        user: any;
        isAuthenticated: any;
        isInternalUser: any;
        isAdmin: any;
        mode: any;
        checkAuth: () => Promise<void>;
        login: (redirect?: string) => void;
        logout: () => Promise<void>;
    };
}> & import("#imports").ObjectPlugin<{
    cobrasAuth: {
        user: any;
        isAuthenticated: any;
        isInternalUser: any;
        isAdmin: any;
        mode: any;
        checkAuth: () => Promise<void>;
        login: (redirect?: string) => void;
        logout: () => Promise<void>;
    };
}>;
export default _default;
