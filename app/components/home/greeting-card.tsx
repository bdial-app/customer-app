"use client";
import { motion } from "framer-motion";
import { useAppSelector } from "@/hooks/useAppStore";
import { IonIcon } from "@ionic/react";
import { sunnyOutline, cloudOutline, moonOutline } from "ionicons/icons";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", icon: sunnyOutline };
  if (h < 17) return { text: "Good afternoon", icon: cloudOutline };
  if (h < 21) return { text: "Good evening", icon: sunnyOutline };
  return { text: "Good night", icon: moonOutline };
};

const GreetingCard = () => {
  const { user } = useAppSelector((s) => s.auth);
  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || user?.mobileNumber || "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="px-4 pt-3 pb-1"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[22px] font-extrabold text-slate-800 leading-tight">
            {greeting.text},{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {firstName}
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            What service do you need today?
          </p>
        </div>
        <motion.span
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-3xl"
        >
          <IonIcon icon={greeting.icon} className="text-amber-500" />
        </motion.span>
      </div>
    </motion.div>
  );
};

export default GreetingCard;
