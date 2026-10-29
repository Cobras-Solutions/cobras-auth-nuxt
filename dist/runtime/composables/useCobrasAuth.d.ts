import { type Ref, type ComputedRef } from '#imports';
import type { CobrasUser, CobrasAuthState } from '../types.js';
export interface UseCobrasAuthReturn {
    /** Current authenticated user */
    user: Ref<CobrasUser | null>;
    /** Auth state object with loading/error states */
    state: Ref<CobrasAuthState>;
    /** Whether user is authenticated */
    isAuthenticated: ComputedRef<boolean>;
    /** Whether user is an internal team member (authenticated in any mode) */
    isInternalUser: ComputedRef<boolean>;
    /** Whether user has admin role */
    isAdmin: ComputedRef<boolean>;
    /** Current auth mode */
    mode: 'internal' | 'public';
    /** Check/refresh authentication status */
    checkAuth: () => Promise<void>;
    /** Redirect to login */
    login: (redirect?: string) => void;
    /** Logout and clear session */
    logout: () => Promise<void>;
    /** Verify user has access to current site */
    verifySiteAccess: () => Promise<boolean>;
}
export declare function useCobrasAuth(): UseCobrasAuthReturn;
