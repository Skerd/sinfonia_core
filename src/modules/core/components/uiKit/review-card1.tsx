import { StarIcon } from "lucide-react";

import { Progress } from "@coreModule/components/uiKit/ui/progress";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Button } from "@coreModule/components/uiKit/ui/button";

export default function CardReview() {
  return (
    <Card className="w-full overflow-hidden shadow-none md:w-[450px]">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 *:size-4">
            <StarIcon className="fill-orange-400 stroke-orange-400" />
            <StarIcon className="fill-orange-400 stroke-orange-400" />
            <StarIcon className="fill-orange-400 stroke-orange-400" />
            <StarIcon className="stroke-orange-400" />
            <StarIcon className="stroke-orange-400" />
          </div>
          <Button
            variant="link"
            className="text-muted-foreground px-0 font-normal"
          >
            4.3 (12 reviews)
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-20">5 stars</span>
          <Progress value={70} color="bg-orange-400" />
          <span>70%</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-20">4 stars</span>
          <Progress value={17} color="bg-orange-600" />
          <span>17%</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-20">3 stars</span>
          <Progress value={7} color="bg-yellow-300" />
          <span>7%</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-20">2 stars</span>
          <Progress value={4} color="bg-yellow-600" />
          <span>4%</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="w-20">1 star</span>
          <Progress value={2} color="bg-red-600" />
          <span>2%</span>
        </div>
      </CardContent>
    </Card>
  );
}
