import {compose} from "redux";
import {useSelector} from "react-redux";
import {Users, MessageSquare, Globe, Activity} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type UserActivityProps = WithLanguageType & {}
type WebSocketRoomStat = {
    id: string;
    name: string;
    userCount?: number;
    totalInstances?: number;
    messages?: number;
};

function UserActivity({resolveLanguageKey}: UserActivityProps) {
    const stats = useSelector((state: RootState) => state.serverResources.serverStats);
    const wsStats = stats?.websocket;
    const rooms: WebSocketRoomStat[] = Array.isArray(wsStats?.rooms) ? wsStats.rooms as WebSocketRoomStat[] : [];

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
                    {/* Summary Stats */}
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

                    {/* Rooms List */}
                    {rooms.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">{resolveLanguageKey("activeRooms")}</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {rooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="flex items-center justify-between p-2 rounded-lg border bg-background"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{room.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono truncate">{room.id}</p>
                                        </div>
                                        <div className="flex items-center space-x-3 ml-4">
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
                                    </div>
                                ))}
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
