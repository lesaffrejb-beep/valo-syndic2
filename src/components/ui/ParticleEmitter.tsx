"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ParticleEmitterProps {
    /** Trigger particles when true */
    active: boolean;
    /** Particle color in hex or rgba */
    color?: string;
    /** Number of particles */
    count?: number;
    /** Duration multiplier */
    speed?: number;
    /** Particle size multiplier */
    size?: number;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    angle: number;
    distance: number;
}

/**
 * CSS-based particle emitter for performance (no Canvas/WebGL)
 * Emits golden particles when urgency is high
 */
export function ParticleEmitter({
    active,
    color = "#D4B679",
    count = 20,
}: ParticleEmitterProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    // Check for reduced motion preference
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    useEffect(() => {
        if (!active || prefersReducedMotion) {
            setParticles([]);
            return;
        }

        // Generate particles distributed across the card
        const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
            // Calculate angle for radial distribution with more randomness
            const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
            // Random starting position across the card
            const startX = 20 + Math.random() * 60; // 20-80% of card width
            const startY = 20 + Math.random() * 60; // 20-80% of card height
            // Variable travel distance for organic feel
            const distance = 60 + Math.random() * 80; // 60-140px travel

            return {
                id: i,
                x: startX,
                y: startY,
                size: 4 + Math.random() * 8, // 4-12px for visibility
                duration: 6 + Math.random() * 4, // 6-10s (slower, more elegant)
                delay: Math.random() * 4, // Random staggered start
                angle,
                distance,
            };
        });

        setParticles(newParticles);
    }, [active, count, prefersReducedMotion]);

    if (!active || prefersReducedMotion || particles.length === 0) {
        return null;
    }

    return (
        <div
            className="absolute inset-0 overflow-visible pointer-events-none z-0"
            aria-hidden="true"
        >
            {particles.map((particle) => (
                <motion.div
                    key={`${particle.id}-${particle.x}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: color,
                        boxShadow: `0 0 ${particle.size * 3}px ${color}, 0 0 ${particle.size * 6}px ${color}40`,
                    }}
                    initial={{
                        opacity: 0,
                        scale: 0,
                        x: 0,
                        y: 0,
                    }}
                    animate={{
                        opacity: [0, 0.7, 0.5, 0.3, 0],
                        scale: [0, 1.2, 1, 0.6, 0],
                        // Smooth radial outward movement covering the card
                        x: [
                            0,
                            Math.cos(particle.angle) * particle.distance * 0.3,
                            Math.cos(particle.angle) * particle.distance * 0.6,
                            Math.cos(particle.angle) * particle.distance * 0.9,
                            Math.cos(particle.angle) * particle.distance,
                        ],
                        y: [
                            0,
                            Math.sin(particle.angle) * particle.distance * 0.3,
                            Math.sin(particle.angle) * particle.distance * 0.6,
                            Math.sin(particle.angle) * particle.distance * 0.9,
                            Math.sin(particle.angle) * particle.distance,
                        ],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: [0.25, 0.1, 0.25, 1], // Custom bezier for organic flow
                        times: [0, 0.2, 0.5, 0.8, 1],
                    }}
                />
            ))}
        </div>
    );
}
