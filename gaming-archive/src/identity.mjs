/** Resolve the Sony-authenticated account, not a user-selected profile. */
export class PsnIdentityError extends Error {
 constructor(code){super(code);this.code=code;this.name='PsnIdentityError';}
}
const endpoints=[
 'https://m.np.playstation.com/api/userProfile/v1/internal/users/me/profiles',
 'https://us-prof.np.community.playstation.net/userProfile/v1/users/me/profile2?fields=accountId,onlineId'
];
export function normalizeSonyIdentity(data){
 // Accept only a top-level authenticated profile result. Never accept an arbitrary
 // selected/friend profile, nested members or the literal "me" identifier.
 const p=data?.profile ?? data;
 const id=p?.accountId;
 if (!((typeof id==='string' && /^[0-9]{8,24}$/.test(id)) ||
      (typeof id==='number' && Number.isSafeInteger(id) && id>=10000000)))
   throw new PsnIdentityError('PSN_IDENTITY_UNVERIFIED');
 const onlineId=typeof p.onlineId==='string'&&p.onlineId.length<=32?p.onlineId:'';
 return {accountId:String(id),onlineId};
}
export async function resolveSonyIdentity({accessToken,fetchImpl=fetch}){
 if(!accessToken)throw new PsnIdentityError('PSN_IDENTITY_UNVERIFIED');
 for(const url of endpoints){
  let res;try{res=await fetchImpl(url,{method:'GET',headers:{Authorization:`Bearer ${accessToken}`,Accept:'application/json'},signal:AbortSignal.timeout(16000),cache:'no-store'});}catch{continue}
  if(!res.ok)continue;
  try{return normalizeSonyIdentity(await res.json())}catch{continue}
 }
 throw new PsnIdentityError('PSN_IDENTITY_UNVERIFIED');
}
