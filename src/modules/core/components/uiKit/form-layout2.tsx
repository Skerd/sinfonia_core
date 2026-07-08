"use client";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Checkbox } from "@coreModule/components/uiKit/ui/checkbox";
import { Input } from "@coreModule/components/uiKit/ui/input";
import { Label } from "@coreModule/components/uiKit/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@coreModule/components/uiKit/ui/select";
import { Separator } from "@coreModule/components/uiKit/ui/separator";
import { Textarea } from "@coreModule/components/uiKit/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@coreModule/components/uiKit/ui/radio-group";
import { useState } from "react";

const workspaces = [
  {
    id: 1,
    title: "Starter",
    description: "Up to 10,000 requests per day.",
    users: "Free"
  },
  {
    id: 2,
    title: "Premium",
    description: "500,000 requests per day¹",
    users: "$900/month²"
  },
  {
    id: 3,
    title: "Enterprise",
    description: "Based on your specific needs",
    users: "Custom"
  }
];

export default function Example() {
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);

  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center p-10">
      <form>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-foreground dark:text-foreground font-semibold">
              Personal information
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1 text-sm leading-6">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr.
            </p>
          </div>
          <div className="sm:max-w-3xl md:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="col-span-full sm:col-span-3">
                <Label
                  htmlFor="first-name"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  First name
                </Label>
                <Input
                  type="text"
                  id="first-name"
                  name="first-name"
                  autoComplete="given-name"
                  placeholder="Emma"
                  className="mt-2"
                />
              </div>
              <div className="col-span-full sm:col-span-3">
                <Label
                  htmlFor="last-name"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  Last name
                </Label>
                <Input
                  type="text"
                  id="last-name"
                  name="last-name"
                  autoComplete="family-name"
                  placeholder="Crown"
                  className="mt-2"
                />
              </div>
              <div className="col-span-full">
                <Label
                  htmlFor="email"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="emma@company.com"
                  className="mt-2"
                />
              </div>
              <div className="col-span-full sm:col-span-3">
                <Label
                  htmlFor="birthyear"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  Birth year
                </Label>
                <Input
                  type="number"
                  id="birthyear"
                  name="year"
                  placeholder="1990"
                  className="mt-2"
                />
              </div>
              <div className="col-span-full sm:col-span-3">
                <Label
                  htmlFor="role"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  Role
                </Label>
                <Input
                  type="text"
                  id="role"
                  name="role"
                  placeholder="Senior Manager"
                  disabled
                  className="mt-2"
                />
                <p className="text-muted-foreground dark:text-muted-foreground mt-2 text-xs">
                  Roles can only be changed by system admin.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-foreground dark:text-foreground font-semibold">
              Workspace settings
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1 text-sm leading-6">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr.
            </p>
          </div>
          <div className="sm:max-w-3xl md:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="col-span-full sm:col-span-3">
                <Label
                  htmlFor="workspace-name"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  Workspace name
                </Label>
                <Input
                  type="text"
                  id="workspace-name"
                  name="workspace-name"
                  placeholder="Test workspace"
                  className="mt-2"
                />
              </div>
              <div className="col-span-full sm:col-span-3">
                <Label
                  htmlFor="visibility"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  Visibility
                </Label>
                <Select name="visibility" defaultValue="private">
                  <SelectTrigger id="visibility" className="mt-2 w-full">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-full">
                <Label
                  htmlFor="workspace-description"
                  className="text-foreground dark:text-foreground text-sm font-medium">
                  Workspace description
                </Label>
                <Textarea
                  id="workspace-description"
                  name="workspace-description"
                  className="mt-2"
                  rows={4}
                />
                <p className="text-muted-foreground dark:text-muted-foreground mt-2 text-xs">
                  Note: description provided will not be displayed externally.
                </p>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-foreground dark:text-foreground font-semibold">
              Notification settings
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1 text-sm leading-6">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr.
            </p>
          </div>
          <div className="sm:max-w-3xl md:col-span-2">
            <fieldset>
              <legend className="text-foreground dark:text-foreground text-sm font-medium">
                Team
              </legend>
              <p className="text-muted-foreground dark:text-muted-foreground mt-1 text-sm leading-6">
                Configure the types of team alerts you want to receive.
              </p>
              <div className="mt-2">
                <div className="flex items-center gap-x-3 py-1">
                  <Checkbox id="team-requests" name="team-requests" defaultChecked />
                  <Label
                    htmlFor="team-requests"
                    className="text-foreground dark:text-foreground text-sm font-medium">
                    Team join requests
                  </Label>
                </div>
                <div className="flex items-center gap-x-3 py-1">
                  <Checkbox id="team-activity-digest" name="team-activity-digest" />
                  <Label
                    htmlFor="team-activity-digest"
                    className="text-foreground dark:text-foreground text-sm font-medium">
                    Weekly team activity digest
                  </Label>
                </div>
                <div className="flex items-center gap-x-3 py-1">
                  <Checkbox id="api-requests" name="api-requests" />
                  <Label
                    htmlFor="api-requests"
                    className="text-foreground dark:text-foreground text-sm font-medium">
                    API requests
                  </Label>
                </div>
                <div className="flex items-center gap-x-3 py-1">
                  <Checkbox id="workspace-execution" name="workspace-execution" defaultChecked />
                  <Label
                    htmlFor="workspace-execution"
                    className="text-foreground dark:text-foreground text-sm font-medium">
                    Workspace loading times
                  </Label>
                </div>
                <div className="flex items-center gap-x-3 py-1">
                  <Checkbox id="query-caching" name="query-caching" defaultChecked />
                  <Label
                    htmlFor="query-caching"
                    className="text-foreground dark:text-foreground text-sm font-medium">
                    Query caching
                  </Label>
                </div>
                <div className="flex items-center gap-x-3 py-1">
                  <Checkbox id="storage" name="storage" />
                  <Label
                    htmlFor="storage"
                    className="text-foreground dark:text-foreground text-sm font-medium">
                    Storage
                  </Label>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
        <Separator className="my-8" />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-foreground dark:text-foreground font-semibold">
              Select a workspace package
            </h2>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1 text-sm leading-6">
              Lorem ipsum dolor sit amet.
            </p>
          </div>
          <div className="sm:max-w-3xl md:col-span-2">
            <fieldset>
              <RadioGroup
                className="grid grid-cols-1 gap-5 sm:grid-cols-3"
                defaultValue={selectedWorkspace.id.toString()}
                onValueChange={(value) =>
                  setSelectedWorkspace(
                    workspaces.find((workspace) => workspace.id.toString() === value) ||
                      workspaces[0]
                  )
                }>
                {workspaces.map((item) => (
                  <div
                    key={item.id.toString()}
                    className="border-input has-data-[state=checked]:border-ring relative flex flex-col gap-2 rounded-md border p-4 shadow-xs outline-none">
                    <div className="flex justify-between">
                      <RadioGroupItem
                        id={item.id.toString()}
                        value={item.id.toString()}
                        className="order-1 after:absolute after:inset-0"
                      />

                      <Label
                        htmlFor={item.id.toString()}
                        className="text-foreground block text-sm font-medium">
                        {item.title}
                      </Label>
                    </div>
                    <div className="flex h-full flex-col justify-between">
                      <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                      <span className="text-foreground mt-4 block text-sm font-medium">
                        {item.users}
                      </span>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex items-center justify-end space-x-4">
          <Button type="button" variant="outline" className="whitespace-nowrap">
            Go back
          </Button>
          <Button type="submit" className="whitespace-nowrap">
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
}
