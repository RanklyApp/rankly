"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { signInOwner, type LoginState } from "@/app/acceder/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: LoginState = {};

export function OwnerLoginForm() {
  const [state, action, pending] = useActionState(signInOwner, initial);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
