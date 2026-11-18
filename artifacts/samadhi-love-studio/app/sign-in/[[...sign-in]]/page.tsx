"use client";
import { SignIn } from "@clerk/react";
import { useSearchParams } from "next/navigation";
import { safeStudioReturnPath } from "../../auth-return-path";
import "../../auth-pages.css";
import { AuthPortal } from "../../auth-portal";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const returnTo = safeStudioReturnPath(searchParams.get("return_to"));
  const signUpUrl = "/sign-up?return_to=" + encodeURIComponent(returnTo);
  return (
    <AuthPortal mode="sign-in" note={<p className="studio-auth-note">New here? Creating an account is free, and you can keep listening without one. <a href="/community">Keep listening</a></p>}>
      <SignIn routing="path" path="/sign-in" signUpUrl={signUpUrl} forceRedirectUrl={returnTo} />
    </AuthPortal>
  );
}
