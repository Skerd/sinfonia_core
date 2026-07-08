import { Avatar, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@coreModule/components/uiKit/ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@coreModule/components/uiKit/ui/item";
import {
  BadgeCheckIcon,
  BookmarkIcon,
  CopyIcon,
  EditIcon,
  FlagIcon,
  HeartIcon,
  Link2Icon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  RepeatIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const postData = {
  author: {
    avatar: "https://i.pravatar.cc/150?img=13",
    name: "Emma Wilson",
    username: "@emmawilson",
    verified: true,
    timestamp: "15 Jan",
  },
  content: {
    text: "Just discovered this amazing resource for learning Next.js! The interactive examples are super helpful 🔥",
    link: {
      url: "https://nextjs.org/learn",
      preview: {
        title: "Learn Next.js - Interactive Course | Next.js",
        description:
          "Learn Next.js, the React framework for production. Build fast and scalable web applications with our comprehensive tutorial...",
        image: {
          src: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
          alt: "Next.js learning dashboard",
        },
      },
    },
  },
  engagement: {
    likes: 142,
    reposts: 23,
    comments: 8,
  },
};

export default function CardComponent() {
  return (
    <div className="w-full max-w-xl space-y-3">
      <Item className="w-full p-0">
        <ItemMedia>
          <Avatar>
            <AvatarImage
              src={postData.author.avatar}
              alt={`${postData.author.name} avatar`}
            />
          </Avatar>
        </ItemMedia>
        <ItemContent className="gap-0">
          <div className="flex items-center gap-1.5">
            <ItemTitle>{postData.author.name}</ItemTitle>
            {postData.author.verified && (
              <BadgeCheckIcon className="text-background size-4 fill-yellow-400" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <ItemDescription className="text-xs">
              {postData.author.username}
            </ItemDescription>
            <span className="text-muted-foreground text-xs">·</span>
            <ItemDescription className="text-xs">
              {postData.author.timestamp}
            </ItemDescription>
          </div>
        </ItemContent>
        <ItemActions>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontalIcon />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <EditIcon />
                <span>Edit post</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CopyIcon />
                <span>Copy link</span>
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
        </ItemActions>
      </Item>

      <div className="space-y-2">
        <p className="text-sm leading-relaxed">{postData.content.text}</p>
      </div>

      <Link
        href={postData.content.link.url}
        className="bg-muted hover:bg-muted/80 block overflow-hidden rounded-lg border transition-colors"
      >
        <div className="flex">
          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-2">
              <h6 className="leading-tight font-semibold">
                {postData.content.link.preview.title}
              </h6>
              <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                {postData.content.link.preview.description}
              </p>
            </div>
            <div className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
              <Link2Icon className="size-3" />
              <span className="truncate">{postData.content.link.url}</span>
            </div>
          </div>
          <div className="relative w-40 shrink-0">
            <Image
              src={postData.content.link.preview.image.src}
              alt={postData.content.link.preview.image.alt}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm">
          <HeartIcon />
          <span className="text-muted-foreground text-sm">
            {postData.engagement.likes}
          </span>
        </Button>
        <Button variant="ghost" size="sm">
          <RepeatIcon />
          <span className="text-muted-foreground text-sm">
            {postData.engagement.reposts}
          </span>
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircleIcon />
          <span className="text-muted-foreground text-sm">
            {postData.engagement.comments}
          </span>
        </Button>
        <Button variant="ghost" size="icon-sm" className="ms-auto">
          <BookmarkIcon />
          <span className="sr-only">Bookmark</span>
        </Button>
      </div>
    </div>
  );
}
