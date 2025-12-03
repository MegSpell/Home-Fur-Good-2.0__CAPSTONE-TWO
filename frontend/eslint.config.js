// ---------------------------------------------
// ESLint Configuration for Your React Project
// ---------------------------------------------
//
// ESLint helps catch bugs, formatting mistakes,
// unused variables, and bad patterns in your code.
// This config was auto-created by Vite when you
// started the project.
//
// Below are comments explaining every section.
//

// Import the base ESLint JavaScript rules
import js from "@eslint/js";

// Collection of common browser globals (window, document, etc)
import globals from "globals";

// ESLint plugin that enforces correct usage of React hooks
import reactHooks from "eslint-plugin-react-hooks";

// Plugin used by Vite to give fast-refresh errors/warnings
import reactRefresh from "eslint-plugin-react-refresh";

// Helper functions from the new flat ESLint config system
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Tell ESLint to completely ignore the "dist" folder
  // (This folder is auto-generated during build and shouldn't be linted)
  globalIgnores(["dist"]),

  {
    // Apply ESLint to any JS/JSX file in the project
    files: ["**/*.{js,jsx}"],

    // Extend from several recommended rule sets
    extends: [
      js.configs.recommended,            // Basic JavaScript best practices
      reactHooks.configs.flat.recommended, // Rules for correct React hook usage
      reactRefresh.configs.vite,           // Rules to help Vite's React refresh system
    ],

    // Configure how ESLint understands your code
    languageOptions: {
      ecmaVersion: 2020,       // Use modern JavaScript
      globals: globals.browser, // Allow browser globals (window, document, etc)
      parserOptions: {
        ecmaVersion: "latest",   // Parse newest JS features
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        sourceType: "module",    // Use ES modules (`import` / `export`)
      },
    },

    // Custom rules (feel free to tweak)
    rules: {
      // Error on unused variables unless they start with uppercase or underscore.
      // This helps ignore things like React imports that Vite handles automatically.
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
]);

