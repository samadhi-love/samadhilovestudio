"use client";
import { SignUp } from "@clerk/react";
import { useSearchParams } from "next/navigation";
import { safeStudioReturnPath } from "../../auth-return-path";
import "../../auth-pages.css";
import { AuthPortal } from "../../auth-portal";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const returnTo = safeStudioReturnPath(searchParams.get("return_to"));
  const signInUrl = "/sign-in?return_to=" + encodeURIComponent(returnTo);
  return (
    <AuthPortal mode="sign-up" note={<p className="studio-auth-note">One account for your private songs, recordings, videos and membership. <a href="/community">Keep listening</a></p>}>
      <SignUp routing="path" path="/sign-up" signInUrl={signInUrl} forceRedirectUrl={returnTo} />
    </AuthPortal>
  );
}
