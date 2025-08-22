'use client';

import { useState } from "react";
import { Contact, House, HeartHandshake, BanknoteArrowDown, History } from "lucide-react";

export const Navigation = () => {
  const [value, setValue] = useState("home");

  const tabs = [
    { key: "stake", icon: <BanknoteArrowDown size={24} />, label: "STAKE" },
    { key: "history", icon: <History size={24} />, label: "HISTORY" },
    { key: "book", icon: <House size={32} />, label: "BOOK", center: true },
    { key: "referral", icon: <Contact size={24} />, label: "REFERRAL" },
    { key: "allies", icon: <HeartHandshake size={24} />, label: "ALLIES" },
  ];

  return (
    <div className="flex justify-around items-center relative bg-black py-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setValue(tab.key)}
          className={`flex flex-col items-center justify-center ${
            tab.center
              ? "absolute -top-8 rounded-full border-4 border-yellow-400 bg-black w-20 h-20 flex items-center justify-center shadow-lg"
              : ""
          }`}
        >
          <div
            className={`${
              value === tab.key && !tab.center
                ? "text-yellow-400"
                : tab.center
                ? "text-white"
                : "text-gray-400"
            }`}
          >
            {tab.icon}
          </div>
          {!tab.center && (
            <span
              className={`text-xs mt-1 ${
                value === tab.key
                  ? "text-yellow-400 font-semibold"
                  : "text-gray-400"
              }`}
            >
              {tab.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
