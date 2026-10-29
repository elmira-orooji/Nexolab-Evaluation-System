import assert from 'node:assert/strict';
import {preparePhoto} from '../src/profile-photo.js';
let closed = 0;
let draw;
const bitmap = {width:800, height:400, close:()=>closed++};
globalThis.createImageBitmap = async (file, options) => {
  assert.equal(file.type,'image/jpeg');
  assert.equal(options.imageOrientation,'from-image');
  return bitmap;
};
globalThis.document = {createElement:()=>({getContext:()=>({drawImage:(...args)=>{draw=args;}}), toDataURL:()=>'data:image/png;base64,cG5n'})};
// A CSP-blocked object URL must never be required by this path.
URL.createObjectURL = ()=>{throw new Error('blob: blocked by CSP');};
assert.equal(await preparePhoto({type:'image/jpeg',size:100}), 'cG5n');
assert.deepEqual(draw.slice(1),[200,0,400,400,0,0,192,192]);
assert.equal(closed,1);
await assert.rejects(preparePhoto({type:'image/svg+xml',size:100}), /PNG/);
await assert.rejects(preparePhoto({type:'image/jpeg',size:6*1024*1024}), /۵/);
globalThis.createImageBitmap = async ()=>{throw new Error('The source image cannot be decoded.');};
await assert.rejects(preparePhoto({type:'image/jpeg',size:100}), /تصویر باز نمی‌شود/);
console.log('Photo decoding without blob URLs, center crop, cleanup and invalid-file errors passed.');
