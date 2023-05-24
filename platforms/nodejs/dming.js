require('systemjs');
require('./dming/systemjs.name.js');
const os = require('os');

globalThis.os = os;
const XMLHttpRequest = require('xhr2');

globalThis.XMLHttpRequest = XMLHttpRequest;
globalThis.require = require;
const jsdom = require('jsdom');

const {
    JSDOM,
} = jsdom;
const dom = new JSDOM();
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLImageElement = dom.window.HTMLImageElement;
globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement;
require('./dming/fs-utils');
globalThis.NodePath = require('path');
System.addImportMap(require('./src/import-map.json'));

System.import('./index.js').catch((err) => {
    console.error(err);
});
