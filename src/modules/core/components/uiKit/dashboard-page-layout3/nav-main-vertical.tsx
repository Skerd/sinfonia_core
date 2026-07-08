"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@coreModule/components/uiKit/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@coreModule/components/uiKit/ui/sidebar";

export function NavMainVertical({
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
    <>
      {items.map((item, i) => (
        <SidebarGroup>
          <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
          <SidebarMenu>
            {item.items?.length ? (
              <>
                {item.items?.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton asChild>
                      <a href={subItem.url}>
                        <span>{subItem.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </>
            ) : null}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
