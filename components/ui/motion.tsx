'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MotionProps extends HTMLMotionProps<'div'> {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
}

export const FadeIn = ({
    children,
    className,
    delay = 0,
    duration = 0.5,
    ...props
}: MotionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration, delay, ease: 'easeOut' }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const SlideUp = ({
    children,
    className,
    delay = 0,
    duration = 0.5,
    offset = 20,
    ...props
}: MotionProps & { offset?: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: offset }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration, delay, ease: 'easeOut' }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const ScaleIn = ({
    children,
    className,
    delay = 0,
    duration = 0.4,
    ...props
}: MotionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration, delay, type: 'spring', stiffness: 100 }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const StaggerContainer = ({
    children,
    className,
    delay = 0,
    staggerDelay = 0.1,
    ...props
}: MotionProps & { staggerDelay?: number }) => {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: delay,
                    },
                },
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem = ({ children, className, ...props }: HTMLMotionProps<'div'>) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.5 }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
};
