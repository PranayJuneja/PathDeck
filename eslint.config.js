import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
export default [
    { ignores: ['dist/**', 'node_modules/**', 'research/**', 'public/**', 'tests/artifacts/**'] },
    js.configs.recommended,
    { files: ['**/*.{js,mjs,jsx}'], languageOptions: { globals: { ...globals.node, ...globals.browser }, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } } }, rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }] } },
    { files: ['src/**/*.{js,jsx}'], plugins: { 'react-hooks': hooks, 'react-refresh': refresh }, rules: { ...hooks.configs.recommended.rules, 'react-refresh/only-export-components': ['warn', { allowExportNames: ['useAuth'] }] } },
];
