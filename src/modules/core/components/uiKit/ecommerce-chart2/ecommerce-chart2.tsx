"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@coreModule/components/uiKit/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@coreModule/components/uiKit/ui/chart";

import { chartData } from "./data";

const chartConfig = {
  views: {
    label: "Page Views"
  },
  desktop: {
    label: "Desktop",
    color: "var(--chart-2)"
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

export default function EcommerceChart() {
  const [activeChart, setActiveChart] = React.useState<keyof typeof chartConfig>("desktop");

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0)
    }),
    []
  );

  return (
    <Card className="relative w-full md:w-[500px]">
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
                  onClick={() => setActiveChart(chart)}>
                  <span className="text-muted-foreground text-xs">{chartConfig[chart].label}</span>
                  <span className="text-lg leading-none font-semibold sm:text-2xl">
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
              bottom: 0
            }}>
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
                  day: "numeric"
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
                      year: "numeric"
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
