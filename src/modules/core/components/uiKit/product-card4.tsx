import Image from "next/image";

const product = {
  id: 1,
  name: "Sweat polar",
  href: "#",
  imageSrc:
    "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=500",
  imageAlt: "Front of men's Basic Tee in black.",
  price: "$35",
  color: "Black",
};

export default function ProductCard() {
  return (
    <div className="group relative w-full max-w-72 space-y-4">
      <figure className="w-full overflow-hidden group-hover:opacity-75">
        <Image
          alt={product.imageAlt}
          src={product.imageSrc}
          width={300}
          height={300}
          className="w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </figure>
      <div className="flex justify-between">
        <div>
          <h5 className="font-medium">
            <a href={product.href}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </a>
          </h5>
          <p className="text-muted-foreground text-sm">{product.color}</p>
        </div>
        <p className="font-medium">{product.price}</p>
      </div>
    </div>
  );
}
