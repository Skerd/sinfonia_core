"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Settings,
  Building2,
  Box,
  LayoutGrid,
  Users,
  Folder,
  Cloud,
  FileCode,
  User,
  Server,
  Database,
} from "lucide-react";
import { cn } from "@coreModule/components/lib/utils";

const items = [
  {
    label: "Build Workflow",
    icon: Settings,
    color: "text-teal-500 dark:text-teal-200",
    bg: "bg-teal-50 dark:bg-teal-950",
  },
  {
    label: "Organization",
    icon: Building2,
    color: "text-purple-500 dark:text-purple-200",
    bg: "bg-purple-50 dark:bg-purple-950",
  },
  {
    label: "Container",
    icon: Box,
    color: "text-cyan-500 dark:text-cyan-200",
    bg: "bg-cyan-50 dark:bg-cyan-950",
  },
  {
    label: "Container Registry",
    icon: LayoutGrid,
    color: "text-pink-500 dark:text-pink-200",
    bg: "bg-pink-50 dark:bg-pink-950",
  },
  {
    label: "Team",
    icon: Users,
    color: "text-indigo-500 dark:text-indigo-200",
    bg: "bg-indigo-50 dark:bg-indigo-950",
  },
  {
    label: "Container Repository",
    icon: Folder,
    color: "text-rose-500 dark:text-rose-200",
    bg: "bg-rose-50 dark:bg-rose-950",
  },
  {
    label: "GCP Compute Instance",
    icon: Cloud,
    color: "text-blue-500 dark:text-blue-200",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  {
    label: "Container Image",
    icon: FileCode,
    color: "text-fuchsia-500 dark:text-fuchsia-200",
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950",
  },
  {
    label: "Cloud Account",
    icon: Cloud,
    color: "text-sky-500 dark:text-sky-200",
    bg: "bg-sky-50 dark:bg-sky-950",
  },
  {
    label: "User",
    icon: User,
    color: "text-violet-500 dark:text-violet-200",
    bg: "bg-violet-50 dark:bg-violet-950",
  },
  {
    label: "AWS EC2 Instance",
    icon: Server,
    color: "text-blue-600 dark:text-blue-200",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  {
    label: "Repository",
    icon: Database,
    color: "text-slate-500 dark:text-slate-200",
    bg: "bg-slate-50 dark:bg-slate-800",
  },
];

type TagItem = {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
};
const Tag = ({ item }: { item: TagItem }) => (
  <div className="bg-background mx-2 flex min-w-max items-center gap-3 rounded-xl border px-4 py-2 whitespace-nowrap transition-transform duration-300 hover:scale-105">
    <div
      className={`rounded-xl p-2 ${item.bg} flex items-center justify-center`}
    >
      <item.icon className={cn(item.color, "size-3")} />
    </div>
    <span className="text-muted-foreground text-xs font-semibold tracking-tight">
      {item.label}
    </span>
  </div>
);

const MarqueeRow = ({
  direction = "left",
  speed = 40,
  itemsList,
}: {
  direction?: "left" | "right";
  speed?: number;
  itemsList: TagItem[];
}) => {
  const duplicatedItems = [
    ...itemsList,
    ...itemsList,
    ...itemsList,
    ...itemsList,
  ];

  return (
    <div className="flex overflow-hidden py-2 select-none">
      <motion.div
        className="flex"
        animate={{
          x: direction === "left" ? [0, -1000] : [-1000, 0],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {duplicatedItems.map((item, idx) => (
          <Tag key={idx} item={item} />
        ))}
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <div className="flex flex-col justify-center overflow-hidden">
      <div className="relative mx-auto w-full max-w-7xl mask-x-from-80% mask-x-to-90%">
        <MarqueeRow itemsList={items.slice(0, 6)} direction="left" speed={35} />
        <MarqueeRow
          itemsList={items.slice(6, 12)}
          direction="right"
          speed={45}
        />
        <MarqueeRow
          itemsList={[...items.slice(3, 7), ...items.slice(0, 2)]}
          direction="left"
          speed={40}
        />
        <MarqueeRow
          itemsList={[...items.slice(8, 12), ...items.slice(4, 6)]}
          direction="right"
          speed={38}
        />
      </div>
    </div>
  );
}
