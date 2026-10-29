import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';

const saved=new Map();
const attributes={};
globalThis.localStorage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
globalThis.document={documentElement:attributes};
globalThis.window={addEventListener:()=>{}};
const server=await createServer({server:{middlewareMode:true},ssr:{external:['react','react-dom','react-dom/server','react/jsx-runtime']},appType:'custom'});
try {
  const {t,setLanguage,locale,direction}=await server.ssrLoadModule('/src/i18n.js');
  const {default:App}=await server.ssrLoadModule('/src/App.jsx');
  const {default:Dashboard}=await server.ssrLoadModule('/src/Dashboard.jsx');
  for(const language of ['en','fa','en']){
    setLanguage(language);
    assert.equal(attributes.lang,language);
    assert.equal(attributes.dir,language==='en'?'ltr':'rtl');
    assert.equal(direction(),attributes.dir);
    assert.equal(saved.get('nexolab-login-language'),language);
    assert.equal(t('داشبورد'),language==='en'?'Dashboard':'داشبورد');
    const html=renderToStaticMarkup(createElement(App));
    assert.ok(html.includes(language==='en'?'Human review':'ارزیابی دستی'));
    assert.ok(html.includes(language==='en'?'Compare runs':'مقایسهٔ اجراها'));
    assert.ok(html.includes(language==='en'?'Test suites':'مجموعه‌های آزمون'));
  }
  const data='محتوای فارسی مجموعه نباید ترجمه شود';
  const suite={id:data,cases:[],documents:[]};
  const html=renderToStaticMarkup(createElement(Dashboard,{suite,report:{suite,results:[]},run:{started_at:'2026-10-29T10:00:00Z',state:'completed'},reviews:{}}));
  assert.ok(html.includes(data),'User content must retain its original language');
  assert.ok(html.includes('Request outcomes'));
  assert.equal(new Intl.NumberFormat(locale()).format(1234),'1,234');
  assert.equal(t('مجموعهٔ {0} ذخیره و انتخاب شد.',[data]),`Suite ${data} was saved and selected.`);
  setLanguage('fa');
  assert.equal(new Intl.NumberFormat(locale()).format(12),'۱۲');
  console.log('Language switching, persistence, page rendering, interpolation and data preservation passed.');
} finally { await server.close(); }
