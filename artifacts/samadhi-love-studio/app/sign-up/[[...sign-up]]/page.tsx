"use client";
import { SignUp } from "@clerk/react";
import "../../auth-pages.css";

export default function SignUpPage() {
  return (
    <main className="studio-auth">
      <a className="brand" href="/"><img src="/favicon.svg" alt="" /><strong>SAMADHI LOVE</strong></a>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" forceRedirectUrl="/creator" />
      <p className="studio-auth-note">One account for your private songs, recordings, videos and membership. <a href="/community">Keep listening</a></p>
    </main>
  );
}
