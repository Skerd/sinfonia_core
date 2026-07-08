import { Mail, Rss, X, TwitterIcon } from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";

interface ChangelogEntry {
  date: string;
  title: string;
  sections?: {
    title?: string;
    items: string[];
  }[];
  image?: string;
}

const changelogData: ChangelogEntry[] = [
  {
    date: "24 Aug 2025",
    title: "Analytics 2.0",
    sections: [
      {
        title: "New Features:",
        items: ["Real-time data streaming", "Customizable report widgets"],
      },
    ],
  },
  {
    date: "12 Aug 2025",
    title: "Team Collaboration",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    sections: [
      {
        title: "Updates:",
        items: [
          "Multi-user editing",
          "Comment threads on components",
          "Role-based access control",
          "Real-time notifications",
          "Team activity log",
        ],
      },
    ],
  },
  {
    date: "28 Jul 2025",
    title: "Performance Boost",
    sections: [
      {
        title: "Improvements:",
        items: [
          "Reduced bundle size by 40%",
          "Optimized image loading",
          "Faster initial render",
        ],
      },
    ],
  },
];

export default function Changelog() {
  return (
    <div className="bg-background relative min-h-screen w-full p-6 md:p-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-16 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold">Changelog</h1>
            <p className="text-muted-foreground">
              We update this page as new updates, improvements, and bug fixes
              become available on shadcnuikit.com.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <TwitterIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <Rss className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <Mail className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Timeline */}
        <div className="relative space-y-12">
          {/* Vertical Line */}
          <div className="bg-border absolute top-2 bottom-0 left-[7px] w-px md:left-[120px]" />

          {changelogData.map((entry, index) => (
            <div
              key={index}
              className="grid gap-8 md:grid-cols-[120px_1fr] md:gap-0"
            >
              {/* Date Column (Desktop) */}
              <div className="text-muted-foreground hidden pt-1 pr-8 text-right text-sm md:block">
                {entry.date}
              </div>

              {/* Content Column */}
              <div className="relative pl-8 md:pl-12">
                {/* Timeline Dot */}
                <div
                  className={`bg-primary absolute top-2 left-[3px] h-2.5 w-2.5 rounded-full ring-4 ring-white md:left-[-5px] dark:ring-black`}
                />

                {/* Mobile Date */}
                <div className="text-muted-foreground mb-2 text-sm md:hidden">
                  {entry.date}
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-medium">{entry.title}</h2>

                  {entry.image && (
                    <div className="overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900">
                      <img
                        src={entry.image}
                        alt={entry.title}
                        className="w-full object-cover"
                      />
                    </div>
                  )}

                  {entry.sections?.map((section, sIndex) => (
                    <div key={sIndex} className="space-y-3">
                      {section.title && <h3>{section.title}</h3>}
                      <ul className="text-muted-foreground space-y-2 text-sm">
                        {section.items.map((item, iIndex) => (
                          <li key={iIndex} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
