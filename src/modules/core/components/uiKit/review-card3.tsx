import { Star as StarIcon } from "lucide-react";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";
import { Button } from "@coreModule/components/uiKit/ui/button";
import { Progress } from "@coreModule/components/uiKit/ui/progress";

const data = {
  averageRating: 4.8,
  totalReviews: 138,
  ratings: [
    { stars: 5, count: 106 },
    { stars: 4, count: 32 },
    { stars: 3, count: 0 },
    { stars: 2, count: 0 },
    { stars: 1, count: 0 },
  ],
};

export default function ReviewCard() {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIcon
            key={i}
            className="size-4 fill-orange-400 stroke-orange-400"
          />,
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative size-4">
            <StarIcon className="size-4 stroke-orange-400" />
            <div className="absolute inset-0 w-1/2 overflow-hidden">
              <StarIcon className="size-4 fill-orange-400 stroke-orange-400" />
            </div>
          </div>,
        );
      } else {
        stars.push(<StarIcon key={i} className="size-4 stroke-orange-400" />);
      }
    }

    return stars;
  };

  return (
    <Card className="w-full shadow-none md:w-[450px]">
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted inline-flex flex-col space-y-1 rounded-md p-4">
              <div className="flex gap-1">
                <span className="text-2xl font-bold">{data.averageRating}</span>
              </div>
              <div className="text-muted-foreground text-xs">
                Average rating
              </div>
            </div>
            <div className="bg-muted inline-flex flex-col space-y-1 rounded-md p-4">
              <div className="flex gap-1">
                <span className="text-2xl font-bold">1.4k</span>
              </div>
              <div className="text-muted-foreground text-xs">Reviews</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="mb-4 flex justify-between text-lg font-semibold">
            Reviews{" "}
            <div className="flex gap-1">{renderStars(data.averageRating)}</div>
          </h5>
          {data.ratings
            .sort((a, b) => b.stars - a.stars)
            .map(({ stars, count }, i) => {
              const percentage =
                data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;

              return (
                <div key={stars} className="flex items-center gap-4">
                  <span className="text-muted-foreground inline-block w-3 text-sm">
                    {stars}
                  </span>
                  <Progress value={percentage} />

                  <span className="text-muted-foreground min-w-8 text-end text-xs">
                    {count}
                  </span>
                </div>
              );
            })}
        </div>

        <Button className="w-full">Write a Review</Button>
      </CardContent>
    </Card>
  );
}
