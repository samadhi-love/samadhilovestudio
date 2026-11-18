"use client";
import { SignUp } from "@clerk/react";
import {brand} from "../../brand";
import { useSearchParams } from "next/navigation";
import { safeStudioReturnPath } from "../../auth-return-path";
import "../../auth-pages.css";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const returnTo = safeStudioReturnPath(searchParams.get("return_to"));
  const signInUrl = "/sign-in?return_to=" + encodeURIComponent(returnTo);
  return (
    <main className="studio-auth">
      <a className="brand" href="/"><img src="/favicon.svg" alt="" /><strong>{brand.name}</strong></a>
      <SignUp routing="path" path="/sign-up" signInUrl={signInUrl} forceRedirectUrl={returnTo} />
      <p className="studio-auth-note">One account for your private songs, recordings, videos and membership. <a href="/community">Keep listening</a></p>
    </main>
  );
}
