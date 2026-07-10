import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PageMeta } from "../components/PageMeta";
import { PageSection, PageShell } from "../components/PageShell";
import { Btn } from "../shared/Btn";

type AccountType = "personal" | "business" | "";

const NEXT_STEPS = [
  ["We receive your interest", "Your details are sent directly to the MevrelBank team for review."],
  ["We confirm receipt", "You will hear back with an acknowledgement and any relevant context about your account type."],
  ["We keep you informed", "As launch readiness progresses, we will reach out with next steps for your onboarding."],
] as const;

export default function WaitlistPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !accountType) return;

    const subject = `Waitlist interest — ${accountType === "personal" ? "Personal" : "Business"} account`;
    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      `Account type: ${accountType === "personal" ? "Personal" : "Business"}`,
      "",
      message.trim() ? `Message:\n${message.trim()}` : "No additional message.",
    ].join("\n");

    window.location.href = `mailto:hello@mevrelbank.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <>
      <PageMeta
        title="Join the Waitlist — MevrelBank"
        description="Register your interest in MevrelBank personal or business banking. Be among the first to know when accounts are available."
      />
      <PageShell
        eyebrow="Join the Waitlist"
        title="Register your interest in MevrelBank personal or business banking."
        intro="Accounts are not yet open to the public. Register your interest below and the team will follow up as your account type becomes available."
        secondaryCta={{ label: "Explore products first", href: "/products" }}
      >
        <PageSection
          title="Reserve your place"
          description="Tell us your name, email, and whether you are interested in personal or business banking."
        >
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            {submitted ? (
              <div className="rounded-[24px] border border-[rgba(11,50,112,0.08)] bg-white p-10 flex flex-col items-start gap-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={28} className="text-[#1764C0]" aria-hidden="true" />
                  <h2 className="text-[22px] font-semibold text-[#0D1829]">Interest registered</h2>
                </div>
                <p className="text-[16px] leading-relaxed text-[#5E6E8E] max-w-lg">
                  Your email client should have opened with your details pre-filled. If it did not open automatically,{" "}
                  <a href="mailto:hello@mevrelbank.com" className="text-[#0B3270] hover:text-[#0E3E8C] transition-colors underline underline-offset-2">
                    email us directly
                  </a>
                  .
                </p>
                <Btn variant="outline" href="/" size="md">Return to homepage</Btn>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-[24px] border border-[rgba(11,50,112,0.08)] bg-white p-8 space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-[#0D1829] mb-2">
                      Full name <span className="text-[#C52B2B]" aria-hidden="true">*</span>
                    </span>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] px-4 py-3 text-[14px] text-[#0D1829] outline-none focus:border-[#0B3270] transition-colors"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="block">
                    <span className="block text-[13px] font-semibold text-[#0D1829] mb-2">
                      Email address <span className="text-[#C52B2B]" aria-hidden="true">*</span>
                    </span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] px-4 py-3 text-[14px] text-[#0D1829] outline-none focus:border-[#0B3270] transition-colors"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <fieldset>
                  <legend className="block text-[13px] font-semibold text-[#0D1829] mb-2">
                    Account type <span className="text-[#C52B2B]" aria-hidden="true">*</span>
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["personal", "business"] as const).map((type) => (
                      <label
                        key={type}
                        className={`flex items-start gap-3 rounded-[12px] border p-4 cursor-pointer transition-colors ${
                          accountType === type
                            ? "border-[#0B3270] bg-[#EBF0FA]"
                            : "border-[rgba(11,50,112,0.14)] hover:border-[rgba(11,50,112,0.30)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value={type}
                          required
                          checked={accountType === type}
                          onChange={() => setAccountType(type)}
                          className="mt-0.5 accent-[#0B3270]"
                        />
                        <div>
                          <div className="text-[14px] font-semibold text-[#0D1829] capitalize">{type}</div>
                          <div className="text-[12px] text-[#5E6E8E] mt-0.5">
                            {type === "personal"
                              ? "Everyday accounts, savings, and payments."
                              : "Business accounts, team access, and payroll."}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="block text-[13px] font-semibold text-[#0D1829] mb-2">
                    Anything else? <span className="text-[#9AAABF] font-normal">(optional)</span>
                  </span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full rounded-[10px] border border-[rgba(11,50,112,0.14)] px-4 py-3 text-[14px] text-[#0D1829] outline-none focus:border-[#0B3270] resize-vertical transition-colors"
                    placeholder="Tell us more about how you plan to use MevrelBank, or any specific features you are looking for."
                  />
                </label>

                <Btn type="submit" size="lg" disabled={!name.trim() || !email.trim() || !accountType}>
                  Register interest
                </Btn>
                <p className="text-[12px] text-[#9AAABF]">
                  Submitting opens your email client with your details pre-filled for confirmation.
                </p>
              </form>
            )}

            <aside className="rounded-[24px] border border-[rgba(11,50,112,0.08)] bg-[#F6F8FC] p-8">
              <h3 className="text-[18px] font-semibold text-[#0D1829] mb-6">What happens next</h3>
              <ol className="space-y-6">
                {NEXT_STEPS.map(([title, text], index) => (
                  <li key={title} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EBF0FA] text-[#0B3270] flex items-center justify-center text-[13px] font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#0D1829] mb-1">{title}</div>
                      <p className="text-[13px] leading-relaxed text-[#5E6E8E]">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-8 pt-6 border-t border-[rgba(11,50,112,0.10)]">
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#4AA2D8] mb-2">Questions?</div>
                <p className="text-[13px] text-[#5E6E8E]">
                  Email{" "}
                  <a href="mailto:hello@mevrelbank.com" className="text-[#0B3270] hover:text-[#0E3E8C] transition-colors">
                    hello@mevrelbank.com
                  </a>{" "}
                  directly if you prefer.
                </p>
              </div>
            </aside>
          </div>
        </PageSection>
      </PageShell>
    </>
  );
}
