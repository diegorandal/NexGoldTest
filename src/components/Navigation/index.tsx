'use client';

import { useState } from "react";
import {
  Contact,
  House,
  HeartHandshake,
  BanknoteArrowDown,
  History,
} from "lucide-react";
import Link from "next/link"; // Importa el componente Link
import { usePathname } from "next/navigation"; // Importa el hook para obtener la URL

export const Navigation = () => {
  const pathname = usePathname(); // Obtiene la ruta actual de la URL

  const tabs = [
    { key: "stake", href: "/stake", icon: BanknoteArrowDown, label: "STAKE" },
    { key: "history", href: "/history", icon: History, label: "HISTORY" },
    { key: "book", href: "/", icon: House, label: "BOOK", center: true }, // La ruta principal es "/"
    { key: "referral", href: "/Referrals", icon: Contact, label: "REFERRAL" }, // Ruta a la nueva página
    { key: "allies", href: "/allies", icon: HeartHandshake, label: "ALLIES" },
  ];

  return (
    <div className="relative bg-black py-2">
      <div className="grid grid-cols-5 items-center text-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href; // Compara la URL actual con el href del tab

          if (tab.center) {
            return (
              <div key={tab.key} className="flex justify-center">
                <Link
                  href={tab.href}
                  className={`relative -top-6 w-20 aspect-square rounded-full border-4 border-yellow-400 bg-black flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "scale-110 shadow-yellow-400/70 shadow-xl"
                      : "scale-100 shadow-lg"
                  }`}
                >
                  <Icon
                    size={32}
                    className={`transition-colors duration-300 ${
                      isActive ? "text-yellow-400" : "text-white"
                    }`}
                  />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className="flex flex-col items-center justify-center transition-all duration-300"
            >
              <Icon
                size={24}
                className={`transition-colors duration-300 ${
                  isActive ? "text-yellow-400" : "text-gray-400"
                }`}
              />
              <span
                className={`text-xs transition-colors duration-300 ${
                  isActive ? "text-yellow-400 font-semibold" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};