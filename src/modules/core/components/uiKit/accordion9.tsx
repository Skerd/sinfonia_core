import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@coreModule/components/uiKit/ui/accordion";

const items = [
  {
    content:
      "Our platform offers flexible pricing plans to suit teams of all sizes. You can start with our free tier and upgrade as your needs grow. All plans include core features with additional benefits for premium subscribers.",
    id: "1",
    title: "What pricing plans are available?"
  },
  {
    content:
      "Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period, and you won't be charged for the next cycle.",
    id: "2",
    title: "Can I cancel my subscription anytime?"
  },
  {
    content:
      "We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely through our encrypted payment gateway to ensure your financial information is protected.",
    id: "3",
    title: "What payment methods do you accept?"
  },
  {
    content:
      "Our support team is available 24/7 via email and live chat. Premium plan subscribers get priority support with faster response times. We also maintain a comprehensive knowledge base with tutorials and documentation.",
    id: "4",
    title: "What kind of support do you provide?"
  }
];

export default function Component() {
  return (
    <div className="w-full max-w-md">
      <Accordion className="w-full space-y-2" collapsible type="single">
        {items.map((item) => (
          <AccordionItem
            className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 rounded-md border px-4 py-1 outline-none last:border-b has-focus-visible:ring-[3px]"
            key={item.id}
            value={item.id}>
            <AccordionTrigger className="justify-start gap-3 py-2 text-[15px] leading-6 hover:no-underline focus-visible:ring-0 [&>svg]:-order-1">
              {item.title}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground ps-7 pb-2">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
