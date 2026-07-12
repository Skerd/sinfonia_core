import {compose} from "redux";
import {useEffect, useMemo, useState} from "react";
import {useSelector} from "react-redux";
import {Users, MessageSquare, Globe, Activity, ChevronDown, Search, ChevronLeft, ChevronRight} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import type {
    WebSocketRoomStat,
    WebSocketRoomUserStat,
} from "armonia/src/modules/core/api/auxiliary/private/serverStats/serverStats.dto.ts";

type UserActivityProps = WithLanguageType & {}

const USERS_PAGE_SIZE = 10;
/** Show search/pager once a room has at least this many members. */
const USERS_CONTROLS_THRESHOLD = 8;

function humanizeRoomLabel(roomId: string): string {
    const spaced = roomId
        .replace(/[_-]+/g, " ")
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        .replace(/\s+/g, " ")
        .trim();
    if (!spaced) return roomId;
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function roomTitle(room: WebSocketRoomStat): string {
    return room.name && room.name !== room.id ? room.name : humanizeRoomLabel(room.id);
}

type RoomUsersListProps = WithLanguageType & {
    users: WebSocketRoomUserStat[];
};

function RoomUsersList({users, resolveLanguageKey}: RoomUsersListProps) {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const showControls = users.length >= USERS_CONTROLS_THRESHOLD;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter((user) =>
            (user.username || "").toLowerCase().includes(q) || user.id.toLowerCase().includes(q),
        );
    }, [users, query]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / USERS_PAGE_SIZE));
    const safePage = Math.min(page, pageCount - 1);
    const pageUsers = filtered.slice(safePage * USERS_PAGE_SIZE, (safePage + 1) * USERS_PAGE_SIZE);

    useEffect(() => {
        setPage(0);
    }, [query]);

    useEffect(() => {
        if (page > pageCount - 1) {
            setPage(Math.max(0, pageCount - 1));
        }
    }, [page, pageCount]);

    if (users.length === 0) {
        return <p className="text-xs text-muted-foreground">{resolveLanguageKey("noUsersInRoom")}</p>;
    }

    return (
        <div className="space-y-2">
            {showControls && (
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={resolveLanguageKey("searchUsers")}
                        className="h-8 pl-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground">{resolveLanguageKey("noUsersMatchSearch")}</p>
            ) : (
                <ul className="space-y-1">
                    {pageUsers.map((user) => (
                        <li
                            key={user.id}
                            className="flex items-center justify-between gap-2 text-sm"
                        >
                            <span className="truncate font-medium">{user.username}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {user.instances > 1
                                    ? resolveLanguageKey("tabCount").replace("{count}", String(user.instances))
                                    : resolveLanguageKey("oneTab")}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {showControls && filtered.length > USERS_PAGE_SIZE && (
                <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-muted-foreground">
                        {resolveLanguageKey("usersPageStatus")
                            .replace("{from}", String(safePage * USERS_PAGE_SIZE + 1))
                            .replace("{to}", String(Math.min((safePage + 1) * USERS_PAGE_SIZE, filtered.length)))
                            .replace("{total}", String(filtered.length))}
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={safePage <= 0}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPage((p) => Math.max(0, p - 1));
                            }}
                            aria-label={resolveLanguageKey("previousPage")}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-10 text-center text-xs text-muted-foreground">
                            {safePage + 1}/{pageCount}
                        </span>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={safePage >= pageCount - 1}
                            onClick={(e) => {
                                e.stopPropagation();
                                setPage((p) => Math.min(pageCount - 1, p + 1));
                            }}
                            aria-label={resolveLanguageKey("nextPage")}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserActivity({resolveLanguageKey}: UserActivityProps) {
    const stats = useSelector((state: RootState) => state.serverResources.serverStats);
    const wsStats = stats?.websocket;
    const [expandedRoomIds, setExpandedRoomIds] = useState<Record<string, boolean>>({});
    const [roomQuery, setRoomQuery] = useState("");

    const rooms: WebSocketRoomStat[] = useMemo(() => {
        const list = Array.isArray(wsStats?.rooms) ? (wsStats.rooms as WebSocketRoomStat[]) : [];
        return [...list].sort((a, b) => {
            const byUsers = (b.userCount || 0) - (a.userCount || 0);
            if (byUsers !== 0) return byUsers;
            return roomTitle(a).localeCompare(roomTitle(b));
        });
    }, [wsStats?.rooms]);

    const filteredRooms = useMemo(() => {
        const q = roomQuery.trim().toLowerCase();
        if (!q) return rooms;
        return rooms.filter((room) => {
            const title = roomTitle(room).toLowerCase();
            const id = room.id.toLowerCase();
            if (title.includes(q) || id.includes(q)) return true;
            const roomUsers = Array.isArray(room.users) ? room.users : [];
            return roomUsers.some((user) =>
                (user.username || "").toLowerCase().includes(q) || user.id.toLowerCase().includes(q),
            );
        });
    }, [rooms, roomQuery]);

    const toggleRoom = (roomId: string) => {
        setExpandedRoomIds((prev) => ({...prev, [roomId]: !prev[roomId]}));
    };

    if (!stats || !wsStats) {
        return (
            <Card className="w-full shadow-md">
                <CardHeader>
                    <CardTitle>{resolveLanguageKey("userActivityTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("waitingForActivityData")}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow-md px-3 py-2 space-y-1">
            <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">{resolveLanguageKey("userActivityTitle")}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        {resolveLanguageKey("live")}
                    </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                    {resolveLanguageKey("lastUpdated")}: {stats.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : "-"}
                </CardDescription>
            </CardHeader>
            <CardContent style={{padding: 0}}>
                <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center justify-center space-y-1 rounded-lg border bg-background p-3">
                            <Users className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">{resolveLanguageKey("activeUsers")}</span>
                            <span className="font-medium text-sm">{(wsStats.totalUsers || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center space-y-1 rounded-lg border bg-background p-3">
                            <Globe className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">{resolveLanguageKey("connections")}</span>
                            <span className="font-medium text-sm">{(wsStats.totalConnections || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center space-y-1 rounded-lg border bg-background p-3">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">{resolveLanguageKey("activeRooms")}</span>
                            <span className="font-medium text-sm">{(wsStats.totalRooms || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {rooms.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h4 className="text-sm font-semibold">{resolveLanguageKey("whoIsWhere")}</h4>
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={roomQuery}
                                        onChange={(e) => setRoomQuery(e.target.value)}
                                        placeholder={resolveLanguageKey("searchRoomsOrUsers")}
                                        className="h-8 pl-8 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredRooms.length === 0 ? (
                                    <p className="py-4 text-center text-xs text-muted-foreground">
                                        {resolveLanguageKey("noRoomsMatchSearch")}
                                    </p>
                                ) : filteredRooms.map((room) => {
                                    const expanded = !!expandedRoomIds[room.id];
                                    const roomUsers = Array.isArray(room.users) ? room.users : [];
                                    return (
                                        <div key={room.id} className="rounded-lg border bg-background">
                                            <button
                                                type="button"
                                                onClick={() => toggleRoom(room.id)}
                                                className="flex w-full items-center justify-between gap-3 p-2 text-left hover:bg-muted/40"
                                            >
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <ChevronDown
                                                        className={cn(
                                                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                                            expanded ? "rotate-0" : "-rotate-90",
                                                        )}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{roomTitle(room)}</p>
                                                        {room.name && room.name !== room.id && (
                                                            <p className="text-xs text-muted-foreground font-mono truncate">{room.id}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center space-x-3">
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">{resolveLanguageKey("users")}</p>
                                                        <p className="text-sm font-medium">{room.userCount || 0}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">{resolveLanguageKey("instances")}</p>
                                                        <p className="text-sm font-medium">{room.totalInstances || 0}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">{resolveLanguageKey("messages")}</p>
                                                        <p className="text-sm font-medium">{(room.messages || 0).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </button>
                                            {expanded && (
                                                <div className="border-t px-3 py-2">
                                                    <RoomUsersList
                                                        users={roomUsers}
                                                        resolveLanguageKey={resolveLanguageKey}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {rooms.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{resolveLanguageKey("noActiveRooms")}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverStats/userActivity.tsx")
)(UserActivity);
