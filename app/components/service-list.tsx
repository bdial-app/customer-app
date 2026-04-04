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

const ServicesList = ({ className }: { className?: string }) => {
  const rows = 2;
  const cols = Math.ceil(services.length / rows);

  return (
    <Block
      className={`flex mb-0! flex-row gap-2 no-scrollbar overflow-auto ${className}`}
    >
      {Array.from({ length: cols }).map((_, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-2">
          {Array.from({ length: rows }).map((_, rowIndex) => {
            const index = colIndex * rows + rowIndex;

            if (index >= services.length) return null;

            const service = services[index];

            return (
              <div
                key={rowIndex}
                className="bg-slate-200 min-w-20 h-20 flex flex-col items-center justify-center rounded-lg p-1"
              >
                <img
                  src={service.icon}
                  alt={service.name}
                  className="w-10 h-10"
                />
                <p className="text-xs text-center mt-1">{service.name}</p>
              </div>
            );
          })}
        </div>
      ))}
    </Block>
  );
};

export default ServicesList;
