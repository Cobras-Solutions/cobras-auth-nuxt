import { type Ref, type ComputedRef } from '#imports';
export interface DevToolsState {
    /** Whether dev tools panel is open */
    isOpen: boolean;
    /** Feature flags that can be toggled */
    featureFlags: Record<string, boolean>;
    /** Debug mode enabled */
    debugMode: boolean;
    /** Show performance metrics */
    showMetrics: boolean;
}
export interface UseCobrasDevToolsReturn {
    /** Dev tools state */
    state: Ref<DevToolsState>;
    /** Whether dev tools are available (user authenticated + enabled in config) */
    isAvailable: ComputedRef<boolean>;
    /** Toggle dev tools panel */
    toggle: () => void;
    /** Open dev tools panel */
    open: () => void;
    /** Close dev tools panel */
    close: () => void;
    /** Set a feature flag */
    setFeatureFlag: (key: string, value: boolean) => void;
    /** Get a feature flag value */
    getFeatureFlag: (key: string) => boolean;
    /** Toggle debug mode */
    toggleDebugMode: () => void;
    /** Toggle performance metrics */
    toggleMetrics: () => void;
}
export declare function useCobrasDevTools(): UseCobrasDevToolsReturn;
