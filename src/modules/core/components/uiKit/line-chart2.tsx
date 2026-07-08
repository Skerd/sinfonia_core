"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@coreModule/components/uiKit/ui/chart";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@coreModule/components/uiKit/ui/card";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { EllipsisIcon } from "lucide-react";

const chartData = [
  { month: "January", received: 100, send: 180, withdraw: 190 },
  { month: "February", received: 205, send: 200, withdraw: 150 },
  { month: "March", received: 137, send: 120, withdraw: 180 },
  { month: "April", received: 73, send: 230, withdraw: 120 },
  { month: "May", received: 129, send: 130, withdraw: 125 },
  { month: "June", received: 114, send: 140, withdraw: 170 },
  { month: "July", received: 134, send: 170, withdraw: 140 }
];

const chartConfig = {
  received: {
    label: "Total Received",
    color: "var(--chart-1)"
  },
  send: {
    label: "Total Send",
    color: "var(--chart-2)"
  },
  withdraw: {
    label: "Total Withdraw",
    color: "var(--chart-3)"
  }
} satisfies ChartConfig;

export default function BalanceSummeryChart() {
  return (
    <Card className="w-full lg:w-[600px]">
      <CardHeader>
        <CardTitle>Balance Summary</CardTitle>
        <CardAction className="-mt-2">
          <Button size="icon" variant="ghost">
            <EllipsisIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-8 grid gap-4 text-sm md:grid-cols-3">
          <div className="bg-muted space-y-2 rounded-md p-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--chart-1)]"></span>
              <span className="text-muted-foreground text-sm">{chartConfig.received.label}</span>
            </div>
            <div className="text-xl font-semibold">2.010550 BTC</div>
          </div>
          <div className="bg-muted space-y-2 rounded-md p-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--chart-2)]"></span>
              <span className="text-muted-foreground text-sm">{chartConfig.send.label}</span>
            </div>
            <div className="text-xl font-semibold">1.201055 BTC</div>
          </div>
          <div className="bg-muted space-y-2 rounded-md p-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[var(--chart-3)]"></span>
              <span className="text-muted-foreground text-sm">{chartConfig.withdraw.label}</span>
            </div>
            <div className="text-xl font-semibold">5.41055 BTC</div>
          </div>
        </div>
        <ChartContainer className="w-full lg:h-[200px]" config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="received"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="send"
              type="monotone"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              dataKey="withdraw"
              type="monotone"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
