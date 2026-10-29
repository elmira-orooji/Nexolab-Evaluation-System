import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseAst} from 'rolldown/parseAst';
import en from '../src/locales/en.js';

const files=fs.readdirSync('src').filter(file=>/\.(jsx|js)$/.test(file)&&!['i18n.js','BrandPage.jsx','brand-main.jsx'].includes(file));
files.push(...['input','select','text-field'].map(name=>'components/ui/'+name+'.tsx'));
let keys=0;
for(const file of files){
  const ast=parseAst(fs.readFileSync('src/'+file,'utf8'),{lang:file.endsWith('tsx')?'tsx':file.endsWith('jsx')?'jsx':'js'},file);
  function visit(node){
    if(!node||typeof node!=='object')return;
    if(node.type==='CallExpression'&&node.callee?.name==='t'&&typeof node.arguments[0]?.value==='string'){
      const key=node.arguments[0].value;
      assert.ok(Object.hasOwn(en,key)||Object.hasOwn(en,key.trim()),'Missing English translation: '+key);
      keys++;
    }
    for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  }
  visit(ast);
}
console.log(`Translation coverage: ${keys} interface strings checked.`);
