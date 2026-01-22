import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] relative gap-8">
      <h1
        className="text-4xl font-bold text-white"
        style={{ fontFamily: 'var(--font-playfair), serif' }}>
        TaskifyMinutes
      </h1>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        redirectUrl="/meetings"
      />
    </div>
  );
}
