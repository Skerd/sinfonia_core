import { Button } from "@coreModule/components/uiKit/ui/button";

export default function Component() {
  return (
    <section className="py-10 md:px-6 lg:py-28">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 text-center lg:text-left">
          <h3 className="text-3xl font-bold text-balance sm:text-4xl">Ready to transform your business?</h3>
          <div className="flex flex-col gap-2 space-y-4">
            <p className="text-muted-foreground text-balance md:text-lg">
              Join thousands of companies already using our platform to streamline their workflow,
              boost productivity, and drive growth. Start your free trial today.
            </p>
            <div className="flex gap-3 justify-center lg:justify-start">
              <Button> Start Free Trial</Button>
              <Button variant="outline">Learn More</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

