import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name: "Hair Care",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
    imageAlt: "Hair Care category",
  },
  {
    name: "Skin Care",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80",
    imageAlt: "Skin Care category",
  },
  {
    name: "IPL Care",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80",
    imageAlt: "IPL Care category",
  },
  {
    name: "Body Care",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    imageAlt: "Body Care category",
  },
] as const;

export default function ProductCategoryShopByCategory() {
  return (
    <section className="py-14 md:py-16">
      <div className="mx-auto max-w-7xl space-y-6 px-4">
        <header>
          <h2 className="text-3xl font-bold md:text-3xl">
            Discover the Best in Skin Care
          </h2>
          <p className="text-muted-foreground mt-1">Shop by Category</p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative block overflow-hidden rounded-xl transition-shadow"
            >
              <div className="aspect-4/5 overflow-hidden">
                <Image
                  src={category.imageSrc}
                  alt={category.imageAlt}
                  width={600}
                  height={750}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 to-transparent"
                  aria-hidden
                />
              </div>
              <div className="absolute right-0 bottom-0 left-0 p-6">
                <h3 className="text-xl text-white/90 md:text-2xl">
                  {category.name}
                </h3>
                <span className="mt-1 inline-block text-xs font-medium tracking-wider text-white/80 uppercase group-hover:text-white">
                  Explore now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
