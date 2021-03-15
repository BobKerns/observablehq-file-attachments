/**
 * Declarations of the VERSION module, which is generated on the fly.
 * @module
 */

/**
 * A module generated by the rollup script to inject build version information.
 */
declare module 'VERSION' {
    /**
     * Format of the VERSION export describing the module version.
     */
    export type ModuleVersionInfo = {
        /**
         * The semantic version string for the package.
         */
        version: string;
        /**
         * Information obtained from git.
         */
        git: {
            /**
             * The commit ID that was built.
             */
            revision: string;
        };
        /**
         * The date of the build.
         */
        date: Date;
    };
    /**
     * The version information, injected from `package.json` and elsewhere by the build process.
     */
    export const VERSION: ModuleVersionInfo;
}