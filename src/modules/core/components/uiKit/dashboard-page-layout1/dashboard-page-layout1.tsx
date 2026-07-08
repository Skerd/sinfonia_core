import { SidebarInset, SidebarProvider } from "@coreModule/components/uiKit/ui/sidebar";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-muted/50 grid min-h-[100vh] flex-1 place-items-center rounded-xl md:min-h-min">
            <span className="text-muted-foreground text-sm">Content goes here</span>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
