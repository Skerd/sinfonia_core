"use client";

import * as React from "react";
import { BookOpenIcon, InfoIcon, LifeBuoyIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@coreModule/components/uiKit/ui/sidebar";
import { NavMainVertical } from "./nav-main-vertical";
import { useIsMobile } from "@coreModule/components/uiKit/hooks/use-mobile";
import { Logo } from "./logo";

export const navigationLinks = [
  {
    title: "Get Started",
    type: "description",
    isActive: true,
    items: [
      {
        url: "#",
        title: "Dashboard",
        description: "Browse all components in the library."
      },
      {
        url: "#",
        title: "Ecommerce",
        description: "Learn how to use the library."
      },
      {
        url: "#",
        title: "Reports",
        description: "Pre-built layouts for common use cases."
      }
    ]
  },
  {
    title: "Apps",
    type: "simple",
    items: [
      { url: "#", title: "Chats" },
      { url: "#", title: "Kanban Board" },
      { url: "#", title: "Notes" },
      { url: "#", title: "Event Calendar" }
    ]
  },
  {
    title: "Pages",
    type: "icon",
    items: [
      { url: "#", title: "Profile Page", icon: BookOpenIcon },
      { url: "#", title: "User List", icon: LifeBuoyIcon },
      { url: "#", title: "Pricing Page", icon: InfoIcon }
    ]
  }
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Logo />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMainVertical items={navigationLinks} />
      </SidebarContent>
    </Sidebar>
  );
}
