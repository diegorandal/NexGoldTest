import { useState } from "react";
import { Home, User, Calendar } from "lucide-react";

export const Navigation = () => {
  const [value, setValue] = useState("home");

  const tabs = [
    { key: "home", icon: <Home size={24} />, label: "HOME" },
    { key: "book", icon: <Calendar size={36} />, label: "BOOK", center: true },
    { key: "profile", icon: <User size={24} />, label: "PROFILE" },
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
                ? "text-green-500"
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
                  ? "text-green-500 font-semibold"
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
