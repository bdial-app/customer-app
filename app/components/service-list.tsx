import { Block } from "konsta/react";

const services = [
  {
    name: "Clothes",
    icon: "https://cdn-icons-png.flaticon.com/512/6165/6165574.png",
  },
  {
    name: "Repairing",
    icon: "https://cdn-icons-png.flaticon.com/512/2921/2921822.png",
  },
  {
    name: "Transport",
    icon: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  },
  {
    name: "Mehandi",
    icon: "https://cdn-icons-png.flaticon.com/512/3534/3534069.png",
  },
  {
    name: "Cleaning",
    icon: "https://cdn-icons-png.flaticon.com/512/995/995053.png",
  },
  {
    name: "Plumbing",
    icon: "https://cdn-icons-png.flaticon.com/512/1685/1685462.png",
  },
  {
    name: "Electrician",
    icon: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
  },
  {
    name: "Painting",
    icon: "https://cdn-icons-png.flaticon.com/512/1822/1822559.png",
  },
  {
    name: "Cooking",
    icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
  },
  {
    name: "Gardening",
    icon: "https://cdn-icons-png.flaticon.com/512/2909/2909767.png",
  },
  {
    name: "Laundry",
    icon: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png",
  },
  {
    name: "Car Wash",
    icon: "https://cdn-icons-png.flaticon.com/512/743/743131.png",
  },
  {
    name: "Salon",
    icon: "https://cdn-icons-png.flaticon.com/512/1940/1940922.png",
  },
  {
    name: "Makeup",
    icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  },
  {
    name: "Delivery",
    icon: "https://cdn-icons-png.flaticon.com/512/1046/1046850.png",
  },
  {
    name: "Shifting",
    icon: "https://cdn-icons-png.flaticon.com/512/679/679720.png",
  },
];

// Bento layout: [colSpan, rowSpan] per item index (wraps for extra items)
const bentoPattern: [number, number][] = [
  [2, 2], // 0 — large hero
  [1, 1], // 1
  [1, 1], // 2
  [1, 1], // 3
  [1, 1], // 4
  [2, 1], // 5 — wide
  [1, 1], // 6
  [1, 2], // 7 — tall
  [1, 1], // 8
  [1, 1], // 9
  [2, 1], // 10 — wide
  [1, 1], // 11
  [1, 1], // 12
  [1, 1], // 13
  [1, 2], // 14 — tall
  [1, 1], // 15
];

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", // violet-indigo
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", // pink-red
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", // sky-cyan
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", // green-teal
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", // pink-yellow
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", // purple-pink
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)", // peach-purple
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)", // lavender-sky
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)", // gold-peach
  "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)", // mint-lemon
  "linear-gradient(135deg, #ff9a9e 0%, #a18cd1 100%)", // rose-lavender
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)", // green-blue
];

const ServicesList = ({ className }: { className?: string }) => {
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
          {services.map((service, i) => {
            const [colSpan, rowSpan] = bentoPattern[i % bentoPattern.length];
            const gradient = gradients[i % gradients.length];
            const isLarge = colSpan === 2 && rowSpan === 2;

            return (
              <div
                key={service.name}
                className="rounded-xl relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
                style={{
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                  background: `url(${service.icon}) no-repeat 115% -15% / ${isLarge ? "60%" : "55%"}, ${gradient}`,
                }}
              >
                <p
                  className={`absolute bottom-2 left-2.5 font-semibold leading-tight text-white drop-shadow-sm ${
                    isLarge ? "text-sm" : "text-xs"
                  }`}
                >
                  {service.name}
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
