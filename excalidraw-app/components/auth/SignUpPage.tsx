import { SignUp } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { FieldDescription } from "../ui/field";

export function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <ShadcnSignUp />
    </div>
  );
}

function ShadcnSignUp() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 border-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <SignUp
            appearance={{
              theme: shadcn,
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
                formButtonPrimary: "bg-primary hover:bg-primary/90",
              },
              layout: {
                logoImageUrl:
                  "https://www.opencanvas.studio/opencanvas-logo.png",
              },
            }}
            signInUrl="/sign-in"
            routing="path"
            path="/sign-up"
            afterSignInUrl="/"
            afterSignUpUrl="/"
          />
          <div className="bg-muted relative hidden md:block">
            <svg
              id="opencanvas-logo"
              data-name="opencanvas-logo"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="-250 0 764.71 258"
              fill="currentColor"
              style={{ width: "auto", height: "auto" }}
            >
              <path d="M106.74,79.58s-9.67,2.65-17.18,8.97c-18.62,15.67-20.49,55.26-4.48,75.78,18.77,24.05,51.89,6.79,69.74,23.18,13.04,11.97,13.08,47.48.17,59.42-12.62,11.67-47,11.45-58.67-1.82-14.64-16.64-.81-45.34-18.51-65.39-19.76-22.39-58.27-2.6-72.51-26.72-7.9-13.38-7.51-43.74,4.85-54.54,16.04-14.01,45.14-1.5,64.51-17.58,23.36-19.39,4.83-56.53,24.89-71.64,14.12-10.64,38.48-13.29,53.73-.17,17.47,15.03,16.59,44.98,3.92,58.37-6.12,6.47-14.83,8.9-17.74,9.71-13.01,3.62-19.6-1.16-32.72,2.44Z" />
            </svg>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link
          to="/legal/terms"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          to="/legal/privacy"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
