"use client";

import { type LucideIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@coreModule/components/uiKit/ui/navigation-menu";
import { cn } from "@coreModule/components/lib/utils";

export function NavMainHorizontal({
  items
}: {
  items: {
    title: string;
    type: string;
    url?: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
      description?: string;
      icon?: LucideIcon;
    }[];
  }[];
}) {
  return (
    <NavigationMenu viewport={false} className="max-md:hidden">
      <NavigationMenuList className="gap-2">
        {items.map((link, index) => (
          <NavigationMenuItem key={index}>
            {link.items?.length ? (
              <>
                <NavigationMenuTrigger className="text-muted-foreground hover:text-primary bg-transparent px-2 py-1.5 font-medium *:[svg]:-me-0.5 *:[svg]:size-3.5">
                  {link.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="data-[motion=from-end]:slide-in-from-right-16! data-[motion=from-start]:slide-in-from-left-16! data-[motion=to-end]:slide-out-to-right-16! data-[motion=to-start]:slide-out-to-left-16! z-50 p-1">
                  <ul className={cn(link.type === "description" ? "min-w-64" : "min-w-48")}>
                    {link.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <NavigationMenuLink href={item.url} className="py-1.5">
                          {/* Display icon if present */}
                          {link.type === "icon" && "icon" in item && (
                            <div className="flex items-center gap-2">
                              {item.icon && (
                                <item.icon
                                  size={16}
                                  className="text-foreground opacity-60"
                                  aria-hidden="true"
                                />
                              )}
                              <span>{item.title}</span>
                            </div>
                          )}

                          {/* Display label with description if present */}
                          {link.type === "description" && "description" in item ? (
                            <div className="space-y-1">
                              <div className="font-medium">{item.title}</div>
                              <p className="text-muted-foreground line-clamp-2 text-xs">
                                {item.description}
                              </p>
                            </div>
                          ) : (
                            // Display simple label if not icon or description type
                            !link.type ||
                            (link.type !== "icon" && link.type !== "description" && (
                              <span>{item.title}</span>
                            ))
                          )}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                href={link.url}
                className="text-muted-foreground hover:text-primary py-1.5 font-medium">
                {link.title}
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
