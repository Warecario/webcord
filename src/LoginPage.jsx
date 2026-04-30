export default function LoginPage({ onLogin, error }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Webcord</h1>
        <p>Login with Discord to use your account, join your servers, and chat normally.</p>
        <button className="login-button" type="button" onClick={onLogin}>
          Continue with Discord
        </button>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-note">
          Webcord uses Discord OAuth to access your account. No local Webcord profile is needed.
        </div>
      </div>
    </div>
  );
}
