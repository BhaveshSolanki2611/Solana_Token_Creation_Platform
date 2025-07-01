import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.process = require('process/browser');
 
// ... existing code ... 