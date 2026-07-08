"use client";

import * as React from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@coreModule/components/uiKit/ui/select";

const desktopData = [
  { month: "january", desktop: 186, fill: "var(--color-january)" },
  { month: "february", desktop: 305, fill: "var(--color-february)" },
  { month: "march", desktop: 237, fill: "var(--color-march)" },
  { month: "april", desktop: 173, fill: "var(--color-april)" },
  { month: "may", desktop: 209, fill: "var(--color-may)" }
];

const chartConfig = {
  visitors: {
    label: "Visitors"
  },
  desktop: {
    label: "Desktop"
  },
  mobile: {
    label: "Mobile"
  },
  january: {
    label: "January",
    color: "var(--chart-1)"
  },
  february: {
    label: "February",
    color: "var(--chart-2)"
  },
  march: {
    label: "March",
    color: "var(--chart-3)"
  },
  april: {
    label: "April",
    color: "var(--chart-4)"
  },
  may: {
    label: "May",
    color: "var(--chart-5)"
  }
} satisfies ChartConfig;

export default function ChartProjectEfficiency() {
  const id = "pie-interactive";
  const [activeMonth, setActiveMonth] = React.useState(desktopData[0].month);

  const activeIndex = React.useMemo(
    () => desktopData.findIndex((item) => item.month === activeMonth),
    [activeMonth]
  );
  const months = React.useMemo(() => desktopData.map((item) => item.month), []);

  return (
    <Card className="w-full md:w-[500px]">
      <CardHeader>
        <CardTitle className="font-display text-xl">Project Efficiency</CardTitle>
        <CardDescription>January - June 2026</CardDescription>
        <CardAction className="relative col-start-auto row-start-auto justify-self-start lg:col-start-2 lg:row-start-1 lg:justify-self-end">
          <div className="end-0 top-0 mt-2 flex flex-col items-stretch space-y-0 p-0 sm:flex-row lg:absolute lg:mt-0">
            <Select value={activeMonth} onValueChange={setActiveMonth}>
              <SelectTrigger className="ml-auto w-full lg:w-auto" aria-label="Select a value">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent align="end">
                {months.map((key) => {
                  const config = chartConfig[key as keyof typeof chartConfig];
                  if (!config) return null;

                  const color = "color" in config ? config.color : undefined;

                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2 text-xs">
                        <span
                          className="flex h-3 w-3 shrink-0 rounded-sm"
                          style={{
                            backgroundColor: color
                          }}
                        />
                        {config?.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id={id}
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[230px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={desktopData}
              dataKey="desktop"
              nameKey="month"
              innerRadius={45}
              strokeWidth={5}
              activeIndex={activeIndex}
              activeShape={({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 5} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 20}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle">
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold">
                          {desktopData[activeIndex].desktop.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground">
                          Visitors
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
    </Card>
  );
}
