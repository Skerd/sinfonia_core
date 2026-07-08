import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Building2, Mail, Phone } from "lucide-react";

export default function CTASection() {
  return (
    <div className="w-full py-10 lg:py-20">
      <div className="mx-auto max-w-5xl px-10">
        <Badge
          variant="outline"
          className="text-foreground rounded-full border-gray-300 px-3 py-1 text-xs font-normal hover:bg-transparent"
        >
          Reach Out To Us
        </Badge>
        <h1 className="text-foreground mt-4 text-left text-4xl font-bold tracking-tight">
          We'd love to Hear From You.
        </h1>
        <p className="text-muted-foreground mt-4 text-left">
          Or just reach out manually to{" "}
          <a
            href="mailto:contact@shadcnuikit.com"
            className="font-medium text-indigo-600 hover:underline"
          >
            contact@shadcnuikit.com
          </a>
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20 p-2.5 text-indigo-500">
              <Mail className="size-5" />
            </div>
            <p className="text-foreground mt-4 text-lg font-bold">
              Email Support
            </p>
            <p className="text-muted-foreground mt-1 mb-4">
              Our team can respond in real time.
            </p>
            <a
              href="mailto:contact@shadcnuikit.com"
              className="font-semibold text-indigo-600 hover:underline"
            >
              contact@shadcnuikit.com
            </a>
          </div>
          <div>
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20 p-2.5 text-indigo-500">
              <Building2 className="size-5" />
            </div>
            <p className="text-foreground mt-4 text-lg font-bold">
              Visit Our Office
            </p>
            <p className="text-muted-foreground mt-1 mb-4">
              Visit our location in real life.
            </p>
            <span className="font-semibold text-indigo-600">
              221b Elementary Avenue, NY
            </span>
          </div>
          <div>
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20 p-2.5 text-indigo-500">
              <Phone className="size-5" />
            </div>
            <p className="text-foreground mt-4 text-lg font-bold">
              Call Us Directly
            </p>
            <p className="text-muted-foreground mt-1 mb-4">
              Available during working hours.
            </p>
            <span className="font-semibold text-indigo-600">
              (+1) 234 - 4567 - 789
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
