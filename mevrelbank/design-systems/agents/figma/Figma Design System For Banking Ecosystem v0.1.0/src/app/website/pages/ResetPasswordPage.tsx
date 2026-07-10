import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { AuthShell, AuthCard, AuthField, AuthInput, AuthError } from "../components/AuthShell";
import { Btn } from "../shared/Btn";

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const hasLength = value.length >= 8;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);
  const score = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  const label = score <= 2 ? "Weak" : score === 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const barColour =
    score <= 2 ? "bg-[#C52B2B]" : score === 3 ? "bg-[#D97706]" : score === 4 ? "bg-[#2563EB]" : "bg-[#16A34A]";
  const textColour =
    score <= 2 ? "text-[#C52B2B]" : score === 3 ? "text-[#D97706]" : score === 4 ? "text-[#2563EB]" : "text-[#16A34A]";

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? barColour : "bg-[rgba(11,50,112,0.08)]"}`}
          />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${textColour}`}>{label}</span>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [pwd, setPwd] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    if (pwd.length < 8) errs.password = "Password must be at least 8 characters.";
    if (pwd !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    // TODO: wire to auth API — extract token from URL params
    setTimeout(() => {
      setLoading(false);
      setDone(true);
    }, 600);
  };

  const canSubmit = value.length >= 8 && confirmPassword && !loading;

  return (
    <>
      <PageMeta
        title="Set a New Password — MevrelBank"
        description="Choose a new password for your MevrelBank account."
      />
      <AuthShell>
        <AuthCard>
          {done ? (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <CheckCircle2 size={44} className="text-[#16A34A]" aria-hidden="true" />
              <div>
                <h1
                  className="text-[24px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Password updated
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-2">
                  Your password has been changed. Sign in with your new password.
                </p>
              </div>
              <Btn variant="primary" size="lg" href="/login" className="w-full justify-center">
                Sign in
              </Btn>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1
                  className="text-[26px] font-bold text-[#0D1829] tracking-tight"
                  style={{ fontFamily: "Figtree, sans-serif" }}
                >
                  Set a new password
                </h1>
                <p className="text-[14px] text-[#5E6E8E] mt-1.5">
                  Choose a strong password for your MevrelBank account.
                </p>
              </div>

              {error && <AuthError message={error} />}

              <form onSubmit={handleSubmit} className="space-y-5 mt-5" noValidate>
                <AuthField label="New password" required error={fieldErrors.password}>
                  <div className="relative">
                    <AuthInput
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="Create a new password"
                      hasError={!!fieldErrors.password}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AAABF] hover:text-[#5E6E8E] transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength value={pwd} />
                </AuthField>

                <AuthField label="Confirm new password" required error={fieldErrors.confirmPassword}>
                  <AuthInput
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    hasError={!!fieldErrors.confirmPassword}
                  />
                </AuthField>

                <Btn
                  type="submit"
                  size="lg"
                  disabled={!canSubmit}
                  className="w-full justify-center"
                >
                  {loading ? "Updating…" : "Set new password"}
                </Btn>
              </form>
            </>
          )}
        </AuthCard>
      </AuthShell>
    </>
  );
}
