"use client";

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@coreModule/components/uiKit/ui/command";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { ScrollArea } from "@coreModule/components/uiKit/ui/scroll-area";
import {
  SearchIcon,
  CheckIcon,
  MapPinIcon,
  StarIcon,
  MoreHorizontalIcon,
  TwitterIcon,
  LinkedinIcon,
  ExternalLinkIcon
} from "lucide-react";

const users = [
  {
    id: 1,
    name: "Frankie Sullivan",
    avatar: "https://i.pravatar.cc/150?img=12",
    location: "Melbourne, Australia",
    verified: true,
    bio: "I'm a Frontend Dev based in London. Open to new opportunities from January 2024.",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    dribbble: "https://dribbble.com",
    portfolio: "https://example.com"
  },
  {
    id: 2,
    name: "Amélie Laurent",
    avatar: "https://i.pravatar.cc/150?img=47",
    location: "London, United Kingdom",
    verified: true,
    bio: "I'm a Frontend Dev based in London. Open to new opportunities from January 2024.",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    dribbble: "https://dribbble.com",
    portfolio: "https://example.com"
  },
  {
    id: 3,
    name: "Olive Nacelle",
    avatar: "https://i.pravatar.cc/150?img=33",
    location: "Paris, France",
    verified: false,
    bio: "Product Designer passionate about creating beautiful user experiences.",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    dribbble: "https://dribbble.com",
    portfolio: "https://example.com"
  },
  {
    id: 4,
    name: "Oliver Chamberlain",
    avatar: "https://i.pravatar.cc/150?img=25",
    location: "New York, USA",
    verified: true,
    bio: "Full-stack developer with 5+ years of experience in web development.",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    dribbble: "https://dribbble.com",
    portfolio: "https://example.com"
  },
  {
    id: 5,
    name: "Andi Lane",
    avatar: "https://i.pravatar.cc/150?img=19",
    location: "San Francisco, USA",
    verified: false,
    bio: "UI/UX Designer focused on creating intuitive and accessible designs.",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    dribbble: "https://dribbble.com",
    portfolio: "https://example.com"
  },
  {
    id: 6,
    name: "Drew Cano",
    avatar: "https://i.pravatar.cc/150?img=51",
    location: "Berlin, Germany",
    verified: true,
    bio: "Backend engineer specializing in scalable systems and APIs.",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    dribbble: "https://dribbble.com",
    portfolio: "https://example.com"
  },
  {
    id: 7,
    name: "Sophia Munn",
    avatar: "https://i.pravatar.cc/150?img=45",
    location: "Tokyo, Japan",
    verified: false,
    bio: "Creative director with expertise in branding and visual identity.",
    twitter: "https://twitter.com",
    linkedin: "https://linkedin.com",
    dribbble: "https://dribbble.com",
    portfolio: "https://example.com"
  }
];

export default function CommandComponent() {
  const [selectedUser, setSelectedUser] = useState(users[1]);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleUserSelect = (user: (typeof users)[0]) => {
    setSelectedUser(user);
  };

  return (
    <div className="flex h-[600px] w-full max-w-5xl overflow-hidden rounded-lg border bg-background shadow-lg">
      <div className="flex w-full flex-col">
        <div className="border-b p-4">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background w-full rounded-md border px-10 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-xs">
              ⌘K
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r flex flex-col">
            <ScrollArea className="flex-1">
              <Command className="rounded-none border-0 h-full">
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleUserSelect(user)}
                        className={`cursor-pointer ${
                          selectedUser.id === user.id ? "bg-muted" : ""
                        }`}>
                        <div className="flex w-full items-center gap-3 px-2 py-2">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium">{user.name}</span>
                              {user.verified && (
                                <CheckIcon className="text-blue-500 h-4 w-4" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPinIcon className="h-3 w-3" />
                              <span>{user.location}</span>
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </ScrollArea>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6">
            {selectedUser && (
              <div className="mx-auto max-w-md">
                <div className="relative mb-4">
                  <div className="relative mx-auto h-24 w-24">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                      <AvatarFallback>
                        {selectedUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {selectedUser.verified && (
                      <div className="bg-background absolute bottom-0 right-0 rounded-full border-2 p-0.5">
                        <CheckIcon className="text-blue-500 h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="absolute right-0 top-0 flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <StarIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedUser.name}</h2>
                    <p className="text-muted-foreground mt-2 text-sm">{selectedUser.bio}</p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                      <TwitterIcon className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                      <LinkedinIcon className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                      <div className="bg-pink-500 flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold">
                        D
                      </div>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                      <ExternalLinkIcon className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1">
                      View portfolio
                    </Button>
                    <Button className="flex-1">
                      <span className="mr-2">+</span>
                      Follow
                    </Button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

