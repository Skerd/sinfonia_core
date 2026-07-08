import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@coreModule/components/uiKit/ui/item";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import Image from "next/image";
import Link from "next/link";

const blogPosts = [
  {
    id: 1,
    author: {
      name: "Emma Thompson",
      avatar: "https://i.pravatar.cc/150?img=45",
    },
    title: "Building Scalable React Applications with Modern Architecture",
    category: "Development",
    date: "Jan 15, 2025",
    thumbnail:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80",
  },
];

export default function BlogCard() {
  return (
    <Card className="w-full max-w-xl py-0 shadow-none">
      <CardContent className="space-y-0 p-0">
        {blogPosts.map((post, index) => (
          <div key={post.id}>
            <Item className="w-full items-center gap-4 py-4">
              <ItemContent className="flex-1 gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarImage
                      src={post.author.avatar}
                      alt={post.author.name}
                    />
                  </Avatar>
                  <Link
                    href="#"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {post.author.name}
                  </Link>
                </div>
                <Link href="#">
                  <ItemTitle className="text-xl font-semibold hover:underline">
                    {post.title}
                  </ItemTitle>
                </Link>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Link
                    href="#"
                    className="hover:text-foreground hover:underline"
                  >
                    {post.category}
                  </Link>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
              </ItemContent>
              <ItemMedia className="shrink-0">
                <Link href="#" className="block">
                  <div className="relative size-24 overflow-hidden rounded-md">
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Link>
              </ItemMedia>
            </Item>
            {index < blogPosts.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
