import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { confirmUserVerification, startUserVerification } from "../api/user.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export default function VerifyAccount() {
  const { user, login } = useContext(AuthContext);
  const { tr } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = useMemo(() => normalizeEmail(location.state?.email || ""), [location.state?.email]);
  const initialDebugCodes = useMemo(() => location.state?.debugCodes || null, [location.state?.debugCodes]);

  const [email, setEmail] = useState(initialEmail);
  const [emailCode, setEmailCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [debugCodes, setDebugCodes] = useState(initialDebugCodes);

  useEffect(() => {
    if (user) navigate("/profile");
  }, [user, navigate]);

  const handleSendCodes = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError(tr("Email obligatoire", "Email is required"));
      return;
    }

    setSending(true);
    setError("");
    setMessage("");

    try {
      const response = await startUserVerification({
        email: normalizedEmail,
      });
      setEmail(response.email || normalizedEmail);
      setDebugCodes(response.debugCodes || null);
      const emailSent = response.delivery?.email?.sent;

      if (emailSent) {
        setMessage(tr("Code envoye. Verifiez votre email.", "Code sent. Check your email."));
      } else {
        setMessage(
          tr(
            "Aucun provider email configure: utilisez le code de debug (local).",
            "No email provider configured: use debug code (local)."
          )
        );
      }
    } catch (err) {
      setError(err.response?.data?.error || tr("Impossible d'envoyer le code", "Unable to send verification code"));
      setDebugCodes(null);
    } finally {
      setSending(false);
    }
  };

  const handleConfirm = async (event) => {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError(tr("Email obligatoire", "Email is required"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await confirmUserVerification({
        email: normalizedEmail,
        emailCode: emailCode.trim(),
      });

      if (!response?.token || !response?.user) {
        throw new Error(tr("Reponse de verification invalide", "Invalid verification response"));
      }

      login(response.user, response.token);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.error || err.message || tr("Verification impossible", "Unable to verify account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-shell py-10">
      <div className="mx-auto max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
        <p className="text-sm uppercase tracking-[0.25em] text-saffron">{tr("Securite", "Security")}</p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wide text-white">{tr("Verifier votre compte", "Verify your account")}</h1>
        <p className="mt-3 text-sm text-stone-300">
          {tr(
            "Validez votre adresse email avant la connexion.",
            "Validate your email address before signing in."
          )}
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        )}

        {debugCodes && (
          <div className="mt-4 rounded-lg border border-amber-300/45 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <p className="font-semibold uppercase tracking-wide">{tr("Code de debug", "Debug code")}</p>
            {debugCodes.emailOtpCode && <p>Email: {debugCodes.emailOtpCode}</p>}
          </div>
        )}

        <form onSubmit={handleConfirm} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder={tr("Email", "Email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-charcoal/70 px-4 py-3 text-white placeholder:text-stone-400"
            required
          />
          <button
            type="button"
            onClick={handleSendCodes}
            disabled={sending}
            className="w-full rounded-full border border-saffron/70 px-5 py-3 text-sm font-bold uppercase tracking-wide text-saffron transition hover:bg-saffron/10 disabled:opacity-60"
          >
            {sending ? tr("Envoi...", "Sending...") : tr("Envoyer le code", "Send code")}
          </button>

          <input
            inputMode="numeric"
            placeholder={tr("Code email (6 chiffres)", "Email code (6 digits)")}
            value={emailCode}
            onChange={(event) => setEmailCode(event.target.value)}
            className="w-full rounded-xl border border-white/20 bg-charcoal/70 px-4 py-3 text-white placeholder:text-stone-400"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-saffron px-5 py-3 text-sm font-bold uppercase tracking-wide text-charcoal hover:bg-yellow-300 disabled:opacity-60"
          >
            {loading ? tr("Verification...", "Verifying...") : tr("Verifier et se connecter", "Verify and sign in")}
          </button>
        </form>

        <p className="mt-5 text-sm text-stone-300">
          <Link to="/login" className="font-semibold text-saffron hover:underline">
            {tr("Retour a la connexion", "Back to login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
