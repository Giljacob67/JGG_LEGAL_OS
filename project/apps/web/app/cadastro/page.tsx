import { SignUp } from "@clerk/nextjs";

export default function CadastroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-semibold">JGG GROUP</h1>
          <p className="text-sm text-muted-foreground mt-1">Legal OS · Novo acesso</p>
        </div>
        <SignUp routing="hash" />
      </div>
    </div>
  );
}