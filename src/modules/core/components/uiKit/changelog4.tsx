import {
  Search,
  Bell,
  Frown,
  Meh,
  Smile,
  Zap,
  Clock10Icon,
} from "lucide-react";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@coreModule/components/uiKit/ui/input-group";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const changelogData = [
  {
    id: 1,
    type: "New Feature",
    date: "Dec 30, 2026",
    title: "Introducing In-App Announcements 🎉",
    description:
      "We're excited to introduce In-App Announcements — now your users see new changelogs instantly, without needing extra clicks!",
    highlights: [
      "Instant Visibility: Updates appear the moment you publish.",
      "Engaging Design: A clean, eye-catching popup.",
    ],
  },
  {
    id: 2,
    type: "Improvement",
    date: "Nov 25, 2026",
    title: "Introducing new Analytics 📊",
    description:
      "We're thrilled to announce the arrival of our brand new Analytics feature! Now you can gain deeper insights into your feedback's and changelogs performance, also the user engagement with real-time data and visualizations. 🚀",
    highlights: [
      "Track views, votes, reactions, sources, and comments on each post",
      "Track user devices, browsers, os, referrers and countries",
    ],
  },
];

const labels = [
  { name: "All labels", count: 69, active: true },
  { name: "New Feature", count: 80, color: "bg-green-500" },
  { name: "Improvement", count: 36, color: "bg-blue-500" },
  { name: "Fix", count: 16, color: "bg-red-500" },
  { name: "Beta", count: 4, color: "bg-gray-500" },
];

const badgeColor = (type: string) => {
  switch (type) {
    case "New Feature":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    case "Improvement":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Fix":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "Beta":
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

export default function Changelog() {
  return (
    <div className="py-10">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-6">
        <header className="mb-8 lg:mb-4">
          <h1 className="text-3xl font-semibold">Changelog</h1>
        </header>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:gap-6">
          <div className="space-y-4">
            {changelogData.map((item) => (
              <Card key={item.id} className="overflow-hidden shadow-none">
                <CardContent>
                  <Badge
                    variant="secondary"
                    className={`mb-4 ${badgeColor(item.type)} hover:${badgeColor(item.type)}`}
                  >
                    {item.type}
                  </Badge>

                  <h2 className="mb-2 text-2xl font-medium">{item.title}</h2>
                  <p className="text-muted-foreground mb-6 flex items-center gap-1.5 text-xs">
                    <Clock10Icon className="size-3" />
                    {item.date}
                  </p>

                  <div className="prose prose-h4:font-normal prose-ul:text-sm dark:prose-invert max-w-full">
                    <p>{item.description}</p>
                    {item.highlights && (
                      <>
                        <h4>Highlights</h4>
                        <ul>
                          {item.highlights.map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Frown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-yellow-500 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20"
                    >
                      <Meh />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                    >
                      <Smile />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <InputGroup className="border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search..." />
            </InputGroup>

            <Card className="overflow-hidden shadow-none">
              <CardContent className="space-y-4">
                <h3>Labels</h3>
                <div className="space-y-1">
                  {labels.map((label, idx) => (
                    <Button
                      key={idx}
                      variant={label.active ? "secondary" : "ghost"}
                      className="flex w-full items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {label.color ? (
                          <span
                            className={`size-2 rounded-full ${label.color}`}
                          />
                        ) : (
                          <span className="size-2 rounded-full bg-gray-400" />
                        )}
                        <span>{label.name}</span>
                      </div>
                      <Badge variant="outline">{label.count}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full">
              <Bell />
              Subscribe to updates
            </Button>

            <div>
              <div className="text-muted-foreground mb-3 flex flex-wrap justify-center gap-x-3 gap-y-2 text-xs">
                <a href="#" className="hover:underline">
                  Licenses
                </a>
                <a href="#" className="hover:underline">
                  Privacy Policy
                </a>
                <a href="#" className="hover:underline">
                  Terms of Service
                </a>
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
                <Zap className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>Powered by Shadcn UI Kit</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
