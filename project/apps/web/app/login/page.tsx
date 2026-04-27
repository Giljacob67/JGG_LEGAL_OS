import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-semibold">JGG GROUP</h1>
          <p className="text-sm text-muted-foreground mt-1">Legal OS · Acesso restrito</p>
        </div>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}