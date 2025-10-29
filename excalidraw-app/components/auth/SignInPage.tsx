import { SignIn } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
import { Card, CardContent } from "../ui/card";

export function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="flex flex-col gap-6 p-6 md:p-8">
              <div className="flex flex-col items-center gap-2 text-center">
                <a
                  href="/"
                  className="flex items-center gap-2 self-center font-medium"
                >
                  <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 256 256"
                      className="size-4"
                    >
                      <rect width="256" height="256" fill="none" />
                      <line
                        x1="208"
                        y1="128"
                        x2="128"
                        y2="208"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="32"
                      />
                      <line
                        x1="192"
                        y1="40"
                        x2="40"
                        y2="192"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="32"
                      />
                    </svg>
                  </div>
                  Open Canvas
                </a>
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Sign in to your Open Canvas account
                </p>
              </div>
              <SignIn
                appearance={{
                  theme: shadcn,
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none bg-transparent",
                    formButtonPrimary: "bg-primary hover:bg-primary/90",
                  },
                }}
                signUpUrl="/sign-up"
                routing="path"
                path="/sign-in"
              />
            </div>
            <div className="relative hidden bg-muted md:block">
              <img
                src="/og-image-3.png"
                alt="Open Canvas"
                className="absolute inset-0 size-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
