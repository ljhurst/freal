import { mount } from 'svelte';
import App from '@/App.svelte';
import '@/app.css';
import { createServices, SERVICES_KEY } from '@/lib/services';

const target = document.getElementById('app');
if (target === null) {
  throw new Error('missing #app element');
}

mount(App, { target, context: new Map([[SERVICES_KEY, createServices(window)]]) });
