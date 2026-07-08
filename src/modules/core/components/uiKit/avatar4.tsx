import { Avatar, AvatarFallback, AvatarImage } from "@coreModule/components/uiKit/ui/avatar";

export default function AvatarComponent() {
  return (
    <div className="relative">
      <Avatar>
        <AvatarImage alt="Kelly King" src="https://i.pravatar.cc/150?img=80" />
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <span className="border-background absolute -end-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-emerald-500">
        <span className="sr-only">Online</span>
      </span>
    </div>
  );
}
