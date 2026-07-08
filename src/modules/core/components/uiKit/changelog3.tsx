import { Bug, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@coreModule/components/uiKit/ui/breadcrumb";
import { Separator } from "@coreModule/components/uiKit/ui/separator";

interface ChangeItem {
  hash: string;
  message: string;
  issue?: number;
  author?: string;
}

interface ChangeSection {
  type: "bug" | "feature" | "breaking";
  title: string;
  items: ChangeItem[];
}

interface Release {
  version: string;
  date: string;
  sections: ChangeSection[];
}

const changelogData: Release[] = [
  {
    version: "2.4.0",
    date: "March 15, 2026",
    sections: [
      {
        type: "feature",
        title: "New Features",
        items: [
          {
            hash: "a1b2c3d",
            message: "Added dark mode support for all dashboard components",
            issue: 420,
          },
          {
            hash: "e5f6g7h",
            message: "Introduced new API endpoints for user analytics",
            issue: 425,
          },
        ],
      },
      {
        type: "bug",
        title: "Bug Fixes / Improvements",
        items: [
          {
            hash: "i8j9k0l",
            message: "Fixed layout shift on mobile devices when loading charts",
            issue: 418,
          },
          {
            hash: "m1n2o3p",
            message: "Optimized database queries for faster search results",
          },
        ],
      },
    ],
  },
  {
    version: "2.3.5",
    date: "February 28, 2026",
    sections: [
      {
        type: "bug",
        title: "Bug Fixes / Improvements",
        items: [
          {
            hash: "q4r5s6t",
            message:
              "Resolved an issue with authentication tokens expiring prematurely",
            issue: 410,
          },
          {
            hash: "u7v8w9x",
            message:
              "Updated dependency versions to patch security vulnerabilities",
          },
        ],
      },
      {
        type: "breaking",
        title: "Breaking Changes",
        items: [
          {
            hash: "y0z1a2b",
            message:
              "Deprecated legacy authentication method in favor of OAuth 2.0",
            issue: 405,
          },
        ],
      },
    ],
  },
];

const getIcon = (type: ChangeSection["type"]) => {
  switch (type) {
    case "bug":
      return <Bug className="size-4 text-white" />;
    case "feature":
      return <Sparkles className="size-4 text-white" />;
    case "breaking":
      return <AlertCircle className="size-4 text-white" />;
  }
};

const getIconBg = (type: ChangeSection["type"]) => {
  switch (type) {
    case "bug":
      return "bg-blue-500";
    case "feature":
      return "bg-indigo-500";
    case "breaking":
      return "bg-red-500";
  }
};

export default function Changelog() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
      <div className="flex flex-col gap-4 lg:gap-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Changelog</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-3xl font-semibold md:text-4xl">Changelog</h1>

        <div className="mt-4 space-y-8 lg:space-y-12">
          {changelogData.map((release, index) => (
            <div key={index}>
              <h4 className="text-foreground mb-10">
                {release.version}{" "}
                <span className="text-muted-foreground"> - {release.date}</span>
              </h4>

              {release.sections.map((section, sectionIndex) => (
                <div
                  className="group relative flex gap-4 not-last:pb-10 md:gap-6"
                  key={sectionIndex}
                >
                  <Separator
                    className="absolute top-0 bottom-0 left-4 z-0 [.group:last-child_&]:hidden"
                    orientation="vertical"
                  />
                  <div
                    className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${getIconBg(section.type)} `}
                  >
                    {getIcon(section.type)}
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <ul className="text-muted-foreground space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm leading-relaxed">
                          <Link
                            href="#"
                            className="text-primary mr-2 font-mono text-sm hover:underline"
                          >
                            [{item.hash}]
                          </Link>
                          <span className="text-muted-foreground">
                            - {item.message}
                          </span>
                          {item.issue && (
                            <Link
                              href="#"
                              className="ml-1 text-blue-500 hover:underline"
                            >
                              (see also: #{item.issue})
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
