import { Button } from "@coreModule/components/uiKit/ui/button";

export default function CTASection() {
  return (
    <section className="py-10 lg:py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl bg-linear-to-r bg-[url('https://images.unsplash.com/photo-1739785890803-7a2191a37ef5?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-bottom px-8 py-10 md:px-16 md:py-20">
          <header className="mb-8 max-w-2xl space-y-4">
            <h2 className="text-4xl leading-10 font-bold text-black lg:text-4xl">
              Benefit up to 33% when connecting to Sentium for 4 months or more
            </h2>
            <p className="text-lg text-black/60">
              Register and start using our cloud solutions today
            </p>
          </header>

          <div className="flex flex-wrap gap-4">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="secondary">
              Contact
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
