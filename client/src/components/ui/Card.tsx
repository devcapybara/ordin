import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={twMerge(clsx('bg-white rounded-lg shadow-md overflow-hidden', className))}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
