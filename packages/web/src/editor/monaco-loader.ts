import { loader } from '@monaco-editor/react';

// Serve Monaco from this app's own static assets rather than relying on a CDN.
loader.config({ paths: { vs: '/monaco/vs' } });
