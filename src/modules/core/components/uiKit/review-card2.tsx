import { Quote, Star as StarIcon } from "lucide-react";
import { Card, CardContent } from "@coreModule/components/uiKit/ui/card";

const data = {
  id: 1,
  review:
    "I use the shadcn ui kit pretty often and it’s crazy what people build with it, good job 👏🏻",
  rating: 4.5,
  customerName: "Toby Belhome",
  customerTitle: "Frontend Developer, Apple",
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
    <Card className="w-full shadow-none hover:-translate-y-1 md:w-[450px]">
      <CardContent className="space-y-4">
        <div>
          <Quote className="h-10 w-10 opacity-20" />
        </div>

        <blockquote className="text-muted-foreground mb-6 leading-relaxed">
          {data.review}
        </blockquote>

        <div className="flex items-center gap-1">
          {renderStars(data.rating)}
        </div>

        <div className="space-y-1">
          <div className="font-bold">
            {data.customerName}
          </div>
          <p className="text-muted-foreground text-sm">{data.customerTitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
