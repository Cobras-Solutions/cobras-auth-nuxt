import type { AuthMode } from '../types.js';
export interface UseCobrasModeReturn {
    /** Current authentication mode */
    mode: AuthMode;
    /** Whether running in internal (SSO) mode */
    isInternalMode: boolean;
    /** Whether running in public mode */
    isPublicMode: boolean;
    /** Whether current user should see internal-only features */
    showInternalFeatures: boolean;
    /** Whether current user should see admin-only features */
    showAdminFeatures: boolean;
    /** Whether dev tools should be available */
    devToolsEnabled: boolean;
}
/**
 * Composable for checking the current auth mode and feature visibility
 */
export declare function useCobrasMode(): UseCobrasModeReturn;
