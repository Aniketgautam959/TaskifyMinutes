import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="dotted-bg flex min-h-screen w-full flex-col items-center justify-center bg-background relative gap-8 px-4">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        TaskifyMinutes
      </h1>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/meetings"
      />
    </div>
  );
}
