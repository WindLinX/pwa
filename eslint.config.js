import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
export default [js.configs.recommended, ...tseslint.configs.recommended, ...pluginVue.configs['flat/recommended'], { files: ['src/**/*.vue'], languageOptions: { parser: vueParser, parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] }, globals: { ...globals.browser } }, rules: { 'vue/multi-word-component-names': 'off', 'vue/max-attributes-per-line': 'off', 'vue/singleline-html-element-content-newline': 'off', 'vue/attributes-order': 'off', 'vue/html-closing-bracket-spacing': 'off', 'vue/html-self-closing': 'off', '@typescript-eslint/no-explicit-any': 'error' } }, { files: ['src/**/*.ts'], languageOptions: { globals: { ...globals.browser } }, rules: { '@typescript-eslint/no-explicit-any': 'error' } }, { ignores: ['dist/**', 'node_modules/**'] }]
