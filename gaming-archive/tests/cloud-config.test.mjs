import test from 'node:test';
import assert from 'node:assert/strict';
import cloudConfigHandler from '../src/cloud-config.mjs';

const KEYS=['GA_CLOUD_READY','GA_SUPABASE_URL','GA_SUPABASE_ANON_KEY'];
function invoke(overrides={},method='GET') {
  const backup=Object.fromEntries(KEYS.map(k=>[k,process.env[k]]));
  for (const k of KEYS) delete process.env[k];
  Object.assign(process.env,overrides);
  const res={
    headers:{}, statusCode:200,body:null,
    setHeader(k,v){this.headers[k]=v;return this},
    status(n){this.statusCode=n;return this},
    json(v){this.body=v;return this}
  };
  try { cloudConfigHandler({method},res);return res; }
  finally { for(const k of KEYS){delete process.env[k];if(backup[k]!==undefined)process.env[k]=backup[k];} }
}
const publishable={
 GA_SUPABASE_URL:'https://synthetic-project.supabase.co/',
 GA_SUPABASE_ANON_KEY:'sb_publishable_for_tests_only_not_a_real_key'
};
test('cloud desligada por padrão, mesmo com chaves publicáveis configuradas',()=>{
 const r=invoke(publishable);
 assert.equal(r.statusCode,200);
 assert.deepEqual(r.body,{configured:false,reason:'ACCOUNT_ISOLATION_PENDING'});
 assert.equal(r.headers['Cache-Control'],'no-store');
});
test('GET sem configuração não libera Cloud por acidente',()=>{
 const r=invoke({GA_CLOUD_READY:'true'});
 assert.deepEqual(r.body,{configured:false});
});
test('rejeita URL insegura e URL não-Supabase',()=>{
 for(const url of ['http://synthetic-project.supabase.co','https://attacker.example','https://synthetic-project.supabase.co.evil.test']){
   const r=invoke({...publishable,GA_CLOUD_READY:'true',GA_SUPABASE_URL:url});
   assert.deepEqual(r.body,{configured:false});
 }
});
test('nuvem exige flag exata true e chave pública não vazia',()=>{
 for(const flag of ['TRUE','1','yes','false']){
  assert.equal(invoke({...publishable,GA_CLOUD_READY:flag}).body.configured,false);
 }
 assert.equal(invoke({...publishable,GA_CLOUD_READY:'true',GA_SUPABASE_ANON_KEY:'short'}).body.configured,false);
});
test('flag explícita e configuração pública válida habilitam resposta GET',()=>{
 const r=invoke({...publishable,GA_CLOUD_READY:'true'});
 assert.deepEqual(r.body,{configured:true,url:'https://synthetic-project.supabase.co',key:publishable.GA_SUPABASE_ANON_KEY});
 assert.equal(r.statusCode,200);
});
test('POST é rejeitado, sem dados de configuração',()=>{
 const r=invoke({...publishable,GA_CLOUD_READY:'true'},'POST');
 assert.equal(r.statusCode,405);
 assert.deepEqual(r.body,{error:'METHOD_NOT_ALLOWED'});
});
