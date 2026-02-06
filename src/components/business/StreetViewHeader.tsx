"use client";

import { useEffect, useState } from "react";

interface StreetViewHeaderProps {
    address?: string | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
}

/**
 * STREET VIEW HEADER
 * Affiche la façade de l'immeuble via Google Maps Static API
 * Fallback : Dégradé élégant si pas de clé API ou erreur
 * Full-screen background version for hero section
 */
export const StreetViewHeader = ({ address, coordinates }: StreetViewHeaderProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Accept both public and non-prefixed env names (template uses GOOGLE_MAPS_API_KEY)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY;

    // Construire l'URL Street View - larger image for full background
    const streetViewUrl = apiKey && (coordinates || address)
        ? `https://maps.googleapis.com/maps/api/streetview?size=1600x900&location=${coordinates
            ? `${coordinates.latitude},${coordinates.longitude}`
            : encodeURIComponent(address || '')
        }&key=${apiKey}&fov=100&pitch=5`
        : null;

    useEffect(() => {
        setImageLoaded(false);
        setImageError(false);
    }, [streetViewUrl, apiKey]);

    // If no Street View or it failed, try an OpenStreetMap tile as a background (no API key)
    const osmTileUrlForCoordinates = (lat?: number, lon?: number, zoom = 16) => {
        if (lat === undefined || lon === undefined) return null;
        // Convert lat/lon to OSM tile numbers
        const latRad = (lat * Math.PI) / 180;
        const n = Math.pow(2, zoom);
        const xtile = Math.floor(((lon + 180) / 360) * n);
        const ytile = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
        return `https://tile.openstreetmap.org/${zoom}/${xtile}/${ytile}.png`;
    };

    const osmUrl = !streetViewUrl || imageError ? (coordinates ? osmTileUrlForCoordinates(coordinates.latitude, coordinates.longitude) : null) : null;

    // Fallback: Elegant gradient with subtle texture when nothing else is available
    if ((!streetViewUrl && !osmUrl) || imageError && !osmUrl) {
        return (
            <div className="absolute inset-0 bg-gradient-to-br from-deep via-deep-light to-deep">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-hidden">
            {/* Image Street View - Full cover (preferred) or OSM tile fallback */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={streetViewUrl || osmUrl || undefined}
                alt={`Façade - ${address}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 scale-105 ${imageLoaded ? 'opacity-70' : 'opacity-0'} `}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                    // If Street View failed, mark error so OSM fallback is used
                    if (streetViewUrl && coordinates) {
                        setImageError(true);
                        setImageLoaded(false);
                    } else {
                        setImageError(true);
                    }
                }}
            />

            {/* Loading state */}
            {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-br from-deep/30 via-deep-light/20 to-deep/30 animate-pulse" />
            )}

            {/* Subtle vignette for depth (less dark to brighten the view) */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,5,7,0.45)_100%)]" />
        </div>
    );
};
