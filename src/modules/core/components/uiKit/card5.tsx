import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coreModule/components/uiKit/ui/tabs";

interface TabItem {
  name: string;
  value: string;
  content: string;
}

const tabs: TabItem[] = [
  {
    name: "Overview",
    value: "overview",
    content:
      "Get a comprehensive view of your project metrics, recent activity, and key performance indicators. Monitor your progress and stay on top of important updates."
  },
  {
    name: "Analytics",
    value: "analytics",
    content:
      "Dive deep into your data with detailed analytics and insights. Track trends, identify patterns, and make data-driven decisions to optimize your workflow."
  },
  {
    name: "Settings",
    value: "settings",
    content:
      "Customize your preferences and configure your workspace. Manage integrations, adjust notification settings, and personalize your experience to match your needs."
  }
];

export default function Component() {
  return (
    <Tabs defaultValue={tabs[0].value}>
      <Card className="border-t-0 pt-0 shadow-none">
        <TabsList className="before:bg-border relative h-auto w-full gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="bg-muted data-[state=active]:border-border overflow-hidden rounded-b-none border-x border-t py-2 data-[state=active]:z-10 data-[state=active]:border-b-transparent data-[state=active]:shadow-none">
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <CardContent>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <p className="text-muted-foreground text-sm leading-relaxed">{tab.content}</p>
            </TabsContent>
          ))}
        </CardContent>
      </Card>
    </Tabs>
  );
}
