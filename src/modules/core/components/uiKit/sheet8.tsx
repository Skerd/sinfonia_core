"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@coreModule/components/uiKit/ui/sheet";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function SheetComponent() {
  const [showMoreAbout, setShowMoreAbout] = useState(false);
  const [showMoreSkills, setShowMoreSkills] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const aboutRef = useRef<HTMLParagraphElement>(null);
  const [isAboutTruncated, setIsAboutTruncated] = useState(false);

  const fullAboutText =
    "Hi, I am Martha Josef. My professional experience is in UI UX & Product Design. I started my career as a Graphic Designer, but gradually developed my skills as a UI UX Designer. Over the years, I have worked with various companies and startups, helping them create intuitive and user-friendly interfaces. My passion lies in understanding user behavior and translating that into beautiful, functional designs. I specialize in creating design systems, conducting user research, and collaborating with cross-functional teams to deliver exceptional products.";

  const allSkills = [
    "Angular",
    "JavaScript",
    "UI",
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Figma",
    "Adobe XD",
    "Vue.js",
    "Node.js",
    "Python",
    "PostgreSQL",
    "MongoDB"
  ];

  const visibleSkills = allSkills.slice(0, 7);
  const hiddenSkills = allSkills.slice(7);

  useEffect(() => {
    if (!isOpen) {
      setIsAboutTruncated(false);
      return;
    }

    const checkTruncation = () => {
      if (aboutRef.current) {
        if (!showMoreAbout) {
          const isTruncated = aboutRef.current.scrollHeight > aboutRef.current.clientHeight;
          setIsAboutTruncated(isTruncated);
        } else {
          setIsAboutTruncated(true);
        }
      }
    };

    const timeoutId = setTimeout(checkTruncation, 100);
    const resizeObserver = new ResizeObserver(checkTruncation);

    if (aboutRef.current) {
      resizeObserver.observe(aboutRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [showMoreAbout, isOpen]);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">User Profile</Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Profile</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=200&fit=crop"
            alt="Cover"
            className="h-32 w-full object-cover"
          />

          <div className="-mt-24 flex flex-col items-center space-y-2 p-4">
            <Avatar className="border-background size-24 border-4">
              <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="Darrell Steward" />
              <AvatarFallback className="text-lg">DS</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <h2 className="text-xl font-semibold">Darrell Steward</h2>
              <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-sm">
                <MapPin className="size-4" />
                <span>Los Angeles, United States</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-y py-4">
            <div className="space-y-1 text-center">
              <p className="text-2xl font-semibold">2</p>
              <p className="text-muted-foreground text-xs">Experience</p>
            </div>
            <div className="space-y-1 border-r text-center">
              <p className="text-2xl font-semibold">12</p>
              <p className="text-muted-foreground text-xs">Rejected</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-2xl font-semibold">10</p>
              <p className="text-muted-foreground text-xs">Hired</p>
            </div>
          </div>

          <div className="space-y-3 px-4">
            <h3>About</h3>
            <p
              ref={aboutRef}
              className={`text-muted-foreground text-sm leading-relaxed ${
                !showMoreAbout ? "line-clamp-3" : ""
              }`}>
              {fullAboutText}
            </p>
            {(isAboutTruncated || showMoreAbout) && (
              <button
                onClick={() => setShowMoreAbout(!showMoreAbout)}
                className="text-primary text-sm underline">
                {showMoreAbout ? "View less" : "View more"}
              </button>
            )}
          </div>

          <Separator />

          <div className="space-y-3 px-4">
            <h3>Skill</h3>
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  <Check className="size-3" />
                  {skill}
                </Badge>
              ))}
              {showMoreSkills &&
                hiddenSkills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    <Check className="size-3" />
                    {skill}
                  </Badge>
                ))}
              {!showMoreSkills && hiddenSkills.length > 0 && (
                <Badge className="cursor-pointer gap-1.5" onClick={() => setShowMoreSkills(true)}>
                  +{hiddenSkills.length}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3 px-4">
            <h3>Contact Detail</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="text-muted-foreground size-4" />
                <span className="text-sm">(405) 555-0128</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-muted-foreground size-4" />
                <span className="text-sm">jackson.graham@example.com</span>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4">
            <Button className="w-full">Profile Update</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
