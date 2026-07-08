"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@coreModule/components/uiKit/ui/chart";

const chartData = [
  { date: "2026-01-02", desktop: 222, mobile: 150 },
  { date: "2026-01-03", desktop: 97, mobile: 180 },
  { date: "2026-01-04", desktop: 167, mobile: 120 },
  { date: "2026-01-05", desktop: 242, mobile: 260 },
  { date: "2026-01-06", desktop: 373, mobile: 290 },
  { date: "2026-01-07", desktop: 301, mobile: 340 },
  { date: "2026-01-08", desktop: 245, mobile: 180 },
  { date: "2026-01-09", desktop: 409, mobile: 320 },
  { date: "2026-01-10", desktop: 59, mobile: 110 },
  { date: "2026-01-11", desktop: 261, mobile: 190 },
  { date: "2026-01-12", desktop: 327, mobile: 350 },
  { date: "2026-01-13", desktop: 292, mobile: 210 },
  { date: "2026-01-14", desktop: 342, mobile: 380 },
  { date: "2026-01-15", desktop: 137, mobile: 220 },
  { date: "2026-01-16", desktop: 120, mobile: 170 },
  { date: "2026-01-17", desktop: 138, mobile: 190 },
  { date: "2026-01-18", desktop: 446, mobile: 360 },
  { date: "2026-01-19", desktop: 364, mobile: 410 },
  { date: "2026-01-20", desktop: 243, mobile: 180 },
  { date: "2026-01-21", desktop: 89, mobile: 150 },
  { date: "2026-01-22", desktop: 137, mobile: 200 },
  { date: "2026-01-23", desktop: 224, mobile: 170 },
  { date: "2026-01-24", desktop: 138, mobile: 230 },
  { date: "2026-01-25", desktop: 387, mobile: 290 },
  { date: "2026-01-26", desktop: 215, mobile: 250 },
  { date: "2026-01-27", desktop: 75, mobile: 130 },
  { date: "2026-01-28", desktop: 383, mobile: 420 },
  { date: "2026-01-29", desktop: 122, mobile: 180 },
  { date: "2026-01-30", desktop: 315, mobile: 240 },
  { date: "2026-01-31", desktop: 454, mobile: 380 },
  { date: "2026-02-01", desktop: 165, mobile: 220 },
  { date: "2026-02-02", desktop: 293, mobile: 310 },
  { date: "2026-02-03", desktop: 247, mobile: 190 },
  { date: "2026-02-04", desktop: 385, mobile: 420 },
  { date: "2026-02-05", desktop: 481, mobile: 390 },
  { date: "2026-02-06", desktop: 498, mobile: 520 },
  { date: "2026-02-07", desktop: 388, mobile: 300 },
  { date: "2026-02-08", desktop: 149, mobile: 210 },
  { date: "2026-02-09", desktop: 227, mobile: 180 },
  { date: "2026-02-10", desktop: 293, mobile: 330 },
  { date: "2026-02-11", desktop: 335, mobile: 270 },
  { date: "2026-02-12", desktop: 197, mobile: 240 },
  { date: "2026-02-13", desktop: 197, mobile: 160 },
  { date: "2026-02-14", desktop: 448, mobile: 490 },
  { date: "2026-02-15", desktop: 473, mobile: 380 },
  { date: "2026-02-16", desktop: 338, mobile: 400 },
  { date: "2026-02-17", desktop: 499, mobile: 420 },
  { date: "2026-02-18", desktop: 315, mobile: 350 },
  { date: "2026-02-19", desktop: 235, mobile: 180 },
  { date: "2026-02-20", desktop: 177, mobile: 230 },
  { date: "2026-02-21", desktop: 82, mobile: 140 },
];

const chartConfig = {
  views: {
    label: "Page Views",
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-2)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function RevenueChartComponent() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop");

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    [],
  );

  return (
    <Card className="mx-auto max-w-xl shadow-none relative">
      <CardHeader>
        <CardTitle>Revenue Chart</CardTitle>
        <CardDescription>Last 28 days</CardDescription>
        <CardAction className="col-start-auto row-start-auto justify-self-start md:col-start-2 md:row-start-1 md:justify-self-end">
          <div className="end-0 top-0 flex divide-x rounded-md border-s border-e border-t border-b md:absolute md:rounded-none md:rounded-bl-md md:border-e-transparent md:border-t-transparent">
            {["desktop", "mobile"].map((key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="data-[active=true]:bg-muted relative flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-muted-foreground text-xs">
                    {chartConfig[chart].label}
                  </span>
                  <span className="font-display text-lg font-medium leading-none sm:text-2xl">
                    {total[key as keyof typeof total].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[186px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill={`var(--color-${activeChart})`}
              radius={5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
