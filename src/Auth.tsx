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
  const [authError, setAuthError] = useState("");


async function handleGoogleLogin() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://mydailydiario.com/"
    },
  });
}

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (isSubmitting) return;

  setIsSubmitting(true);

  if (isSignup) {
   const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name,
        },
      },
    });

  if (error) {
  console.error("Signup error:", error.message);

  if (error.message.toLowerCase().includes("password")) {
    setAuthError(error.message);
  } else if (error.message.toLowerCase().includes("user already registered")) {
    setAuthError("An account with this email already exists.");
  } else {
    setAuthError(error.message);
  }

  setIsSubmitting(false);
  return;
}

    console.log("Signup successful");
    return;
  }

setAuthError("");

const normalizedEmail = email.trim().toLowerCase();

const { error } = await supabase.auth.signInWithPassword({
  email: normalizedEmail,
  password,
});

if (error) {
  const { data: accountHint, error: hintError } = await supabase.rpc(
    "get_login_account_hint",
    { input_email: normalizedEmail }
  );

  const hint = Array.isArray(accountHint) ? accountHint[0] : null;

  console.log("failed login debug", {
    loginError: error.message,
    normalizedEmail,
    accountHint,
    hintError,
  });

  if (hint?.auth_provider === "google" && hint?.has_password === false) {
    setAuthError("This account was created with Google. Please sign in with Google.");
  } else {
    setAuthError("Invalid email or password.");
  }

  setIsSubmitting(false);
  return;
}

  console.log("Login successful");
}

const isFormValid = isSignup
  ? name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0
  : email.trim().length > 0 &&
    password.trim().length > 0;

  return (
    <main className="auth-page">
      <div className="auth-header">
        <h1 className="auth-logo">Daily Diario</h1>
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
              onChange={(e) => {
  setName(e.target.value);
  if (authError) setAuthError("");
}}
              disabled={isSubmitting}
            />
          )}

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
           onChange={(e) => {
  setEmail(e.target.value);
  if (authError) setAuthError("");
}}
            disabled={isSubmitting}
          />

<div className="auth-passwordWrapper">
  <input
    className="auth-input"
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => {
  setPassword(e.target.value);
  if (authError) setAuthError("");
}}
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

          <button
              className="auth-button"
              type="submit"
              disabled={isSubmitting || !isFormValid}
            >
            {isSubmitting ? (
              <span className="auth-button-spinner" aria-label="Loading" />
            ) : isSignup ? (
              "Sign Up"
            ) : (
              "Log In"
            )}
          </button>

  <div className="auth-or">
    <span>or</span>
  </div>

  <button
    type="button"
    onClick={handleGoogleLogin}
    className="googlebtn auth-button"
    disabled={isSubmitting}
  >
    <svg
      className="google-btn-icon"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#167EE6"
        d="M492.668,211.489l-208.84-0.01c-9.222,0-16.697,7.474-16.697,16.696v66.715
        c0,9.22,7.475,16.696,16.696,16.696h117.606c-12.878,33.421-36.914,61.41-67.58,79.194L384,477.589
        c80.442-46.523,128-128.152,128-219.53c0-13.011-0.959-22.312-2.877-32.785C507.665,217.317,500.757,211.489,492.668,211.489z"
      />
      <path
        fill="#12B347"
        d="M256,411.826c-57.554,0-107.798-31.446-134.783-77.979l-86.806,50.034
        C78.586,460.443,161.34,512,256,512c46.437,0,90.254-12.503,128-34.292v-0.119l-50.147-86.81
        C310.915,404.083,284.371,411.826,256,411.826z"
      />
      <path
        fill="#0F993E"
        d="M384,477.708v-0.119l-50.147-86.81c-22.938,13.303-49.48,21.047-77.853,21.047V512
        C302.437,512,346.256,499.497,384,477.708z"
      />
      <path
        fill="#FFD500"
        d="M100.174,256c0-28.369,7.742-54.91,21.043-77.847l-86.806-50.034C12.502,165.746,0,209.444,0,256
        s12.502,90.254,34.411,127.881l86.806-50.034C107.916,310.91,100.174,284.369,100.174,256z"
      />
      <path
        fill="#FF4B26"
        d="M256,100.174c37.531,0,72.005,13.336,98.932,35.519c6.643,5.472,16.298,5.077,22.383-1.008
        l47.27-47.27c6.904-6.904,6.412-18.205-0.963-24.603C378.507,23.673,319.807,0,256,0
        C161.34,0,78.586,51.557,34.411,128.119l86.806,50.034C148.202,131.62,198.446,100.174,256,100.174z"
      />
      <path
        fill="#D93F21"
        d="M354.932,135.693c6.643,5.472,16.299,5.077,22.383-1.008l47.27-47.27
        c6.903-6.904,6.411-18.205-0.963-24.603C378.507,23.672,319.807,0,256,0v100.174
        C293.53,100.174,328.005,113.51,354.932,135.693z"
      />
    </svg>

    <span>Continue with Google</span>
  </button>

        </form>
{authError && <div className="auth-error">{authError}</div>}
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
  setAuthError(""); 
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
  setAuthError("");
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