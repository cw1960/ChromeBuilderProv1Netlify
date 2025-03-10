import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, RefreshCw, Copy, Image as ImageIcon } from 'lucide-react';

interface IconGeneratorProps {
  onIconsGenerated: (icons: { [size: string]: string }) => void;
}

const ICON_SIZES = [16, 48, 128];

const IconGenerator: React.FC<IconGeneratorProps> = ({ onIconsGenerated }) => {
  const [iconImage, setIconImage] = useState<HTMLImageElement | null>(null);
  const [iconColor, setIconColor] = useState('#4285F4'); // Google blue
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [iconText, setIconText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIcons, setGeneratedIcons] = useState<{ [size: string]: string }>({});
  const [iconShape, setIconShape] = useState<'circle' | 'square' | 'rounded'>('rounded');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Generate the icon based on current settings
  const generateIcon = async () => {
    setIsGenerating(true);
    
    const icons: { [size: string]: string } = {};
    
    // Generate icons for all sizes
    for (const size of ICON_SIZES) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get canvas context');
        continue;
      }
      
      // Draw background
      ctx.fillStyle = backgroundColor;
      
      if (iconShape === 'circle') {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (iconShape === 'rounded') {
        const radius = size * 0.2; // 20% of size as radius
        ctx.beginPath();
        ctx.moveTo(size - radius, 0);
        ctx.arcTo(size, 0, size, radius, radius);
        ctx.arcTo(size, size, size - radius, size, radius);
        ctx.arcTo(0, size, 0, size - radius, radius);
        ctx.arcTo(0, 0, radius, 0, radius);
        ctx.closePath();
        ctx.fill();
      } else {
        // Square
        ctx.fillRect(0, 0, size, size);
      }
      
      // If we have an icon image, draw it
      if (iconImage) {
        // Calculate dimensions to maintain aspect ratio
        const aspectRatio = iconImage.width / iconImage.height;
        let drawWidth = size * 0.7; // Use 70% of the icon size
        let drawHeight = drawWidth / aspectRatio;
        
        // Ensure the image fits within the icon
        if (drawHeight > size * 0.7) {
          drawHeight = size * 0.7;
          drawWidth = drawHeight * aspectRatio;
        }
        
        // Center the image
        const x = (size - drawWidth) / 2;
        const y = (size - drawHeight) / 2;
        
        ctx.drawImage(iconImage, x, y, drawWidth, drawHeight);
      } else if (iconText) {
        // Draw text
        ctx.fillStyle = iconColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Scale font size based on icon size
        const fontSize = Math.max(size * 0.4, 8); // Min 8px
        ctx.font = `bold ${fontSize}px Arial`;
        
        // Draw text in the center
        ctx.fillText(iconText.substring(0, 2).toUpperCase(), size / 2, size / 2);
      } else {
        // Draw a simple placeholder icon
        ctx.fillStyle = iconColor;
        const margin = size * 0.25;
        ctx.fillRect(margin, margin, size - margin * 2, size - margin * 2);
      }
      
      // Get the data URL and store it
      icons[size] = canvas.toDataURL('image/png');
    }
    
    setGeneratedIcons(icons);
    onIconsGenerated(icons);
    setIsGenerating(false);
  };
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setIconImage(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  // Handle clicking the upload button
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Download all icons as a zip
  const downloadAllIcons = async () => {
    try {
      const JSZip = require('jszip');
      const zip = new JSZip();
      
      // Add each icon to the zip
      for (const size of ICON_SIZES) {
        const iconData = generatedIcons[size];
        if (iconData) {
          // Convert data URL to blob
          const response = await fetch(iconData);
          const blob = await response.blob();
          zip.file(`icon${size}.png`, blob);
        }
      }
      
      // Generate and download the zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'extension-icons.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Error creating zip file. Please try again.');
    }
  };
  
  // Copy icon data URL to clipboard
  const copyIconUrl = (size: number) => {
    const iconData = generatedIcons[size];
    if (iconData) {
      navigator.clipboard.writeText(iconData)
        .then(() => {
          alert(`Icon ${size}px data URL copied to clipboard!`);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    }
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Extension Icon Generator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Icon Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex items-center px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <Upload size={16} className="mr-2" />
                  Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => {
                    setIconImage(null);
                    setIconText('');
                  }}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                  title="Clear image and text"
                >
                  Reset
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="iconText" className="block text-sm font-medium mb-1">
                Icon Text (max 2 chars)
              </label>
              <input
                id="iconText"
                type="text"
                value={iconText}
                onChange={(e) => setIconText(e.target.value.substring(0, 2))}
                placeholder="e.g. AB, X"
                maxLength={2}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="iconColor" className="block text-sm font-medium mb-1">
                Icon Color
              </label>
              <div className="flex items-center">
                <input
                  id="iconColor"
                  type="color"
                  value={iconColor}
                  onChange={(e) => setIconColor(e.target.value)}
                  className="w-12 h-8 mr-2 border border-input rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={iconColor}
                  onChange={(e) => setIconColor(e.target.value)}
                  className="px-3 py-2 bg-background border border-input rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="backgroundColor" className="block text-sm font-medium mb-1">
                Background Color
              </label>
              <div className="flex items-center">
                <input
                  id="backgroundColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-8 mr-2 border border-input rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="px-3 py-2 bg-background border border-input rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Icon Shape</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIconShape('circle')}
                  className={`px-3 py-2 rounded-md text-sm flex-1 ${iconShape === 'circle' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border border-input bg-background'}`}
                >
                  Circle
                </button>
                <button
                  type="button"
                  onClick={() => setIconShape('rounded')}
                  className={`px-3 py-2 rounded-md text-sm flex-1 ${iconShape === 'rounded' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border border-input bg-background'}`}
                >
                  Rounded
                </button>
                <button
                  type="button"
                  onClick={() => setIconShape('square')}
                  className={`px-3 py-2 rounded-md text-sm flex-1 ${iconShape === 'square' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border border-input bg-background'}`}
                >
                  Square
                </button>
              </div>
            </div>
            
            <div>
              <button
                onClick={generateIcon}
                disabled={isGenerating}
                className="w-full px-4 py-2 mt-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon size={16} className="mr-2" />
                    Generate Icons
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Preview</h3>
          
          {Object.keys(generatedIcons).length > 0 ? (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {ICON_SIZES.map(size => (
                  <div key={size} className="flex flex-col items-center">
                    <div className="bg-muted p-2 rounded-md mb-1 flex items-center justify-center" style={{ width: Math.max(size, 64), height: Math.max(size, 64) }}>
                      <img 
                        src={generatedIcons[size]} 
                        alt={`${size}x${size} icon`}
                        width={size} 
                        height={size} 
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <div className="text-xs text-center">{size}x{size}</div>
                    <div className="flex mt-1 gap-1">
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedIcons[size];
                          link.download = `icon${size}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-1 bg-muted hover:bg-muted/80 rounded"
                        title="Download"
                      >
                        <Download size={12} />
                      </button>
                      <button
                        onClick={() => copyIconUrl(size)}
                        className="p-1 bg-muted hover:bg-muted/80 rounded"
                        title="Copy data URL"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={downloadAllIcons}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 flex items-center justify-center"
              >
                <Download size={16} className="mr-2" />
                Download All Icons (ZIP)
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-md p-8 h-64">
              <ImageIcon size={48} className="text-muted-foreground mb-4 opacity-30" />
              <p className="text-muted-foreground">
                Icon preview will appear here
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Generate icons in different sizes for your extension
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-border">
        <h3 className="text-md font-medium mb-2">How to Use in Your Manifest</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Add the following to your manifest.json:
        </p>
        <pre className="p-3 bg-muted rounded-md text-xs overflow-auto">
{`"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}`}
        </pre>
        <p className="text-xs text-muted-foreground mt-2">
          Make sure to create an "icons" folder in your extension directory and save the generated icons there.
        </p>
      </div>
    </div>
  );
};

export default IconGenerator;