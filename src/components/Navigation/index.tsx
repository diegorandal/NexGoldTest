'use client';

import { useState } from "react";
import {
  Contact,
  House,
  HeartHandshake,
  BanknoteArrowDown,
  History,
} from "lucide-react";

export const Navigation = () => {
  const [value, setValue] = useState("home");

  const tabs = [
    { key: "stake", icon: BanknoteArrowDown, label: "STAKE" },
    { key: "history", icon: History, label: "HISTORY" },
    { key: "book", icon: House, label: "BOOK", center: true },
    { key: "referral", icon: Contact, label: "REFERRAL" },
    { key: "allies", icon: HeartHandshake, label: "ALLIES" },
  ];

  return (
    <div className="relative bg-black py-2">
      <div className="grid grid-cols-5 items-center text-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          if (tab.center) {
            const isActive = value === tab.key;
            return (
              <div key={tab.key} className="flex justify-center">
                <button
                  onClick={() => setValue(tab.key)}
                  className={`relative -top-6 w-20 h-20 rounded-full border-4 border-yellow-400 bg-black flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "scale-110 shadow-yellow-400/70 shadow-xl"
                      : "scale-100 shadow-lg"
                  }`}
                >
                  <Icon
                    size={32}
                    className={isActive ? "text-yellow-400" : "text-white"}
                  />
                </button>
              </div>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => setValue(tab.key)}
              className="flex flex-col items-center justify-center"
            >
              <Icon
                size={24}
                className={
                  value === tab.key ? "text-yellow-400" : "text-gray-400"
                }
              />
              <span
                className={`text-xs ${
                  value === tab.key
                    ? "text-yellow-400 font-semibold"
                    : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
