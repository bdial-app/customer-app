import { ROUTE_PATH } from "@/utils/contants";
import dynamic from "next/dynamic";
const IonIcon = dynamic(
  () => import("@ionic/react").then((m) => m.IonIcon),
  { ssr: false },
);
import {
  locationOutline,
  star,
  checkmarkCircle,
  timeOutline,
} from "ionicons/icons";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const ProviderList = ({
  providerList,
}: {
  providerList: any[];
}) => {
  const router = useRouter();

  const handleNavigate = (id: string) => {
    router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${id}`);
  };

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {providerList.map((provider: any, index: number) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            onClick={() => handleNavigate(provider.id)}
            className="cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform"
          >
            {/* Image */}
            <div className="relative h-[140px] overflow-hidden">
              <img
                src={provider.image}
                alt={provider.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Verified badge */}
              {provider.verified && (
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  <IonIcon icon={checkmarkCircle} className="w-2.5 h-2.5" />
                  Verified
                </div>
              )}
              {/* Women-Led badge */}
              {provider.womenLed && (
                <div
                  className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #F0E6FF, #FFE6F0)",
                    color: "#9B59B6",
                  }}
                >
                  ♀ Women-Led
                </div>
              )}
              {/* Distance pill */}
              {provider.distance != null && (
                <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[9px] font-medium px-2 py-0.5 rounded-full">
                  {typeof provider.distance === "number"
                    ? provider.distance < 1
                      ? `${Math.round(provider.distance * 1000)}m`
                      : `${provider.distance.toFixed(1)} km`
                    : provider.distance}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-2.5">
              <h4 className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-1">
                {provider.name}
              </h4>
              {provider.service && (
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                  {provider.service}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {provider.rating != null && provider.rating > 0 && (
                  <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md">
                    <IonIcon icon={star} className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-700">
                      {Number(provider.rating).toFixed(1)}
                    </span>
                  </div>
                )}
                {provider.reviews != null && provider.reviews > 0 && (
                  <span className="text-[10px] text-gray-400">
                    ({provider.reviews})
                  </span>
                )}
              </div>
              {provider.location && (
                <div className="flex items-center gap-0.5 mt-1.5 text-[10px] text-gray-400">
                  <IonIcon icon={locationOutline} className="w-3 h-3" />
                  <span className="truncate">{provider.location}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProviderList;
