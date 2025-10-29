import { SignUp } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
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
          />
          <div className="bg-muted relative hidden md:block">
            <img
              src="/opencavnas.jpg"
              alt="Open Canvas"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
