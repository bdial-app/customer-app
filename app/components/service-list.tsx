import { Block } from "konsta/react";
import { useTopLevelCategories } from "@/hooks/useCategories";

// Icon mapping source (from previous mock)

const defaultIcon =
  "https://static.vecteezy.com/system/resources/thumbnails/043/274/699/small/clothes-donation-illustration-png.png";

// Bento layout: [colSpan, rowSpan] per item index
const bentoPattern: [number, number][] = [
  [2, 2],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [2, 1],
  [1, 1],
  [1, 2],
  [1, 1],
  [1, 1],
  [2, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 2],
  [1, 1],
];

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #a18cd1 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
];

const ServicesList = ({ className }: { className?: string }) => {
  const { data: categories = [], isLoading } = useTopLevelCategories();

  if (isLoading && categories.length === 0) {
    return (
      <Block className={`mb-0! !px-0 ${className ?? ""}`}>
        <div className="overflow-x-auto no-scrollbar pb-1 px-4">
          <div
            className="grid gap-2 w-max"
            style={{
              gridTemplateRows: "repeat(2, 80px)",
              gridAutoFlow: "column dense",
              gridAutoColumns: "80px",
            }}
          >
            {[...Array(10)].map((_, i) => {
              const [colSpan, rowSpan] = bentoPattern[i % bentoPattern.length];
              return (
                <div
                  key={i}
                  className="rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse"
                  style={{
                    gridColumn: `span ${colSpan}`,
                    gridRow: `span ${rowSpan}`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </Block>
    );
  }

  return (
    <Block className={`mb-0! !px-0 ${className ?? ""}`}>
      <div className="overflow-x-auto no-scrollbar pb-1 px-4 ">
        <div
          className="grid gap-2 w-max"
          style={{
            gridTemplateRows: "repeat(2, 80px)",
            gridAutoFlow: "column dense",
            gridAutoColumns: "80px",
          }}
        >
          {categories.map((category, i) => {
            const [colSpan, rowSpan] = bentoPattern[i % bentoPattern.length];
            const gradient = gradients[i % gradients.length];
            const isLarge = colSpan === 2 && rowSpan === 2;
            const icon = defaultIcon;

            return (
              <div
                key={category.id}
                className="rounded-xl relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
                style={{
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                  background: `url(${icon}) no-repeat 115% -15% / ${isLarge ? "60%" : "55%"}, ${gradient}`,
                  backgroundSize: "cover",
                }}
              >
                <p
                  className={`absolute bg-gradient-to-t from-black/80 to-black/0 p-2 bottom-0 left-0 w-full font-semibold leading-tight text-white drop-shadow-sm ${
                    isLarge ? "text-sm" : "text-xs"
                  }`}
                >
                  {category.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Block>
  );
};

export default ServicesList;
