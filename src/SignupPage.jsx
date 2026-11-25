import { useState } from "react";

export default function SignupPage() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [notice, setNotice] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (data.get("password") !== data.get("confirmPassword")) {
      setNotice("Those passwords don’t match. Please check and try again.");
      return;
    }

    setNotice(
      "This preview doesn’t create an account. Taking you to the restaurant selection page…",
    );
    window.setTimeout(() => {
      window.location.assign("index.html");
    }, 1400);
  }

  return (
    <main className="signup-shell">
      <header className="signup-header">
        <a className="signup-brand" href="index.html" aria-label="ChopLocal home">
          <span className="signup-brandmark" aria-hidden="true">
            ✳
          </span>
          <span>
            chop<span className="signup-brand-accent">local</span>
          </span>
        </a>
        <a className="back-link" href="index.html">
          Back to restaurants
        </a>
      </header>

      <section className="signup-layout" aria-labelledby="signup-title">
        <div className="signup-story">
          <p className="signup-eyebrow">Good food lives close</p>
          <h1>
            Your next
            <br />
            favourite meal
            <br />
            is <em>around here.</em>
          </h1>
          <p className="signup-story-copy">
            Find neighbourhood kitchens, discover what you’re craving, and make
            more of mealtime with ChopLocal.
          </p>
          <div className="signup-story-note">
            <span aria-hidden="true">✦</span>
            <span>Made for Festac. Made for the love of good food.</span>
          </div>
          <div className="signup-art" aria-hidden="true">
            <div className="signup-sun" />
            <div className="signup-plate">
              <div className="signup-food" />
            </div>
            <div className="signup-food-label">
              <span>Today’s good idea</span>
              <strong>Something local</strong>
            </div>
          </div>
        </div>

        <section className="signup-card">
          <div className="signup-card-heading">
            <p className="signup-eyebrow">Join the neighbourhood</p>
            <h2 id="signup-title">Create your account</h2>
            <p>Sign up to start exploring local food.</p>
          </div>

          <div className="signup-demo-notice" role="note">
            This is a front-end preview. Account creation is not connected yet;
            don’t enter a real password.
          </div>

          <form className="signup-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input
                autoComplete="name"
                name="fullName"
                placeholder="e.g. Amara Okafor"
                required
              />
            </label>

            <label>
              Email address
              <input
                autoComplete="email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>

            <label>
              Phone number <span className="optional-label">Optional</span>
              <input
                autoComplete="tel"
                name="phone"
                placeholder="+234 800 000 0000"
                type="tel"
              />
            </label>

            <label>
              Password
              <span className="password-input">
                <input
                  autoComplete="new-password"
                  minLength="8"
                  name="password"
                  placeholder="At least 8 characters"
                  required
                  type={passwordVisible ? "text" : "password"}
                />
                <button
                  className="password-toggle"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  type="button"
                >
                  {passwordVisible ? "Hide" : "Show"}
                </button>
              </span>
            </label>

            <label>
              Confirm password
              <input
                autoComplete="new-password"
                minLength="8"
                name="confirmPassword"
                placeholder="Enter your password again"
                required
                type={passwordVisible ? "text" : "password"}
              />
            </label>

            <label className="terms-field">
              <input name="terms" required type="checkbox" />
              <span>
                I agree to the <a href="#terms">Terms of Service</a> and{" "}
                <a href="#privacy">Privacy Policy</a>.
              </span>
            </label>

            <button className="signup-submit" type="submit">
              Create account <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="signup-status" aria-live="polite" role="status">
            {notice}
          </p>
          <p className="login-prompt">
            Already have an account?{" "}
            <a href="index.html#login">
              Log in
            </a>
          </p>
        </section>
      </section>

      <footer className="signup-footer">
        <span>© ChopLocal · Festac, Lagos</span>
        <span>Local kitchens. Good food. Neighbourhood love.</span>
      </footer>
    </main>
  );
}
