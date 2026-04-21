"use client";
import { motion } from "framer-motion";

interface QuickAction {
  emoji: string;
  label: string;
  color: string;
  onClick?: () => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  { emoji: "🧵", label: "Tailoring", color: "#FFF3E0" },
  { emoji: "❄️", label: "AC Repair", color: "#E3F2FD" },
  { emoji: "💇", label: "Salon", color: "#FCE4EC" },
  { emoji: "🔧", label: "Plumber", color: "#E8F5E9" },
  { emoji: "🍛", label: "Tiffin", color: "#FFF8E1" },
  { emoji: "📦", label: "Delivery", color: "#E0F7FA" },
];

const QuickActionStrip = ({ onAction }: { onAction?: (label: string) => void }) => {
  return (
    <div className="px-4 py-2">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onAction?.(action.label)}
            className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full cursor-pointer border border-slate-100 shadow-sm active:shadow-none transition-shadow"
            style={{ backgroundColor: action.color }}
          >
            <span className="text-base">{action.emoji}</span>
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              {action.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickActionStrip;
