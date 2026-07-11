"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LogoProps {
    collapsed?: boolean;
    className?: string;
}

const letterContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const letterVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export function Logo({ collapsed = false, className }: LogoProps) {
    return (
        <motion.div 
            className={cn("flex items-center gap-3 cursor-pointer", className)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <motion.img
                src="/logo.png"
                alt="TEST Logo"
                className="w-16 h-16 object-contain dark:invert"
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                whileHover={{ rotate: 5 }}
            />
            {!collapsed && (
                <motion.div 
                    className="flex flex-col leading-tight"
                    variants={letterContainerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.span variants={letterVariants} className="text-xs tracking-wide">
                        <span className="font-bold text-foreground">T</span>
                        <span className="text-foreground text-[10px]">RAIN</span>
                    </motion.span>
                    <motion.span variants={letterVariants} className="text-xs tracking-wide">
                        <span className="font-bold text-foreground">E</span>
                        <span className="text-foreground text-[10px]">AT</span>
                    </motion.span>
                    <motion.span variants={letterVariants} className="text-xs tracking-wide">
                        <span className="font-bold text-foreground">S</span>
                        <span className="text-foreground text-[10px]">LEEP</span>
                    </motion.span>
                    <motion.span variants={letterVariants} className="text-xs tracking-wide">
                        <span className="font-bold text-foreground">T</span>
                        <span className="text-foreground text-[10px]">HRIVE</span>
                    </motion.span>
                </motion.div>
            )}
        </motion.div>
    );
}
