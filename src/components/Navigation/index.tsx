'use client';

import { useState } from "react";
import { Home, User, Calendar } from "lucide-react";

export const Navigation = () => {
  const [value, setValue] = useState("home");

  const tabs = [
    { key: "home", icon: <Home size={24} />, label: "HOME" },
    { key: "book", icon: <Calendar size={24} />, label: "BOOK", center: true },
    { key: "profile", icon: <User size={24} />, label: "PROFILE" },
  ];

  return (
    <div className="flex justify-around items-center relative bg-white py-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setValue(tab.key)}
          className={`flex flex-col items-center justify-center ${
            tab.center
              ? "absolute -top-6 bg-gray-300 rounded-full p-3 shadow-md"
              : ""
          }`}
        >
          <div
            className={`${
              value === tab.key && !tab.center ? "text-green-500" : "text-gray-500"
            }`}
          >
            {tab.icon}
          </div>
          {!tab.center && (
            <span
              className={`text-xs ${
                value === tab.key ? "text-green-500 font-semibold" : "text-gray-500"
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

