"use client";

import { Button } from "@coreModule/components/uiKit/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@coreModule/components/uiKit/ui/tooltip";

export const title = "Tooltip with Image";

const Example = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Product Preview</Button>
    </TooltipTrigger>
    <TooltipContent className="max-w-xs p-0">
      <div className="flex flex-col gap-1 p-3">
        {/** biome-ignore lint/performance/noImgElement: "Kibo UI is framework agnostic" */}
        <img
          alt="Preview"
          className="mb-1 aspect-video w-full max-w-sm rounded-md"
          height={300}
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=514&q=80"
          width={514}
        />
        <p className="font-semibold">Product Preview</p>
        <p className="text-xs">View the full product details and specifications</p>
      </div>
    </TooltipContent>
  </Tooltip>
);

export default Example;
