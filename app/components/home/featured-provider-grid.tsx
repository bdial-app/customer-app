"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import { star, location } from "ionicons/icons";
import { useRouter } from "next/navigation";
import { ROUTE_PATH } from "@/utils/contants";

interface Provider {
  id: string | number;
  name: string;
  image: string;
  rating?: number;
  reviews?: number;
  location?: string;
  service?: string;
  verified?: boolean;
  womenLed?: boolean;
  price?: string;
  description?: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 22 } },
};

const FeaturedProviderGrid = ({
  title,
  subtitle,
  providers,
  viewAllLink,
}: {
  title: string;
  subtitle?: string;
  providers: Provider[];
  viewAllLink?: string;
}) => {
  const router = useRouter();

  return (
    <div className="mb-2">
      <div className="flex items-end justify-between px-4 pt-4 pb-2">
        <div>
          <h2 className="text-base font-bold text-slate-800 leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {viewAllLink && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(viewAllLink)}
            className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full"
          >
            See All →
          </motion.button>
        )}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-30px" }}
        className="grid grid-cols-2 gap-3 px-4 pb-3"
      >
        {providers.slice(0, 4).map((provider) => (
          <motion.div
            key={provider.id}
            variants={cardVariant}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(`${ROUTE_PATH.PROVIDER_DETAILS}?id=${provider.id}`)}
            className="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-slate-50"
          >
            <div className="relative h-[130px] overflow-hidden">
              <img
                src={provider.image}
                alt={provider.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {provider.verified && (
                <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  ✓ Verified
                </div>
              )}
              {provider.womenLed && (
                <div
                  className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, #F0E6FF, #FFE6F0)", color: "#9B59B6" }}
                >
                  ♀ Women-Led
                </div>
              )}
            </div>
            <div className="p-2.5">
              <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{provider.name}</h4>
              {provider.service && (
                <p className="text-[10px] text-slate-500 mt-0.5">{provider.service}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                {provider.rating && (
                  <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-md">
                    <IonIcon icon={star} className="w-3 h-3 text-green-600" />
                    <span className="text-[10px] font-bold text-green-700">{provider.rating}</span>
                  </div>
                )}
                {provider.reviews !== undefined && provider.reviews > 0 && (
                  <span className="text-[10px] text-slate-400">({provider.reviews})</span>
                )}
              </div>
              {provider.location && (
                <div className="flex items-center gap-0.5 mt-1 text-[10px] text-slate-400">
                  <IonIcon icon={location} className="w-2.5 h-2.5" />
                  <span className="truncate">{provider.location}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default FeaturedProviderGrid;
