import { Search, Mail, X, ArrowRight, TwitterIcon } from "lucide-react";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";

const changelogData = [
  {
    date: "Aug 15, 2025",
    title: "Introducing Real-time Collaboration",
    description:
      "Experience seamless teamwork with our new real-time collaboration features. Edit documents, leave comments, and see changes happen live, empowering your team to work faster and more efficiently together.",
    author: "Sarah Chen",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    readMoreLink: "#",
  },
  {
    date: "Jul 22, 2025",
    title: "Enhanced Analytics Dashboard",
    description:
      "Gain deeper insights into your performance with our redesigned analytics dashboard. We've added custom reports, data visualization tools, and export options to help you make data-driven decisions.",
    author: "Alex Morgan",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    readMoreLink: "#",
  },
  {
    date: "Jun 10, 2025",
    title: "Mobile App 2.0 Released",
    description:
      "Our mobile app has been completely rebuilt from the ground up. Enjoy a faster, smoother experience with a modern UI, dark mode support, and offline capabilities for when you're on the go.",
    author: "David Kim",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
    readMoreLink: "#",
  },
];

export default function Changelog() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6">
      <div className="grid gap-10 md:grid-cols-[300px_1fr] lg:gap-20">
        {/* Sidebar */}
        <div className="flex flex-col gap-6 md:sticky md:top-8 md:h-fit">
          <h1 className="text-4xl font-semibold">Changelog</h1>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search"
              className="bg-secondary/50 focus:border-input rounded-full border-transparent pl-9 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-muted-foreground/20 h-8 gap-1.5 rounded-full px-3 text-xs font-medium"
            >
              <TwitterIcon /> Follow
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-muted-foreground/20 h-8 gap-1.5 rounded-full px-3 text-xs font-medium"
            >
              <Mail /> Subscribe
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="border-border relative space-y-10 border-l pb-10">
          {changelogData.map((item, index) => (
            <div key={index} className="relative pl-6 md:pl-10">
              <div className="ring-background bg-primary absolute top-1 -left-[5px] h-2.5 w-2.5 rounded-full ring-4" />

              <div className="flex flex-col gap-4">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>{item.date}</span>
                </div>
                <h2 className="text-2xl leading-tight font-medium">{item.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                <a
                  href={item.readMoreLink ?? ""}
                  className="flex items-center gap-1 text-xs text-blue-500 transition-colors hover:text-blue-600"
                >
                  Read More <ArrowRight className="h-3 w-3" />
                </a>
                <div className="flex items-center gap-3 pt-2">
                  <Avatar>
                    <AvatarImage src={item.avatar} alt={item.author} />
                    <AvatarFallback>
                      {item.author.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground text-sm font-medium">
                    {item.author}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
