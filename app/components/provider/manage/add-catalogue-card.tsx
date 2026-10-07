"use client";
import { motion } from "framer-motion";
import { IonIcon } from "@ionic/react";
import {
  arrowForward,
  constructOutline,
  cubeOutline,
  sparkles,
} from "ionicons/icons";
import type { ProviderDetailsProduct } from "@/services/provider.service";

/**
 * The dashboard's call to build a catalogue: vibrant, two big choices
 * (something you sell / something you do), each opening the add form
 * already set to that type. The message follows how far along they are.
 */
export default function AddCatalogueCard({
  products,
  onAdd,
  onManage,
}: {
  products: ProviderDetailsProduct[];
  onAdd: (type: "product" | "service") => void;
  onManage: () => void;
}) {
  const count = products.length;
  const thumbs = products
    .map((p) => p.photoUrl || p.photoUrls?.[0])
    .filter((u): u is string => !!u)
    .slice(0, 3);

  const title =
    count === 0 ? "Start your catalogue" : "Add a product or service";
  const body =
    count === 0
      ? "Customers can't see what you offer yet. Add your first item — it takes about a minute."
      : `You have ${count} item${
          count === 1 ? "" : "s"
        }. Each new one is another way for customers to find you in search.`;

  return (
    <div className="px-4 mb-4" data-tour="home-add-catalogue">
      <div className="relative overflow-hidden rounded-[26px] p-5 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-xl shadow-violet-600/25">
        {/* Soft light and decoration */}
        <div className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 w-52 h-52 rounded-full bg-fuchsia-300/20 blur-2xl" />

        <div className="relative flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10.5px] font-bold uppercase tracking-wider">
              {count === 0 ? "Recommended" : "Grow your shop"}
            </span>
            <h3 className="mt-2 text-[20px] leading-tight font-extrabold text-white tracking-tight">
              {title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-snug text-white/85">
              {body}
            </p>
          </div>

          {/* Their items, or a hint of what goes here */}
          <div className="relative w-[74px] h-[74px] shrink-0 mt-1">
            {thumbs.length > 0 ? (
              thumbs.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="absolute w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-lg"
                  style={{
                    top: i * 11,
                    left: i * 13,
                    transform: `rotate(${(i - 1) * 7}deg)`,
                    zIndex: 3 - i,
                  }}
                />
              ))
            ) : (
              <>
                <div className="absolute top-0 left-1 w-12 h-12 rounded-xl bg-white/25 backdrop-blur-sm ring-1 ring-white/40 flex items-center justify-center rotate-[-8deg]">
                  <IonIcon
                    icon={cubeOutline}
                    className="text-[22px] text-white"
                  />
                </div>
                <div className="absolute top-6 left-6 w-12 h-12 rounded-xl bg-white ring-1 ring-white flex items-center justify-center rotate-[6deg] shadow-lg">
                  <IonIcon
                    icon={constructOutline}
                    className="text-[22px] text-violet-600"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-2.5 mt-4">
          {(
            [
              {
                type: "product",
                icon: cubeOutline,
                label: "Product",
                hint: "Something you sell",
              },
              {
                type: "service",
                icon: constructOutline,
                label: "Service",
                hint: "Something you do",
              },
            ] as const
          ).map((o) => (
            <motion.button
              key={o.type}
              whileTap={{ scale: 0.96 }}
              onClick={() => onAdd(o.type)}
              className="flex flex-col items-start gap-2 p-3.5 rounded-2xl bg-white text-left shadow-lg shadow-violet-900/20"
            >
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                <IonIcon icon={o.icon} className="text-[20px] text-white" />
              </span>
              <span>
                <span className="block text-[15px] font-extrabold text-slate-900 leading-tight">
                  + Add {o.label.toLowerCase()}
                </span>
                <span className="block text-[12px] text-slate-500 mt-0.5">
                  {o.hint}
                </span>
              </span>
            </motion.button>
          ))}
        </div>

        {count > 0 && (
          <button
            type="button"
            onClick={onManage}
            className="relative mt-3 w-full flex items-center justify-center gap-1 h-9 rounded-xl text-[12.5px] font-bold text-white/90 active:bg-white/10"
          >
            Manage your {count} item{count === 1 ? "" : "s"}
            <IonIcon icon={arrowForward} className="text-[14px]" />
          </button>
        )}
      </div>
    </div>
  );
}
