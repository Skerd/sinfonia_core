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
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import {
  BookmarkIcon,
  CopyIcon,
  CornerUpRightIcon,
  EditIcon,
  FlagIcon,
  HeartIcon,
  MessageCircleIcon,
  MicIcon,
  MoreHorizontalIcon,
  PaperclipIcon,
  Share2Icon,
  SmileIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const postData = {
  author: {
    avatar: "https://i.pravatar.cc/150?img=12",
    name: "Ray Hammond",
    location: {
      city: "New-York",
      country: "United States",
    },
    timestamp: "Thursday, Jun 31, 5:50 PM",
  },
  content: {
    text: "I'm so glad to share with you guys some photos from my recent trip to the New-York. This city looks amazing, the buildings, nature, people all are beautiful, i highly recommend to visit this cool place! Also i would like to know what is your favorite place here or what you would like to visit? 🥰",
    images: [
      {
        alt: "Modern skyscrapers from low angle",
        src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      },
      {
        alt: "Glass building facade at night",
        src: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&q=80",
      },
    ],
  },
  engagement: {
    likeAvatars: [
      "https://i.pravatar.cc/150?img=33",
      "https://i.pravatar.cc/150?img=25",
      "https://i.pravatar.cc/150?img=44",
      "https://i.pravatar.cc/150?img=49",
    ],
    likes: 245,
    comments: 8,
    shares: 0,
  },
  comments: [
    {
      id: 1,
      author: {
        avatar: "https://i.pravatar.cc/150?img=45",
        name: "Cynthia Henry",
      },
      timestamp: "Today at 3:30 PM",
      text: "Wow, those photos looks amazing, i'm going to visit New-York on next week. Can you recommend some cool locations to visit there? 🙏",
      likes: 9,
      replies: 2,
    },
  ],
};

export default function CardComponent() {
  return (
    <Card className="w-full max-w-xl shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex gap-3">
          <Avatar className="size-10">
            <AvatarImage
              src={postData.author.avatar}
              alt={`${postData.author.name} avatar`}
            />
          </Avatar>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-semibold">{postData.author.name}</span>
              <span className="text-muted-foreground">is at</span>
              <Link href="#" className="text-blue-500 hover:underline">
                {postData.author.location.city}
              </Link>
            </div>
            <p className="text-muted-foreground text-xs">
              {postData.author.timestamp}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontalIcon />
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
        <p className="text-sm leading-relaxed">{postData.content.text}</p>

        <div className="grid grid-cols-2 gap-2">
          {postData.content.images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-4/3 overflow-hidden rounded-lg"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
              {postData.engagement.likeAvatars.map((avatar, index) => (
                <Avatar
                  key={index}
                  className="border-background size-7 border-3"
                >
                  <AvatarImage src={avatar} alt="User avatar" />
                </Avatar>
              ))}
            </div>
            <span className="text-muted-foreground text-xs">
              + {postData.engagement.likes} Likes
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-around">
          <Button variant="ghost" size="sm">
            <HeartIcon />
            <span>Like</span>
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircleIcon />
            <span>{postData.engagement.comments} Comments</span>
          </Button>
          <Button variant="ghost" size="sm">
            <Share2Icon />
            <span>{postData.engagement.shares} Shares</span>
          </Button>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage
              src="https://i.pravatar.cc/150?img=68"
              alt="Your avatar"
            />
          </Avatar>
          <div className="bg-muted relative flex flex-1 items-center gap-2 rounded-full px-4 py-1">
            <Input
              placeholder="Write a comment..."
              className="border-0 bg-transparent! p-0 focus-visible:ring-0"
            />
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm">
                <PaperclipIcon className="size-4" />
                <span className="sr-only">Attach file</span>
              </Button>
              <Button variant="ghost" size="icon-sm">
                <MicIcon className="size-4" />
                <span className="sr-only">Voice message</span>
              </Button>
              <Button variant="ghost" size="icon-sm">
                <SmileIcon className="size-4" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start gap-4">
        {postData.comments.map((comment) => (
          <div key={comment.id} className="flex w-full gap-3">
            <Avatar>
              <AvatarImage
                src={comment.author.avatar}
                alt={`${comment.author.name} avatar`}
              />
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold">{comment.author.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {comment.timestamp}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <HeartIcon className="fill-destructive text-destructive size-4" />
                    <span className="text-sm">{comment.likes}</span>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <CornerUpRightIcon className="size-4" />
                    <span className="sr-only">Reply</span>
                  </Button>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{comment.text}</p>
              <Link href="#" className="text-sm text-blue-500 hover:underline">
                – View {comment.replies} replies
              </Link>
            </div>
          </div>
        ))}

        <Link href="#" className="text-sm text-blue-500 hover:underline">
          Show 5 more comments
        </Link>
      </CardFooter>
    </Card>
  );
}
