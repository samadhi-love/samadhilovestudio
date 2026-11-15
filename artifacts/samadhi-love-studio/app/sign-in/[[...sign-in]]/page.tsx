"use client";
import { SignIn } from "@clerk/react";
import { useSearchParams } from "next/navigation";
import { safeStudioReturnPath } from "../../auth-return-path";
import "../../auth-pages.css";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const returnTo = safeStudioReturnPath(searchParams.get("return_to"));
  const signUpUrl = "/sign-up?return_to=" + encodeURIComponent(returnTo);
  return (
    <main className="studio-auth">
      <a className="brand" href="/"><img src="/favicon.svg" alt="" /><strong>SAMADHI LOVE</strong></a>
      <SignIn routing="path" path="/sign-in" signUpUrl={signUpUrl} forceRedirectUrl={returnTo} />
      <p className="studio-auth-note">New here? Creating an account is free, and you can keep listening without one. <a href="/community">Keep listening</a></p>
    </main>
  );
}
