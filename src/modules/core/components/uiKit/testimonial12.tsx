"use client";

import { Quote } from "lucide-react";

const stats = [
  { value: "10k", label: "Freelancers" },
  { value: "$10m", label: "Invoices paid" },
  { value: "500k", label: "Invoices Generated" },
] as const;

export default function TestimonialsDark() {
  return (
    <section
      className="relative overflow-hidden py-16 md:py-20"
      style={{ backgroundColor: "#111111" }}
    >
      {/* Subtle green gradient bottom-left */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 size-80 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 0% 100%, rgba(34, 197, 94, 0.25) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          {/* Left: Heading */}
          <header className="lg:pt-2">
            <div className="inline-block rounded-md bg-white/10 px-4 py-2">
              <span className="text-xs font-medium uppercase tracking-wider text-white">
                Testimonials
              </span>
            </div>
            <h2 className="mt-6 max-w-lg text-3xl font-bold leading-tight text-white md:text-4xl">
              We take care of the invoices, and freelancers get to focus on the
              work they love
            </h2>
          </header>

          {/* Right: Testimonials + Image grid — row1: big card | image, row2: small | small */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Large testimonial card */}
            <article
              className="flex flex-col overflow-hidden rounded-2xl bg-white sm:flex-row"
              style={{
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div className="flex shrink-0 items-center justify-center bg-gray-100 p-6 sm:w-2/5">
                <img
                  src="https://i.pravatar.cc/200?img=33"
                  alt=""
                  width={160}
                  height={160}
                  className="rounded-full object-cover size-32 sm:size-40"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8 sm:w-3/5">
                <Quote
                  className="text-foreground mb-2 size-10 shrink-0"
                  strokeWidth={1}
                  aria-hidden
                />
                <blockquote className="text-gray-800 text-base leading-relaxed md:text-[15px]">
                  &ldquo;I used to dread invoicing. Now it takes me 2 minutes.
                  InvoiceIt saved me hours every month and I actually get paid
                  faster because the invoices look so professional.&rdquo;
                </blockquote>
                <div className="mt-4">
                  <p className="font-semibold text-gray-900">Jeff Oyetan</p>
                  <p className="text-gray-500 text-sm">
                    Freelance Designer, Lagos
                  </p>
                </div>
              </div>
            </article>

            {/* Image */}
            <div className="overflow-hidden rounded-2xl min-h-[280px] md:min-h-[320px]">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80"
                alt=""
                width={400}
                height={320}
                className="size-full object-cover"
              />
            </div>

            {/* Small testimonial 1 */}
            <article
              className="rounded-2xl bg-white p-5"
              style={{
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
              }}
            >
              <blockquote className="text-gray-800 text-sm leading-relaxed">
                &ldquo;The recurring invoice feature is a game-changer. My
                retainer clients get invoiced automatically. I literally set it
                once and forget it.&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/100?img=47"
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">Sarah Martinez</p>
                  <p className="text-gray-500 text-sm">
                    Developer & Consultant
                  </p>
                </div>
              </div>
            </article>

            {/* Small testimonial 2 */}
            <article
              className="rounded-2xl bg-white p-5"
              style={{
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
              }}
            >
              <blockquote className="text-gray-800 text-sm leading-relaxed">
                &ldquo;I spend way less time chasing payments now. Everything is
                clear, professional, and easy for my clients.&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/100?img=15"
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">Antonio B.</p>
                  <p className="text-gray-500 text-sm">
                    Content Writer, Spain
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl px-6 py-6 text-center"
              style={{
                backgroundColor: "#84cc16",
                boxShadow: "0 4px 14px rgba(132, 204, 22, 0.35)",
              }}
            >
              <p className="text-xl font-bold text-white md:text-2xl">
                {s.value}
              </p>
              <p className="text-white/95 mt-1 text-sm font-medium">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
