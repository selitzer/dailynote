import { useState } from "react";
import "./Auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="auth-page">
      {/* Top logo */}
      <div className="auth-header">
        <h1 className="auth-logo">DailyNote</h1>
      </div>

      {/* Center auth content */}
      <div className="auth-container">
        <p className="auth-subtitle">
          {isSignup ? "Create an account" : "Log in to continue"}
        </p>

        <form className="auth-form">
          {/* Name only for signup */}
          {isSignup && (
            <input
              className="auth-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            className="auth-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="auth-button" type="submit">
            {isSignup ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => setIsSignup(false)}
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
                onClick={() => setIsSignup(true)}
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