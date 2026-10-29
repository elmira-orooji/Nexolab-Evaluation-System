# Interface languages

The sign-in page, header language switch and Connection & settings page share the same Persian/English preference. Changes apply immediately, preserve mounted forms and are saved in browser storage. Existing `nexolab-login-language` preferences remain compatible.

`src/i18n.js` exposes `t(source, values)`, `locale()`, `direction()` and `useLanguage()`. Persian source copy is the default; English copy is maintained in `src/locales/en.js`. Use numbered placeholders such as `{0}` for dynamic values. Do not concatenate user input into translation keys or translate questions, answers, documents, reviewer notes or technical identifiers.

Use locale-aware number/date formatting and logical CSS properties. Keep technical fields explicitly LTR and let application navigation follow the selected language. Light/dark mode is independent of language.

From `frontend`, check translation coverage and rendering with:

```sh
node scripts/check-locales.mjs
node scripts/check-language.mjs
npm run build
```

The render check exercises both languages, preference persistence, RTL/LTR, dates/numbers, template interpolation and preservation of Persian suite data in the English interface. Downloadable run artifacts retain the server's original data and report format.
