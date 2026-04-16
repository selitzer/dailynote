import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (isSubmitting) return;

  setIsSubmitting(true);

  if (isSignup) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error.message);
      setIsSubmitting(false);
      return;
    }

    console.log("Signup successful");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    setIsSubmitting(false);
    return;
  }

  console.log("Login successful");
}

  return (
    <main className="auth-page">
      <div className="auth-header">
        <h1 className="auth-logo">DailyNote</h1>
      </div>

      <div className="auth-container">
        <p className="auth-subtitle">
          {isSignup ? "Create an account" : "Log in to continue"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <input
              className="auth-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          )}

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />

<div className="auth-passwordWrapper">
  <input
    className="auth-input"
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    disabled={isSubmitting}
  />

  <button
  type="button"
  className="auth-eye"
  onClick={() => setShowPassword((prev) => !prev)}
  tabIndex={-1}
>
  <svg viewBox="0 0 24 24" fill="none">
    <path
      d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="1.8"
    />

    {!showPassword && (
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    )}
  </svg>
</button>
</div>

          <button className="auth-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="auth-button-spinner" aria-label="Loading" />
            ) : isSignup ? (
              "Sign Up"
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link"
                disabled={isSubmitting}
                onClick={() => {
                  setIsSignup(false);
                  setName("");
                  setEmail("");
                  setPassword("");
                }}
              >
                Log in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <button
                type="button"
                className="auth-link"
                disabled={isSubmitting}
                onClick={() => {
                  setIsSignup(true);
                  setName("");
                  setEmail("");
                  setPassword("");
                }}
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}