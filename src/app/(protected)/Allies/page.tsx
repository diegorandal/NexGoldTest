'use client';

import Link from "next/link";
import { ExternalLink, AppWindow } from "lucide-react";
import { Card } from "@/components/ui-components"

// Datos de ejemplo para las alianzas. Reemplaza con tus propios datos.
const allies = [
    {
        name: "DWD",
        description: "Llenar con la data de Walter, golems y NFTs",
        appLink: "https://ecoswap.org/app",
        websiteLink: "https://ecoswap.org",
    },
    {
        name: "World Inspector",
        description: "App para inspeccionar el contratos inteligentes y datos de la blockchain.",
        appLink: "https://worldguilds.xyz/app",
        websiteLink: "https://worldguilds.xyz",
    },
    {
        name: "CryptoPaws",
        description: "Plataforma NFT donde puedes adoptar mascotas virtuales y ganar tokens pasivamente.",
        appLink: "https://cryptopaws.io/dapp",
        websiteLink: "https://cryptopaws.io",
    },
];

export default function AlliesPage() {
    return (
        <div className="animate-fade-in mx-2 mt-2 mb-60">
            <Card className="space-y-4">
                <h2 className="text-xl font-bold text-yellow-400 text-center">Alianzas</h2>
                {allies.length > 0 ? (
                    <div className="space-y-4">
                        {allies.map((ally, index) => (
                            <div key={index} className="bg-white/10 p-4 rounded-lg flex flex-col space-y-2">
                                <h3 className="font-bold text-lg text-white">{ally.name}</h3>
                                <p className="text-sm text-gray-400">{ally.description}</p>
                                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-2">
                                    <Link href={ally.appLink} passHref legacyBehavior>
                                        <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-yellow-400 text-yellow-400 rounded-lg hover:bg-yellow-400 hover:text-black transition-colors duration-300">
                                            <AppWindow size={16} />
                                            <span>Abrir App</span>
                                        </a>
                                    </Link>
                                    <Link href={ally.websiteLink} passHref legacyBehavior>
                                        <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-2 text-sm px-4 py-2 border border-gray-400 text-gray-400 rounded-lg hover:bg-gray-400 hover:text-black transition-colors duration-300">
                                            <ExternalLink size={16} />
                                            <span>Página Web</span>
                                        </a>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 p-4">
                        <p>No se encontraron alianzas.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}