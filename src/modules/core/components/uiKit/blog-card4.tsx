import { Card } from "@coreModule/components/uiKit/ui/card";
import Image from "next/image";
import Link from "next/link";

const data = {
  image:
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80",
  category: "Technology",
  title: "The Future of Web Development in 2025",
};

export default function BlogCard() {
  return (
    <Card className="group relative overflow-hidden p-0 shadow-none">
      <Link href="#" className="block">
        <div className="relative aspect-4/3 h-64 w-full">
          <Image
            src={data.image}
            alt={data.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <p className="mb-2 text-sm font-medium">{data.category}</p>
            <h4 className="text-2xl leading-tight">{data.title}</h4>
          </div>
        </div>
      </Link>
    </Card>
  );
}
