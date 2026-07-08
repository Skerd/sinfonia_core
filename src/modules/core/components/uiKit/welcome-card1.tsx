import Image from "next/image";

import { Button } from "@coreModule/components/uiKit/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@coreModule/components/uiKit/ui/card";

export default function WelcomeCard() {
  return (
    <Card className="relative w-full overflow-hidden shadow-none md:w-[450px]">
      <CardHeader>
        <CardTitle className="text-2xl">Congratulations Toby! 🎉</CardTitle>
        <CardDescription>Best seller of the month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold">$15,231.89</div>
            <div className="text-muted-foreground text-xs">
              <span className="text-green-500">+65%</span> from last month
            </div>
          </div>
          <Button variant="outline">View Sales</Button>
        </div>
      </CardContent>
      <Image
        width={800}
        height={300}
        src={`${process.env.DASHBOARD_BASE_URL}/star-shape.png`}
        className="pointer-events-none absolute inset-0 aspect-auto"
        unoptimized
        alt="..."
      />
    </Card>
  );
}
