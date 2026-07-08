"use client";

import { Label, Pie, PieChart } from "recharts";
import { ClockIcon, MessageCircleReplyIcon, TicketIcon } from "lucide-react";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@coreModule/components/uiKit/ui/chart";

import { Card, CardContent, CardFooter } from "@coreModule/components/uiKit/ui/card";

const chartData = [
  { browser: "new", tickets: 40, fill: "var(--color-new)" },
  { browser: "open", tickets: 25, fill: "var(--color-open)" },
];

const chartConfig = {
  new: {
    label: "New Tickets",
    color: "var(--chart-1)",
  },
  open: {
    label: "Open Tickets",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function PieChartComponent() {
  return (
    <Card className="mx-auto max-w-xl shadow-none">
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[270px] max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="tickets"
              nameKey="browser"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground font-display text-3xl"
                        >
                          88%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Completed
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start justify-start gap-4 border-t md:flex-row md:justify-between lg:items-center lg:gap-0">
        <div className="flex w-full items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border">
            <TicketIcon className="size-4" />
          </div>
          <div className="flex flex-1 flex-col justify-between md:justify-normal gap-1">
            <div className="text-sm">New Tickets</div>
            <div className="text-muted-foreground text-sm">40</div>
          </div>
        </div>
        <div className="flex w-full items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border">
            <ClockIcon className="size-4" />
          </div>
          <div className="flex flex-1 flex-col justify-between md:justify-normal gap-1">
            <div className="text-sm">Open Tickets</div>
            <div className="text-muted-foreground text-sm">25</div>
          </div>
        </div>
        <div className="flex w-full items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border">
            <MessageCircleReplyIcon className="size-4" />
          </div>
          <div className="flex flex-1 flex-col justify-between md:justify-normal gap-1">
            <div className="text-sm">Response Time</div>
            <div className="text-muted-foreground text-sm">1 Day</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
