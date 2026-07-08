import {useState} from "react";
import {useSelector} from "react-redux";
import {compose} from "redux";
import {Activity, TrendingUp, AlertTriangle, Clock, Zap, BarChart3} from "lucide-react";
import {clsx} from "clsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@coreModule/components/ui/table/table.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

type EndpointPerformanceProps = WithLanguageType & {}
type EndpointStat = {
    method: string;
    endpoint: string;
    count?: number;
    averageDuration?: number;
    p95?: number;
    p99?: number;
    errorRate?: string;
};

function EndpointPerformance({resolveLanguageKey}: EndpointPerformanceProps) {
    const stats = useSelector((state: RootState) => state.serverResources.serverStats);
    const [activeTab, setActiveTab] = useState<'slowest' | 'mostCalled' | 'errors'>('slowest');

    if (!stats || !stats.endpoints || !stats.summary) {
        return (
            <Card className="w-full shadow-md">
                <CardHeader>
                    <CardTitle>{resolveLanguageKey("endpointPerformanceTitle")}</CardTitle>
                    <CardDescription>{resolveLanguageKey("waitingForPerformanceData")}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const getMethodBadgeColor = (method: string) => {
        switch (method) {
            case 'GET': return 'bg-blue-500';
            case 'POST': return 'bg-green-500';
            case 'PUT': return 'bg-yellow-500';
            case 'DELETE': return 'bg-red-500';
            case 'PATCH': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    const getDurationColor = (duration: number) => {
        if (duration < 100) return 'text-green-600';
        if (duration < 500) return 'text-yellow-600';
        return 'text-red-600';
    };

    const currentEndpoints: EndpointStat[] = activeTab === 'slowest'
        ? ((stats.endpoints.slowest || []) as EndpointStat[])
        : activeTab === 'mostCalled'
        ? ((stats.endpoints.mostCalled || []) as EndpointStat[])
        : ((stats.endpoints.highestErrorRate || []) as EndpointStat[]);

    return (
        <Card className="w-full shadow-md px-3 py-2 space-y-1">
            <CardHeader className="p-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold">{resolveLanguageKey("endpointPerformanceTitle")}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {stats.summary.totalEndpointsTracked} {resolveLanguageKey("endpointsTracked")}
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
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">{resolveLanguageKey("totalMetrics")}</span>
                            <span className="font-medium text-sm">{(stats.summary.totalMetrics || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center space-y-1 rounded-lg border bg-background p-3">
                            <Zap className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">{resolveLanguageKey("uniqueEndpoints")}</span>
                            <span className="font-medium text-sm">{(stats.summary.uniqueEndpoints || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center space-y-1 rounded-lg border bg-background p-3">
                            <Activity className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">{resolveLanguageKey("tracked")}</span>
                            <span className="font-medium text-sm">{(stats.summary.totalEndpointsTracked || 0).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-2 border-b">
                        <button
                            onClick={() => setActiveTab('slowest')}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'slowest'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Clock className="inline h-4 w-4 mr-1" />
                            {resolveLanguageKey("slowest")}
                        </button>
                        <button
                            onClick={() => setActiveTab('mostCalled')}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'mostCalled'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <TrendingUp className="inline h-4 w-4 mr-1" />
                            {resolveLanguageKey("mostCalled")}
                        </button>
                        <button
                            onClick={() => setActiveTab('errors')}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                activeTab === 'errors'
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            {resolveLanguageKey("errors")}
                        </button>
                    </div>

                    {/* Endpoints Table */}
                    <div className="max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">{resolveLanguageKey("method")}</TableHead>
                                    <TableHead>{resolveLanguageKey("endpoint")}</TableHead>
                                    <TableHead className="text-right">{resolveLanguageKey("count")}</TableHead>
                                    <TableHead className="text-right">{resolveLanguageKey("avgMs")}</TableHead>
                                    <TableHead className="text-right">{resolveLanguageKey("p95Ms")}</TableHead>
                                    <TableHead className="text-right">{resolveLanguageKey("p99Ms")}</TableHead>
                                    {activeTab === 'errors' && (
                                        <TableHead className="text-right">{resolveLanguageKey("errorRate")}</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentEndpoints.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={activeTab === 'errors' ? 7 : 6} className="text-center text-muted-foreground">
                                            {resolveLanguageKey("noDataAvailable")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentEndpoints.map((endpoint, index: number) => (
                                        <TableRow key={`${endpoint.method}-${endpoint.endpoint}-${index}`}>
                                            <TableCell>
                                                <Badge className={clsx("text-xs", getMethodBadgeColor(endpoint.method))}>
                                                    {endpoint.method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs max-w-xs truncate">
                                                {endpoint.endpoint}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {(endpoint.count || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell className={clsx("text-right font-medium", getDurationColor(endpoint.averageDuration || 0))}>
                                                {endpoint.averageDuration || 0}ms
                                            </TableCell>
                                            <TableCell className={clsx("text-right", getDurationColor(endpoint.p95 || 0))}>
                                                {endpoint.p95 || 0}ms
                                            </TableCell>
                                            <TableCell className={clsx("text-right", getDurationColor(endpoint.p99 || 0))}>
                                                {endpoint.p99 || 0}ms
                                            </TableCell>
                                            {activeTab === 'errors' && (
                                                <TableCell className="text-right">
                                                    <Badge variant={parseFloat(endpoint.errorRate || "0") > 5 ? "destructive" : "outline"}>
                                                        {endpoint.errorRate || "0"}%
                                                    </Badge>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/online/serverStats/endpointPerformance.tsx")
)(EndpointPerformance);
