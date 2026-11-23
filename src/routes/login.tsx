import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { actions } from "@/lib/store";
export const Route = createFileRoute("/login")({ component: Login });
function Login() {
  const nav = useNavigate();
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      if (register)
        await actions.register(
          String(f.get("name")),
          String(f.get("email")),
          String(f.get("password")),
        );
      else await actions.login(String(f.get("email")), String(f.get("password")));
      nav({ to: "/products" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form className="panel space-y-4 p-6" onSubmit={submit}>
        <h1 className="text-2xl font-bold">{register ? "Create your account" : "Sign in"}</h1>
        {register && (
          <input className="field" name="name" placeholder="Full name" required maxLength={120} />
        )}
        <input className="field" name="email" type="email" placeholder="Email" required />
        <input
          className="field"
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={register ? 10 : 1}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <button className="btn w-full" disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
        </button>
        <button
          type="button"
          className="w-full text-sm text-primary"
          onClick={() => setRegister(!register)}
        >
          {register ? "Already have an account? Sign in" : "New customer? Create an account"}
        </button>
      </form>
    </div>
  );
}
