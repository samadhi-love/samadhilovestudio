import { studioAccess } from "../studio-access";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  const access = await studioAccess();
  return <main className="member-shell member-login"><a className="brand" href="/community"><img src="/favicon.svg" alt=""/><strong>SAMADHI LOVE</strong></a><section className="member-login-card"><p className="eyebrow">MEMBER LOGIN</p><h1>Welcome to your<br/>creative home.</h1><p>One account for your private songs, recordings, videos and membership.</p>{access.id ? <a className="primary" href="/creator">Continue to my studio</a> : <a className="primary" href="/sign-in">Sign in</a>}<p className="muted">Sign in with email or a supported social account.</p><div className="actions"><a href="/sign-up">Create a free member account</a><a href="/plans">Compare plans</a></div><a href="/community">Keep listening without an account</a></section></main>;
}
