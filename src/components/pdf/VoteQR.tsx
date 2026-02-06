/**
 * VoteQR — Générateur de QR Code pour vote en séance
 * "Scannez pour donner votre avis consultatif"
 */

"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface VoteQRProps {
    simulationId: string;
    size?: number;
    className?: string;
}

// TODO: This QR Code currently points to a static URL. For V2, implement a dynamic route /vote/[simulationId] to collect real votes.
export function VoteQR({ simulationId, size = 120, className = "" }: VoteQRProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);

    const voteUrl = `https://valo-syndic.app/vote?sim_id=${simulationId}`;

    useEffect(() => {
        const generateQR = async () => {
            try {
                setIsLoading(true);
                const dataUrl = await QRCode.toDataURL(voteUrl, {
                    width: size,
                    margin: 1,
                    color: {
                        dark: "#1a1a2e",
                        light: "#ffffff",
                    },
                    errorCorrectionLevel: "M",
                });
                setQrDataUrl(dataUrl);
            } catch (err) {
                console.error("Erreur génération QR Code:", err);
            } finally {
                setIsLoading(false);
            }
        };

        generateQR();
    }, [voteUrl, size]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center ${className}`}>
            <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200">
                {qrDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={qrDataUrl}
                        alt="QR Code Vote"
                        width={size}
                        height={size}
                        className="rounded-lg"
                    />
                )}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center max-w-[180px]">
                📱 Scannez pour donner votre avis consultatif en séance
            </p>
        </div>
    );
}

/**
 * Génère un QR Code en tant que Data URL (pour PDF)
 */
export async function generateQRDataUrl(url: string, size: number = 150): Promise<string> {
    try {
        return await QRCode.toDataURL(url, {
            width: size,
            margin: 1,
            color: {
                dark: "#1a1a2e",
                light: "#ffffff",
            },
            errorCorrectionLevel: "M",
        });
    } catch (err) {
        console.error("Erreur génération QR:", err);
        return "";
    }
}
