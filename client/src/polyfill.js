/**
 * Polyfills for browser compatibility
 * This file provides necessary polyfills for modules that expect Node.js APIs
 */

// Import all modules at the top
import { Buffer } from 'buffer';
import process from 'process';

// Apply polyfills
window.Buffer = window.Buffer || Buffer;
window.process = window.process || process;

console.log('Browser polyfills applied successfully'); 