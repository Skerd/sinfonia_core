import Image from "next/image";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coreModule/components/uiKit/ui/tabs";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const tabContent = {
  "workflow-automation": {
    description:
      "Transform your business operations with powerful automation capabilities. Our platform enables seamless workflow management, real-time process optimization, and intelligent task delegation. Experience enhanced efficiency and productivity through automated solutions that adapt to your business needs.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=500&auto=format&fit=crop&ixlib=rb-4.1.0",
    features: [
      {
        title: "Intelligent Task Routing",
        description:
          "Automatically assign tasks to the right team members using smart algorithms.",
      },
      {
        title: "Performance Metrics",
        description:
          "Track productivity and measure outcomes with comprehensive analytics.",
      },
      {
        title: "Real-Time Updates",
        description:
          "Stay synchronized with instant notifications and live status updates.",
      },
      {
        title: "Schedule Management",
        description:
          "Organize and manage timelines with intelligent scheduling capabilities.",
      },
    ],
  },
  "team-collaboration": {
    description:
      "Build stronger teams with our comprehensive collaboration platform. Enable real-time communication, shared workspaces, and collaborative project management. Break down silos and create a unified work environment where ideas flow freely and productivity soars.",
    image:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=500&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    features: [
      {
        title: "Unified Workspaces",
        description:
          "Create shared spaces where teams can collaborate in real-time.",
      },
      {
        title: "Team Analytics",
        description:
          "Understand team dynamics and collaboration patterns with detailed insights.",
      },
      {
        title: "Instant Communication",
        description:
          "Connect instantly with integrated messaging and video conferencing.",
      },
      {
        title: "Task Completion",
        description:
          "Track and manage task completion with automated workflows and notifications.",
      },
    ],
  },
  "data-analytics": {
    description:
      "Unlock the power of your data with advanced analytics capabilities. Transform raw information into actionable insights through intuitive dashboards, custom reports, and predictive analytics. Drive strategic decisions with confidence using data-driven intelligence.",
    image:
      "https://images.unsplash.com/photo-1603201667141-5a2d4c673378?q=80&w=500&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    features: [
      {
        title: "Custom Dashboards",
        description:
          "Build personalized dashboards tailored to your specific business needs.",
      },
      {
        title: "Advanced Reporting",
        description:
          "Generate comprehensive reports with automated data collection and analysis.",
      },
      {
        title: "Predictive Insights",
        description:
          "Forecast trends and opportunities using machine learning algorithms.",
      },
      {
        title: "Growth Analytics",
        description:
          "Identify growth opportunities and track key performance indicators over time.",
      },
    ],
  },
  "project-management": {
    description:
      "Take control of your projects with end-to-end management solutions. From initial planning to final delivery, our platform provides the tools you need to stay organized, meet deadlines, and exceed expectations. Manage resources, track progress, and ensure successful project completion.",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=500&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    features: [
      {
        title: "Strategic Planning",
        description:
          "Create detailed project plans with milestones and resource allocation.",
      },
      {
        title: "Progress Tracking",
        description:
          "Monitor project status and performance with real-time updates and metrics.",
      },
      {
        title: "Resource Optimization",
        description:
          "Maximize efficiency by allocating resources based on project priorities.",
      },
      {
        title: "Custom Configuration",
        description:
          "Tailor project settings and workflows to match your team's specific needs.",
      },
    ],
  },
};

export default function FeatureSectionEight() {
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl leading-tight font-bold lg:text-4xl">
            Productivity Solutions
          </h2>
          <p className="text-muted-foreground text-lg/relaxed">
            Empower your team with intelligent tools for workflow automation,
            team collaboration, data analytics, and project management.
            Streamline operations and drive growth with comprehensive
            productivity solutions.
          </p>
        </div>

        <div className="mt-8 lg:mt-12">
          <Tabs defaultValue="workflow-automation" className="w-full">
            <div className="flex justify-center">
              <TabsList className="inline-flex h-auto w-full flex-col md:h-12 md:flex-row">
                <TabsTrigger
                  className="w-full md:w-auto"
                  value="workflow-automation"
                >
                  Workflow Automation
                </TabsTrigger>
                <TabsTrigger
                  className="w-full md:w-auto"
                  value="team-collaboration"
                >
                  Team Collaboration
                </TabsTrigger>
                <TabsTrigger
                  className="w-full md:w-auto"
                  value="data-analytics"
                >
                  Data Analytics
                </TabsTrigger>
                <TabsTrigger
                  className="w-full md:w-auto"
                  value="project-management"
                >
                  Project Management
                </TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(tabContent).map(([key, content]) => (
              <TabsContent key={key} value={key} className="mt-8">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg">
                    <Image
                      src={content.image}
                      alt={"Productivity Solutions"}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-6 lg:space-y-10">
                    <div className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {content.description}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {content.features.map((feature) => {
                        return (
                          <Card
                            key={feature.title}
                            className="bg-muted/50 border-0 shadow-none"
                          >
                            <CardContent>
                              <h5 className="mb-2 font-medium">
                                {feature.title}
                              </h5>
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {feature.description}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
}
