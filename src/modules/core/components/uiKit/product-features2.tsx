import Image from "next/image";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@coreModule/components/uiKit/ui/tabs";

export default function ProductFeatures() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 lg:max-w-7xl lg:px-8">
      <div className="mb-6 max-w-3xl">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">Technical Specifications</h1>
        <p className="text-muted-foreground text-balance lg:text-lg">
          The Organize modular system offers endless options for arranging your favorite and most
          used items. Keep everything at reach and in its place, while dressing up your workspace.
        </p>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="design" className="w-full">
          <TabsList className="w-full justify-start border">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="material">Material</TabsTrigger>
            <TabsTrigger value="considerations">Considerations</TabsTrigger>
            <TabsTrigger value="included">Included</TabsTrigger>
          </TabsList>

          <TabsContent value="design">
            <div className="grid items-start gap-4 pt-4 md:grid-cols-2 lg:gap-8">
              <div className="space-y-4">
                <h3 className="text-2xl">Adaptive and modular</h3>
                <p className="text-muted-foreground">
                  The Organize base set allows you to configure and evolve your setup as your items
                  and habits change. The included trays and optional add-ons are easily rearranged
                  to achieve that perfect setup.
                </p>
              </div>
              <figure>
                <Image
                  src="/images/products/02.jpeg"
                  alt="Organize modular system on a wooden desk with keyboard and accessories"
                  width={600}
                  height={400}
                  className="h-auto w-full rounded-lg object-cover"
                  unoptimized
                />
              </figure>
            </div>
          </TabsContent>

          <TabsContent value="material">
            <div className="grid items-start gap-4 pt-4 md:grid-cols-2 lg:gap-8">
              <div className="space-y-4">
                <h3 className="text-2xl">Premium materials</h3>
                <p className="text-muted-foreground">
                  Crafted from high-quality materials designed to last. The Organize system features
                  durable aluminum trays with a matte finish that resists fingerprints and
                  scratches. The wooden base is made from sustainably sourced oak with a natural oil
                  finish.
                </p>
              </div>
              <figure>
                <Image
                  src="/images/products/03.jpeg"
                  alt="Organize modular system on a wooden desk with keyboard and accessories"
                  width={600}
                  height={400}
                  className="h-auto w-full rounded-lg object-cover"
                  unoptimized
                />
              </figure>
            </div>
          </TabsContent>

          <TabsContent value="considerations">
            <div className="grid items-start gap-4 pt-4 md:grid-cols-2 lg:gap-8">
              <div className="space-y-4">
                <h3 className="text-2xl">Design considerations</h3>
                <p className="text-muted-foreground">
                  Each component of the Organize system is designed with both form and function in
                  mind. The trays are sized to accommodate common desk items while maintaining a
                  minimal footprint. The modular design allows for expansion as your needs grow.
                </p>
                <ul className="text-muted-foreground list-disc space-y-2 pl-5">
                  <li>Stackable components save desk space</li>
                  <li>Non-slip base keeps everything in place</li>
                  <li>Rounded edges for safety and aesthetics</li>
                  <li>Compatible with all Organize expansion packs</li>
                </ul>
              </div>
              <figure>
                <Image
                  src="/images/products/04.jpeg"
                  alt="Organize modular system on a wooden desk with keyboard and accessories"
                  width={600}
                  height={400}
                  className="h-auto w-full rounded-lg object-cover"
                  unoptimized
                />
              </figure>
            </div>
          </TabsContent>

          <TabsContent value="included">
            <div className="grid items-start gap-4 pt-4 md:grid-cols-2 lg:gap-8">
              <div className="space-y-4">
                <h3 className="text-2xl">What&#39;s included</h3>
                <p className="text-muted-foreground">
                  The Organize base set comes with everything you need to get started with your
                  modular organization system.
                </p>
                <ul className="text-muted-foreground list-disc space-y-2 pl-5">
                  <li>1 × Base tray (30cm × 20cm)</li>
                  <li>2 × Small compartment trays (10cm × 10cm)</li>
                  <li>1 × Medium compartment tray (20cm × 10cm)</li>
                  <li>1 × Pen holder attachment</li>
                  <li>1 × Cable management clip</li>
                  <li>Assembly and configuration guide</li>
                </ul>
              </div>
              <figure>
                <Image
                  src="/images/products/05.jpeg"
                  alt="Organize modular system on a wooden desk with keyboard and accessories"
                  width={600}
                  height={400}
                  className="h-auto w-full rounded-lg object-cover"
                  unoptimized
                />
              </figure>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

