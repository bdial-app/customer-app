"use client";
import { motion } from "framer-motion";
import { useAppSelector } from "@/hooks/useAppStore";
import { IonIcon } from "@ionic/react";
import { sunnyOutline, cloudOutline, moonOutline, partlySunnyOutline } from "ionicons/icons";

// Warm, engaging subtitles per time block — rotated daily
const morningSubtitles = [
  "Start your day — find the perfect service nearby",
  "Fresh morning, fresh finds! What can we help with?",
  "Rise and shine! Explore trusted businesses around you",
  "A new day to discover something great — let's go!",
  "Morning vibes — top-rated businesses are ready for you",
];

const afternoonSubtitles = [
  "Need something done? The best businesses are a tap away",
  "Afternoon hustle — find exactly what you're looking for",
  "Great businesses around you are ready to serve",
  "Your neighbourhood's finest — just a search away",
  "Getting things done? Let's find you the right match",
];

const eveningSubtitles = [
  "Winding down? Plan ahead with top local services",
  "Evening calls — discover offers before the day ends",
  "Relax and browse — tomorrow's appointments start here",
  "Good finds don't wait — explore what's near you",
  "End the day right — book a service for tomorrow",
];

const nightSubtitles = [
  "Burning the midnight oil? We've got you covered",
  "Late-night planning — your favourites are saved here",
  "Night owl? Browse and bookmark for tomorrow",
  "Quiet hours — perfect time to discover new businesses",
  "Plan ahead — find what you need for the morning",
];

const getGreeting = () => {
  const h = new Date().getHours();
  const dayIndex = new Date().getDate() % 5; // rotate subtitles daily

  if (h < 12) return { text: "Good morning", subtitle: morningSubtitles[dayIndex], icon: sunnyOutline };
  if (h < 17) return { text: "Good afternoon", subtitle: afternoonSubtitles[dayIndex], icon: partlySunnyOutline };
  if (h < 21) return { text: "Good evening", subtitle: eveningSubtitles[dayIndex], icon: cloudOutline };
  return { text: "Good night", subtitle: nightSubtitles[dayIndex], icon: moonOutline };
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
          <p className="text-[22px] font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
            {greeting.text},{" "}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {firstName}
            </span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {greeting.subtitle}
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
