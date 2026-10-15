import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSonyIdentity, resolveSonyIdentity} from '../src/identity.mjs';

const unverified={code:'PSN_IDENTITY_UNVERIFIED'};
test('mantém ID decimal como string sem perder dígitos',()=>{
 const id='12345678901234567890';
 assert.equal(normalizeSonyIdentity({profile:{accountId:id,onlineId:'player'}}).accountId,id);
});
test('aceita número inteiro seguro por compatibilidade',()=>{
 assert.deepEqual(normalizeSonyIdentity({accountId:123456789}),{accountId:'123456789',onlineId:''});
});
test('rejeita números Sony não seguros, que podem ser arredondados',()=>{
 assert.throws(()=>normalizeSonyIdentity({accountId:123456789012345678}),unverified);
});
test('rejeita tipos, comprimentos e formatos inválidos',()=>{
 for(const id of [undefined,null,'123','1e+20',{},123.5,true,'1234abc567'])
   assert.throws(()=>normalizeSonyIdentity({accountId:id}),unverified);
});
test('não confunde perfil de amigo com dono autenticado',()=>{
 assert.throws(()=>normalizeSonyIdentity({friends:[{accountId:'123456789012345'}]}),unverified);
});
test('descarta onlineId excessivo mas preserva identidade válida',()=>{
 assert.deepEqual(normalizeSonyIdentity({accountId:'1234567890123',onlineId:'x'.repeat(33)}),
 {accountId:'1234567890123',onlineId:''});
});
test('primeiro endpoint funciona com bearer e no-store',async()=>{
 let calls=0;
 const actual=await resolveSonyIdentity({accessToken:'synthetic',fetchImpl:async(url,options)=>{
   calls++;
   assert.equal(options.headers.Authorization,'Bearer synthetic');
   assert.equal(options.cache,'no-store');
   assert.equal(options.method,'GET');
   return {ok:true,json:async()=>({profile:{accountId:'9876543210123'}})};
 }});
 assert.equal(calls,1);
 assert.equal(actual.accountId,'9876543210123');
});
test('falha no primeiro endpoint ativa fallback',async()=>{
 let calls=0;
 const actual=await resolveSonyIdentity({accessToken:'synthetic',fetchImpl:async()=>{
   calls++;
   return calls===1 ? {ok:false} : {ok:true,json:async()=>({accountId:'1234567898765'})};
 }});
 assert.equal(calls,2);
 assert.equal(actual.accountId,'1234567898765');
});
test('falhas e respostas malformadas nunca fabricam conta',async()=>{
 let calls=0;
 await assert.rejects(()=>resolveSonyIdentity({accessToken:'synthetic',fetchImpl:async()=>{
   calls++;
   return calls===1
     ? {ok:true,json:async()=>({friends:[{accountId:'1234567890123'}]})}
     : {ok:true,json:async()=>({accountId:123456789012345678})};
 }}),unverified);
 assert.equal(calls,2);
});
test('ausência de token não inicia requisição',async()=>{
 await assert.rejects(()=>resolveSonyIdentity({accessToken:'',fetchImpl:async()=>{
  throw Error('rede não deveria ser chamada');
 }}),unverified);
});
