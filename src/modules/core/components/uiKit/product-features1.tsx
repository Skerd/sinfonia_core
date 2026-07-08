import Image from "next/image";
import { Badge } from "@coreModule/components/uiKit/ui/badge";

export default function ProductFeatures() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 lg:max-w-7xl lg:px-8">
      <div className="grid lg:grid-cols-2">
        <figure className="relative h-full">
          <Image
            src="/images/products/01.jpeg"
            width={800}
            height={800}
            className="h-full w-full rounded-lg object-cover"
            unoptimized
            alt="..."
          />
        </figure>

        <div className="flex w-full flex-col justify-center px-0 py-4 md:py-8 lg:px-16 lg:py-16">
          <div className="max-w-lg">
            <Badge variant="outline" className="text-muted-foreground mb-2">
              Perfect Match with Your Skin
            </Badge>

            <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:mb-6">Crafted with Care</h2>

            <p className="text-muted-foreground mb-6 lg:mb-10">
              Every element of this artisan notebook has been carefully considered to deliver
              exceptional quality for everyday writing.
            </p>

            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:gap-y-10">
              <div>
                <h6 className="mb-3 font-semibold">Long-lasting</h6>
                <p className="text-sm text-[#5c7c6f]">
                  Premium materials and precision-engineered binding ensure this notebook withstands
                  years of daily use.
                </p>
              </div>

              <div>
                <h6 className="mb-3 font-semibold">Customizable</h6>
                <p className="text-muted-foreground text-sm">
                  Purchase once and customize as needed. Save with our subscription service for
                  regular paper refills.
                </p>
              </div>

              <div>
                <h6 className="mb-3 font-semibold">Intelligently designed</h6>
                <p className="text-muted-foreground text-sm">
                  The innovative disc system lets you easily reorganize or mix different paper
                  styles including dotted, ruled, and plain sheets.
                </p>
              </div>

              <div>
                <h6 className="mb-3 font-semibold">Ethically crafted</h6>
                <p className="text-muted-foreground text-sm">
                  Produced with sustainable practices and materials from local sources, reducing
                  environmental impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

