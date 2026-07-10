import { useState } from "react";
import { MailCheck } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { AuthShell, AuthCard, AuthField, AuthInput, AuthError } from "../components/AuthShell";
import { Btn } from "../shared/Btn";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    setLoading(true);
    // TODO: wire to auth API
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 600);
  };

  return (
    <>
      <PageMeta
        title="Reset Your Password — MevrelBank"
        description="Forgotten your MevrelBank password? Enter your email and we will send you a reset link."
      />
      <AuthShell>
        <AuthCard>
          {sent ? (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <MailCheck size={44} className="text-[#0B3270]" aria-hidden="true" />
              <div>
                <h1
                  className="text-[24px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Check your inbox
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-2 max-w-sm mx-auto">
                  If an account exists for{" "}
                  <span className="font-semibold text-[#0D1829]">{email}</span>, you will receive
                  a password reset link shortly.
                </p>
              </div>
              <p className="text-[12px] text-[#9AAABF]">
                Check your spam folder if you don't see it within a few minutes.
              </p>
              <Btn variant="outline" size="md" href="/login" className="w-full justify-center">
                Back to sign in
              </Btn>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1
                  className="text-[26px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Forgot your password?
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-1.5">
                  Enter the email address linked to your account and we'll send you a reset link.
                </p>
              </div>

              {error && <AuthError message={error} />}

              <form onSubmit={handleSubmit} className="space-y-5 mt-5" noValidate>
                <AuthField label="Email address" required>
                  <AuthInput
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </AuthField>

                <Btn
                  type="submit"
                  size="lg"
                  disabled={!email.trim() || loading}
                  className="w-full justify-center"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </Btn>
              </form>

              <div className="mt-6 pt-5 border-t border-[rgba(11,50,112,0.07)] text-center">
                <p className="text-[13px] text-[#5E6E8E]">
                  Remembered it?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-[#0B3270] hover:text-[#0E3E8C] transition-colors"
                  >
                    Back to sign in
                  </a>
                </p>
              </div>
            </>
          )}
        </AuthCard>
      </AuthShell>
    </>
  );
}
