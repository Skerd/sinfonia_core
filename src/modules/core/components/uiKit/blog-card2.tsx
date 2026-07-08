import Image from "next/image";
import { Clock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import Link from "next/link";

const data = {
  title: "Mastering TypeScript: Advanced Patterns and Best Practices",
  excerpt:
    "Explore advanced TypeScript patterns, generics, and type utilities that will take your code quality to the next level. Real-world examples included.",
  coverImage:
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
  author: {
    name: "Michael Rodriguez",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  readTime: "7 min",
  category: "Development",
  commentCount: 18,
};

export default function BlogCard() {
  return (
    <Card className="w-full max-w-sm overflow-hidden pt-0 shadow-none">
      <Link href="#">
        <figure className="relative aspect-video w-full @min-[theme(--breakpoint-lg)]:w-1/3">
          <Image
            src={data.coverImage}
            fill
            className="object-cover md:h-full"
            alt={data.title}
          />
        </figure>
      </Link>

      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <Badge variant="outline">{data.category}</Badge>
          <div className="text-muted-foreground flex items-center text-xs">
            <Clock className="me-1 size-3" />
            {data.readTime} read
          </div>
        </div>

        <h4 className="text-xl">{data.title}</h4>

        <p className="text-muted-foreground text-sm">{data.excerpt}</p>

        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={data.author.avatar} alt={data.author.name} />
            <AvatarFallback>
              {data.author.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm leading-none font-medium">
              {data.author.name}
            </p>
            <div className="text-muted-foreground flex items-center text-xs">
              Blogger
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full">
          Read More
        </Button>
      </CardContent>
    </Card>
  );
}
