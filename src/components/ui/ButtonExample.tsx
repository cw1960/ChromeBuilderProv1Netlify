import React from "react";
import { Button } from "./Button";

const ButtonExample = () => {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold">Button Examples</h2>
      
      <div className="flex flex-wrap gap-4">
        {/* Default button */}
        <Button>Default Button</Button>
        
        {/* Variants */}
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        
        {/* Sizes */}
        <Button size="sm">Small</Button>
        <Button size="default">Default Size</Button>
        <Button size="lg">Large</Button>
        
        {/* With icon */}
        <Button>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="mr-2 h-4 w-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          With Icon
        </Button>
        
        {/* Icon only */}
        <Button size="icon" aria-label="Add item">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </Button>
        
        {/* Disabled state */}
        <Button disabled>Disabled</Button>
      </div>
    </div>
  );
};

export default ButtonExample;