/**
 * @module ModuleLoader
 * 
 * This module provides utility methods for dynamically loading TypeScript modules from files and directories.
 * It is designed for use in systems where dynamic extensibility is required, such as plugin-based architectures.
 * 
 * Key Features:
 * - **Module Loading**: Dynamically imports a single TypeScript module by file path.
 * - **Directory Loading**: Scans a directory for `.ts` files, imports them, and validates them using a provided validator function.
 * 
 * Usage:
 * Use the `ModuleLoader` class to load modules dynamically from specified file paths or directories.
 * The `validator` function helps ensure that only modules meeting specific criteria are included.
 * 
 * @example - Loading a Single Module:
 * ```typescript
 * import { ModuleLoader } from './Utils/ModuleLoader';
 * const module = await ModuleLoader.loadModule<MyModuleType>('./path/to/module.ts');
 * if (module) {
 *     console.log('Module loaded:', module);
 * }
 * ```
 * 
 * @example - Loading Modules from a Directory:
 * ```typescript
 * import { ModuleLoader } from './Utils/ModuleLoader';
 * import { Validators } from './Utils/Validators';
 * 
 * const modules = await ModuleLoader.loadModulesFromDirectory<MyModuleType>(
 *     './path/to/directory',
 *     Validators.isCommand
 * );
 * console.log('Loaded modules:', modules);
 * ```
 * 
 * Structure:
 * - **Static Methods**:
 *   - `loadModule<T>(path: string): Promise<T | null>`: Imports a module from the given file path and returns its default export if available.
 *   - `loadModulesFromDirectory<T>(directory: string, validator: (module: unknown) => boolean): Promise<T[]>`:
 *     Scans a directory for `.ts` files, loads them, and validates them using the provided validator function.
 * 
 * Implementation Details:
 * - File Path Normalization: Handles platform-specific path formats, adding the `file://` scheme for compatibility.
 * - Error Handling: Logs errors for failed module loads without crashing the application.
 * - Filtering by Validator: Ensures that only modules meeting validation criteria are returned.
 * 
 * Dependencies:
 * - Deno Standard Library: Uses `Deno.readDir` for directory scanning and `import()` for dynamic module loading.
 * 
 * Error Handling:
 * Errors during loading are logged with context to facilitate debugging. Failed modules are skipped.
 */

export class ModuleLoader {
  static async loadModule<T>(path: string): Promise<T | null> {
    try {
      // Add 'file://' scheme for local files if not present
      const normalizedPath = path.startsWith('file://') ? path : `file://${path}`;
      
      // Normalize slashes for the OS
      const formattedPath = Deno.build.os === "windows" 
        ? normalizedPath.replace(/\\/g, '/') // Convert Windows-style backslashes
        : normalizedPath;

      const module = await import(formattedPath);
      return module.default as T;
    } catch (error) {
      console.error(`Failed to load module at ${path}`, error as Error);
      return null;
    }
  }

  static async loadModulesFromDirectory<T>(
    directory: string,
    validator: (module: unknown) => boolean
  ): Promise<T[]> {
    const modules: T[] = [];

    try {
      for await (const entry of Deno.readDir(directory)) {
        if (entry.isFile && entry.name.endsWith('.ts')) {
          const modulePath = `${directory}/${entry.name}`;
          const module = await this.loadModule<T>(modulePath);
          
          if (module && validator(module)) {
            modules.push(module);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load modules from ${directory}`, error as Error);
    }

    return modules;
  }
}
