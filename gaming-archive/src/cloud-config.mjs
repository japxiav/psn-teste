/* Endpoint pÃºblico de configuraÃ§Ã£o, sem segredos privados. As permissÃµes dependem de Supabase RLS. */
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='GET'){res.status(405).json({error:'METHOD_NOT_ALLOWED'});return}
 if(process.env.GA_CLOUD_READY!=='true'){res.status(200).json({configured:false,reason:'ACCOUNT_ISOLATION_PENDING'});return}
 const url=String(process.env.GA_SUPABASE_URL||''),key=String(process.env.GA_SUPABASE_ANON_KEY||'');
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(url)||key.length<15){res.status(200).json({configured:false});return}
 res.status(200).json({configured:true,url:url.replace(/\/$/,''),key});
}
