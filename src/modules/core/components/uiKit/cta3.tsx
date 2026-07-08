import Image from "next/image";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Component() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
        <Card className="overflow-hidden p-0 shadow-none">
          <CardContent className="p-0">
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-12">
              <div className="order-last flex flex-col justify-center space-y-4 px-4 py-4 lg:order-first lg:px-6 lg:py-32 lg:ps-16">
                <div className="space-y-3 text-center lg:text-left">
                  <h3 className="text-3xl font-bold text-balance lg:text-4xl/tight">
                    Ready to transform your business?
                  </h3>
                  <p className="text-muted-foreground lg:text-lg/relaxed">
                    Join thousands of companies already using our platform to streamline their
                    workflow, boost productivity, and drive growth. Start your free trial today.
                  </p>
                </div>
                <div className="mt-4 flex flex-col justify-center gap-3 min-[400px]:flex-row lg:justify-start">
                  <Button asChild>
                    <Link href="#">Start Free Trial</Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link href="#">
                      Learn More <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <Image
                  src="https://images.unsplash.com/photo-1708559348128-3cde89847e2b?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="..."
                  width={600}
                  height={400}
                  className="mx-auto aspect-video overflow-hidden object-cover sm:w-full lg:order-last"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
