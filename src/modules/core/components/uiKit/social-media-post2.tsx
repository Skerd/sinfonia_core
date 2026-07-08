import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@coreModule/components/uiKit/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@coreModule/components/uiKit/ui/dropdown-menu";
import {
  BadgeCheckIcon,
  BookmarkIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  FlagIcon,
  HeartIcon,
  MaximizeIcon,
  MessageCircleIcon,
  MoreVerticalIcon,
  ShareIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const postData = {
  author: {
    avatar: "https://i.pravatar.cc/150?img=32",
    name: "Sarah Mitchell",
    verified: true,
    timestamp: "Posted 2h ago",
  },
  content: {
    text: "Just launched my first SaaS product after 6 months of hard work! 🚀 The journey was challenging but incredibly rewarding. Excited to see where this goes! 💪✨",
    hashtags: ["#SaaS", "#startup", "#buildinpublic"],
    image: {
      alt: "Entrepreneur celebrating launch with laptop",
      src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    },
  },
  engagement: {
    views: "12,458",
    likes: "347",
    comments: "28",
  },
};

export default function CardComponent() {
  return (
    <div className="relative w-full max-w-sm">
      <Card className="relative w-full overflow-hidden shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={postData.author.avatar}
                alt={`${postData.author.name} avatar`}
              />
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <h5 className="font-semibold">{postData.author.name}</h5>
                {postData.author.verified && (
                  <BadgeCheckIcon className="text-background size-5 fill-green-500" />
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {postData.author.timestamp}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <EditIcon />
                <span>Edit post</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CopyIcon />
                <span>Copy link</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                <span>Share post</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BookmarkIcon />
                <span>Save post</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <FlagIcon />
                <span>Report</span>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                <TrashIcon />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm leading-relaxed">{postData.content.text}</p>
            <div className="flex gap-2">
              {postData.content.hashtags.map((hashtag) => (
                <Link
                  key={hashtag}
                  href="#"
                  className="text-sm text-blue-500 hover:underline"
                >
                  {hashtag}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={postData.content.image.src}
              alt={postData.content.image.alt}
              fill
              className="object-cover"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2 bg-black/20 backdrop-blur-sm hover:bg-black/30"
            >
              <MaximizeIcon className="text-white" />
              <span className="sr-only">View fullscreen</span>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <EyeIcon className="text-muted-foreground size-5" />
              <span className="text-sm">{postData.engagement.views}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HeartIcon className="fill-destructive text-destructive size-4" />
              <span className="text-sm">{postData.engagement.likes}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircleIcon className="size-4 text-green-500" />
              <span className="text-sm">{postData.engagement.comments}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <BookmarkIcon />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
