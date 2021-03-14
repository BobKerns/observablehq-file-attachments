/**
 * Declarations of modules generated on the fly.
 * @module
 */

declare module 'VERSION' {
    export type ModuleVersionInfo = {
        version: string;
        git: {
            revision: string;
            repository: string;
            author: string;
            date: Date;
        };
        date: Date;
        author: string;
    };
    /**
     * The version information, injected from `package.json` and elsewhere by the build process.
     */
    export const VERSION: ModuleVersionInfo;
}