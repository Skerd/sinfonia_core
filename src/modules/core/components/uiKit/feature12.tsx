import {
  ArrowUp10Icon,
  CloudyIcon,
  FingerprintIcon,
  LockOpenIcon,
} from "lucide-react";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

export default function FeatureSection() {
  return (
    <section className="py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <header className="mx-auto max-w-2xl lg:text-center">
          <Badge variant="outline" className="text-indigo-600">
            Features
          </Badge>
          <h3 className="mt-4 text-3xl leading-tight font-bold text-balance lg:text-4xl">
            Powerful tools to grow your business
          </h3>
          <p className="text-muted-foreground mt-6 text-lg">
            Build faster with our comprehensive suite of features designed to
            help you scale and succeed in today&rsquo;s competitive market.
          </p>
        </header>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-medium">
                <div className="bg-primary absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg">
                  <CloudyIcon
                    aria-hidden="true"
                    className="text-primary-foreground size-6"
                  />
                </div>
                Instant deployment
              </dt>
              <dd className="text-muted-foreground mt-2 text-base/7">
                Deploy your applications with a single click. Automated
                workflows ensure your updates go live seamlessly and securely.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-medium">
                <div className="bg-primary absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg">
                  <LockOpenIcon
                    aria-hidden="true"
                    className="text-primary-foreground size-6"
                  />
                </div>
                Secure connections
              </dt>
              <dd className="text-muted-foreground mt-2 text-base/7">
                Enterprise-grade SSL certificates included with every plan. Keep
                your data and users safe with encrypted connections.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-medium">
                <div className="bg-primary absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg">
                  <ArrowUp10Icon
                    aria-hidden="true"
                    className="text-primary-foreground size-6"
                  />
                </div>
                Smart queuing
              </dt>
              <dd className="text-muted-foreground mt-2 text-base/7">
                Efficient task management with intelligent queuing systems.
                Process requests faster and handle peak loads effortlessly.
              </dd>
            </div>

            <div className="relative pl-16">
              <dt className="text-base font-medium">
                <div className="bg-primary absolute top-0 left-0 flex size-10 items-center justify-center rounded-lg">
                  <FingerprintIcon
                    aria-hidden="true"
                    className="text-primary-foreground size-6"
                  />
                </div>
                Enhanced protection
              </dt>
              <dd className="text-muted-foreground mt-2 text-base/7">
                Multi-layered security with advanced threat detection and
                protection. Your infrastructure stays protected around the
                clock.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
