import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.js';

createApp(App).mount('#app');
