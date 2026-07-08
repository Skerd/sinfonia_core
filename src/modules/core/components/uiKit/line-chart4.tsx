"use client";

import { Area, AreaChart, CartesianGrid } from "recharts";
import { useState } from "react";

import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@coreModule/components/uiKit/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@coreModule/components/uiKit/ui/chart";
import { Badge } from "@coreModule/components/uiKit/ui/badge";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Calendar } from "@coreModule/components/uiKit/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@coreModule/components/uiKit/ui/popover";
import { ChevronDownIcon } from "lucide-react";

const chartData = [
  { month: "January", desktop: 4 },
  { month: "February", desktop: 5 },
  { month: "March", desktop: 4 },
  { month: "April", desktop: 6 },
  { month: "May", desktop: 6 },
  { month: "June", desktop: 7 },
  { month: "July", desktop: 8 },
  { month: "August", desktop: 7 },
  { month: "September", desktop: 9 },
  { month: "October", desktop: 8 },
  { month: "November", desktop: 7 },
  { month: "December", desktop: 9 }
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)"
  }
} satisfies ChartConfig;

export default function Component() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);

  return (
    <Card className="w-full pb-0 lg:w-[600px]">
      <CardHeader>
        <CardTitle>Course Progress by Month</CardTitle>
        <CardDescription className="flex items-center gap-2">
          Compared to previous month 50.56%
          <Badge>+2.5%</Badge>
        </CardDescription>
        <CardAction>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" id="date" className="w-48 justify-between font-normal">
                {date ? date.toLocaleDateString() : "Select date"}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(date) => {
                  setDate(date);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </CardAction>
      </CardHeader>
      <ChartContainer className="w-full lg:h-[200px]" config={chartConfig}>
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 0,
            right: 0
          }}>
          <CartesianGrid vertical={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <defs>
            <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            dataKey="mobile"
            type="natural"
            fill="url(#fillMobile)"
            fillOpacity={0.4}
            stroke="var(--color-mobile)"
            stackId="a"
          />
          <Area
            dataKey="desktop"
            type="natural"
            fill="url(#fillDesktop)"
            fillOpacity={0.4}
            stroke="var(--color-desktop)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  );
}
