import Image from "next/image";
import { Clock, MessageCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import Link from "next/link";

const data = {
  title: "Building Scalable Design Systems with React",
  excerpt:
    "Learn how to create and maintain a robust design system that scales with your team and product. Best practices and real-world examples included.",
  coverImage:
    "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80",
  author: {
    name: "Sarah Chen",
    avatar: "https://i.pravatar.cc/150?img=47",
  },
  date: "2 hours ago",
  readTime: "8 min",
  category: "Design Systems",
  commentCount: 24,
};

export default function BlogCard() {
  return (
    <Card className="max-w-2xl overflow-hidden p-0 shadow-none">
      <div className="flex flex-col sm:flex-row">
        <Link
          href="#"
          className="relative aspect-video w-full @min-[theme(--breakpoint-lg)]:w-1/3"
        >
          <figure>
            <Image
              src={data.coverImage}
              fill
              className="object-cover sm:h-full"
              alt={data.title}
            />
          </figure>
        </Link>
        <div className="flex flex-col justify-between p-6 @min-[theme(--breakpoint-lg)]:w-2/3">
          <CardContent className="space-y-4 p-0">
            <h4 className="text-2xl">{data.title}</h4>
            <p className="text-muted-foreground text-sm">{data.excerpt}</p>
            <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage
                    src={data.author.avatar}
                    alt={data.author.name}
                  />
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
                    <Clock className="me-1 size-3" />
                    {data.readTime} read
                    <MessageCircle className="ms-3 me-1 size-3" />
                    {data.commentCount}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Read More
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
