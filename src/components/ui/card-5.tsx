'use client'

import * as React from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

// Define the types for the props to ensure type safety and clarity
export interface Stat {
  label: string;
  value: string | number;
}

export interface Action extends ButtonProps {
  label: string;
  onClick: () => void;
}

export interface ProfileCardProps {
  avatarSrc: string;
  name: string;
  handle?: string;
  bio?: string;
  stats?: Stat[];
  actions?: Action[];
  className?: string;
  variant?: 'default' | 'compact';
  title?: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}

/**
 * A responsive and theme-adaptive profile card component supporting full and compact variants.
 */
export const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  (
    {
      avatarSrc,
      name,
      handle,
      bio,
      stats = [],
      actions = [],
      className,
      variant = 'default',
      title = 'DEVELOPER',
      subtitle,
      href,
      onClick,
    },
    ref
  ) => {
    // Animation variants for Framer Motion
    const cardVariants: Variants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: "easeOut",
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants: Variants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    // Compact variant (used on App page sidebar & compact lists)
    if (variant === 'compact') {
      const cardInner = (
        <motion.div
          ref={ref}
          className={cn(
            "w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#181818]/70 via-[#121212]/75 to-[#0b0b0b]/85 backdrop-blur-xl text-card-foreground shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:border-[#E50914]/50 hover:shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(229,9,20,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] hover:-translate-y-0.5 cursor-pointer group",
            className
          )}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={onClick}
        >
          {/* Subtle top glass reflection highlight */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

          {/* Top Label */}
          <span className="text-[0.72rem] font-bold text-[#8E8E93] uppercase tracking-wider block relative z-10">
            {title}
          </span>

          {/* Row Content */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={avatarSrc || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Dev')}`}
                  alt={name}
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Dev')}`
                  }}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white/[0.12] shadow-md shadow-black/40 group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
              </div>

              <div className="flex flex-col min-w-0">
                <h4 className="text-[0.95rem] font-bold truncate text-white tracking-tight m-0">
                  {name}
                </h4>
                <p className="text-xs text-muted-foreground truncate m-0 mt-0.5">
                  {subtitle || handle}
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#666666] group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          {/* Compact Stats Row (Apps, Upvotes, Views) */}
          {stats && stats.length > 0 && (
            <div className="flex items-center justify-between text-center pt-2.5 mt-0.5 border-t border-white/[0.08] relative z-10">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center flex-1">
                  <span className="text-[0.88rem] font-bold text-white tracking-tight leading-tight">
                    {stat.value}
                  </span>
                  <span className="text-[0.65rem] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )

      if (href) {
        return (
          <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            {cardInner}
          </Link>
        )
      }

      return cardInner
    }

    // Default Full Card Variant (used on Landing & Browse pages)
    return (
      <motion.div
        ref={ref}
        className={cn(
          "max-w-sm w-full rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#181818]/70 via-[#121212]/75 to-[#0b0b0b]/85 backdrop-blur-xl text-card-foreground shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] p-6 flex flex-col gap-6 relative overflow-hidden transition-all duration-300",
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Subtle top glass reflection highlight */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0">
            <img
              src={avatarSrc || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Dev')}`}
              alt={name}
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Dev')}`
              }}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/[0.12] shadow-md shadow-black/40"
            />
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20 pointer-events-none" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xl font-bold truncate text-white tracking-tight">{name}</h2>
            {handle && <p className="text-sm text-muted-foreground truncate">{handle}</p>}
          </div>
        </motion.div>

        {/* Bio Section */}
        {bio && (
          <motion.p variants={itemVariants} className="text-sm text-neutral-300/80 leading-relaxed line-clamp-2 min-h-[2.5rem] relative z-10">
            {bio}
          </motion.p>
        )}

        {/* Stats Section */}
        {stats.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between text-center border-t border-b border-white/[0.08] py-3.5 relative z-10"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center">
                <span className="text-lg font-bold text-white tracking-tight">{stat.value}</span>
                <span className="text-xs text-muted-foreground tracking-wider mt-0.5">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Actions Section */}
        {actions.length > 0 && (
          <motion.div variants={itemVariants} className="flex items-center gap-3 relative z-10">
            {actions.map(({ label, ...actionProps }, index) => (
              <Button key={index} {...actionProps} className={cn("flex-1", actionProps.className)}>
                {label}
              </Button>
            ))}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

ProfileCard.displayName = "ProfileCard";
