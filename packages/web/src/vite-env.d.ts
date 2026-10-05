/// <reference types="vite/client" />

// Fontsource packages resolve to CSS and ship no types; declare them so `tsc` is happy.
declare module '@fontsource/*';
