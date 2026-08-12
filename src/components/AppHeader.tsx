import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "./DynamicBreadcrumb";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { UserAvatar } from "./UserAvatar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-3 bg-card/90 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/75 md:gap-4 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="-ml-1 rounded-full" />
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <DynamicBreadcrumb />
        </div>
      </div>

      <div className="hidden max-w-md flex-1 justify-center lg:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="lg:hidden">
          <GlobalSearch />
        </div>
        <NotificationsDrawer />
        <UserAvatar />
      </div>
    </header>
  );
}
