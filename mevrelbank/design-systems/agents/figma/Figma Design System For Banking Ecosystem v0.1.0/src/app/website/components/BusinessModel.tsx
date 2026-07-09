const REVENUE_PILLARS = [
  {
    title: "Personal banking",
    text: "Build a simple current account base first, then grow revenue through card interchange, deposits, and a premium layer for customers who want more controls and benefits.",
  },
  {
    title: "Business banking",
    text: "Serve founders and small teams with business accounts, team access, and operational payment tools that can support account fees and value-added service revenue over time.",
  },
  {
    title: "Expansion services",
    text: "Add higher-trust products gradually — savings, cards, international movement, and financing support — only after the core experience is stable and trusted.",
  },
] as const;

const NEXT_STEPS = [
  {
    step: "01",
    title: "Convert interest into a waitlist",
    text: "Turn the website into a demand capture channel for personal customers, business customers, and partners with clearer calls to action and segmented interest paths.",
  },
  {
    step: "02",
    title: "Publish product and pricing detail",
    text: "Add clearer launch-ready product pages that explain what each account includes, who it is for, and how pricing will stay transparent.",
  },
  {
    step: "03",
    title: "Strengthen trust pages",
    text: "Expand public trust content with company information, security posture, regulatory readiness, and support expectations before launch.",
  },
] as const;

export function BusinessModel() {
  return (
    <section id="business-model" className="py-24 bg-[#F4F7FB]" aria-labelledby="business-model-heading">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
            Business Model
          </div>
          <h2
            id="business-model-heading"
            className="text-[34px] sm:text-[38px] font-bold text-[#0D1829] leading-tight mb-4"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            A focused model built around trust first, revenue second.
          </h2>
          <p className="text-[16px] text-[#5E6E8E] leading-relaxed">
            The next smart move for MevrelBank is to show visitors how the brand plans to grow:
            start with strong everyday banking, prove trust, then expand carefully into higher-value
            services.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {REVENUE_PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-white p-8"
            >
              <h3 className="text-[20px] font-semibold text-[#0D1829] mb-3">{pillar.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5E6E8E]">{pillar.text}</p>
            </article>
          ))}
        </div>

        <div className="max-w-3xl mb-10">
          <div className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#1764C0] mb-3">
            What Comes Next
          </div>
          <h3
            className="text-[30px] sm:text-[34px] font-bold text-[#0D1829] leading-tight mb-4"
            style={{ fontFamily: "Figtree, sans-serif" }}
          >
            The website should now help validate demand, not just explain the brand.
          </h3>
          <p className="text-[16px] text-[#5E6E8E] leading-relaxed">
            These are the immediate public-site priorities that make the business model more credible
            and more useful.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {NEXT_STEPS.map((item) => (
            <article
              key={item.step}
              className="rounded-[20px] border border-[rgba(11,50,112,0.08)] bg-[#0B3270] p-8"
            >
              <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8AC5F0] mb-4">
                Step {item.step}
              </div>
              <h4 className="text-[20px] font-semibold text-white mb-3">{item.title}</h4>
              <p className="text-[15px] leading-relaxed text-[rgba(255,255,255,0.68)]">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
