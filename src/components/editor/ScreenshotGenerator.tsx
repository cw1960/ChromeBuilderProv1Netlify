import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@radix-ui/react-card';
import { Camera, Download, Image, Upload, Plus, Trash2, PaintBucket, Type, WindowIcon } from 'lucide-react';

type ScreenshotGeneratorProps = {
  projectData?: any;
  onSave?: (screenshots: string[]) => void;
};

const ScreenshotGenerator: React.FC<ScreenshotGeneratorProps> = ({ 
  projectData,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('browser');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [browserFrame, setBrowserFrame] = useState<string>('chrome'); // chrome, firefox, edge
  const [browserTheme, setBrowserTheme] = useState<string>('light'); // light, dark
  const [browserUrl, setBrowserUrl] = useState<string>('https://example.com');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [overlayText, setOverlayText] = useState<string>('');
  const [overlayPosition, setOverlayPosition] = useState<string>('bottom'); // top, center, bottom
  const [overlayColor, setOverlayColor] = useState<string>('#000000');
  const [overlayBgColor, setOverlayBgColor] = useState<string>('#ffffff80');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Function to capture the current screenshot
  const captureScreenshot = () => {
    if (!contentRef.current) return;
    
    // Use html2canvas or a similar library to capture the content
    try {
      // This is a simplified version. In a real implementation, you would use html2canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // For the demo, we'll just create a colored rectangle with text
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(100, 100, canvas.width - 200, canvas.height - 200);
        
        // Add browser frame if selected
        if (activeTab === 'browser') {
          ctx.fillStyle = browserTheme === 'dark' ? '#2a2a2a' : '#f9f9f9';
          ctx.fillRect(100, 100, canvas.width - 200, 80);
          
          // URL bar
          ctx.fillStyle = browserTheme === 'dark' ? '#444444' : '#ffffff';
          ctx.fillRect(150, 125, canvas.width - 300, 30);
          
          ctx.fillStyle = browserTheme === 'dark' ? '#aaaaaa' : '#333333';
          ctx.font = '14px Arial';
          ctx.fillText(browserUrl, 160, 145);
        }
        
        // Add overlay text if provided
        if (overlayText) {
          ctx.fillStyle = overlayBgColor;
          
          // Calculate position based on selection
          let textY = 0;
          if (overlayPosition === 'top') {
            ctx.fillRect(100, 100, canvas.width - 200, 60);
            textY = 140;
          } else if (overlayPosition === 'center') {
            ctx.fillRect(100, (canvas.height / 2) - 30, canvas.width - 200, 60);
            textY = canvas.height / 2 + 10;
          } else { // bottom
            ctx.fillRect(100, canvas.height - 160, canvas.width - 200, 60);
            textY = canvas.height - 120;
          }
          
          ctx.fillStyle = overlayColor;
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(overlayText, canvas.width / 2, textY);
        }
        
        // Convert to base64 and save
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshots([...screenshots, dataUrl]);
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Failed to capture screenshot. Please try again.');
    }
  };
  
  // Function to upload an image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setScreenshots([...screenshots, result]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Function to remove a screenshot
  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  };
  
  // Function to download all screenshots as a zip
  const downloadScreenshots = () => {
    try {
      const JSZip = require('jszip');
      const zip = new JSZip();
      
      screenshots.forEach((screenshot, index) => {
        // Convert base64 to blob
        const byteString = atob(screenshot.split(',')[1]);
        const mimeString = screenshot.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        zip.file(`screenshot_${index + 1}.png`, blob);
      });
      
      zip.generateAsync({ type: 'blob' }).then((content: Blob) => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'screenshots.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Error creating zip file. Please try again.');
    }
  };
  
  // Function to save screenshots to the project
  const saveToProject = () => {
    if (onSave) {
      onSave(screenshots);
    }
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chrome Web Store Screenshot Generator</CardTitle>
          <CardDescription>
            Create professional screenshots for your Chrome Web Store listing. 
            Recommended size: 1280×800 or 640×400 pixels.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 mb-4">
                <h3 className="text-lg font-medium mb-4">Preview Area</h3>
                
                <div 
                  ref={contentRef} 
                  className="w-full aspect-video relative bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
                  style={{ backgroundColor }}
                >
                  {activeTab === 'browser' && (
                    <div className={`browser-frame ${browserFrame} ${browserTheme}`}>
                      <div className="browser-header">
                        <div className="browser-controls">
                          <span className="browser-circle"></span>
                          <span className="browser-circle"></span>
                          <span className="browser-circle"></span>
                        </div>
                        <div className="browser-address-bar">
                          <span>{browserUrl}</span>
                        </div>
                      </div>
                      <div className="browser-content">
                        {/* Content would go here */}
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <p>Browser content area</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'upload' && imageRef.current && (
                    <img 
                      ref={imageRef}
                      src={imageRef.current.src}
                      alt="Uploaded content"
                      className="w-full h-full object-contain"
                    />
                  )}
                  
                  {overlayText && (
                    <div 
                      className={`overlay-text absolute w-full px-6 py-3 text-center ${
                        overlayPosition === 'top' ? 'top-0' : 
                        overlayPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 
                        'bottom-0'
                      }`}
                      style={{ 
                        backgroundColor: overlayBgColor,
                        color: overlayColor
                      }}
                    >
                      <p className="font-bold text-xl">{overlayText}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center mt-4">
                  <button
                    onClick={captureScreenshot}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Screenshot
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Screenshots Gallery</h3>
                
                {screenshots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No screenshots yet. Capture or upload some!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {screenshots.map((screenshot, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={screenshot} 
                          alt={`Screenshot ${index + 1}`} 
                          className="w-full h-auto rounded-md border border-gray-300 dark:border-gray-700"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => removeScreenshot(index)}
                            className="p-1 bg-red-500 text-white rounded-full"
                            title="Remove screenshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {screenshots.length < 5 && (
                      <div className="flex items-center justify-center border-2 border-dashed rounded-md h-32 text-gray-400">
                        <label className="cursor-pointer text-center p-4">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <span className="text-sm">Upload Image</span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
                
                {screenshots.length > 0 && (
                  <div className="flex justify-end mt-4 gap-2">
                    <button
                      onClick={downloadScreenshots}
                      className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </button>
                    
                    <button
                      onClick={saveToProject}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save to Project
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="border rounded-lg">
                <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="flex w-full border-b">
                    <TabsTrigger 
                      value="browser" 
                      className={`flex-1 px-4 py-2 text-center ${activeTab === 'browser' ? 'border-b-2 border-blue-500' : ''}`}
                    >
                      <WindowIcon className="w-4 h-4 mx-auto mb-1" />
                      Browser
                    </TabsTrigger>
                    <TabsTrigger 
                      value="upload" 
                      className={`flex-1 px-4 py-2 text-center ${activeTab === 'upload' ? 'border-b-2 border-blue-500' : ''}`}
                    >
                      <Upload className="w-4 h-4 mx-auto mb-1" />
                      Upload
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="browser" className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Browser Style</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setBrowserFrame('chrome')}
                          className={`p-2 border rounded-md text-center text-sm ${
                            browserFrame === 'chrome' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                          }`}
                        >
                          Chrome
                        </button>
                        <button
                          onClick={() => setBrowserFrame('firefox')}
                          className={`p-2 border rounded-md text-center text-sm ${
                            browserFrame === 'firefox' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                          }`}
                        >
                          Firefox
                        </button>
                        <button
                          onClick={() => setBrowserFrame('edge')}
                          className={`p-2 border rounded-md text-center text-sm ${
                            browserFrame === 'edge' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                          }`}
                        >
                          Edge
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Browser Theme</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setBrowserTheme('light')}
                          className={`p-2 border rounded-md text-center text-sm ${
                            browserTheme === 'light' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                          }`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setBrowserTheme('dark')}
                          className={`p-2 border rounded-md text-center text-sm ${
                            browserTheme === 'dark' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="browser-url">URL</label>
                      <input
                        id="browser-url"
                        type="text"
                        value={browserUrl}
                        onChange={(e) => setBrowserUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload" className="p-4 space-y-4">
                    <div className="border-2 border-dashed rounded-md p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 mb-2">Upload an image to use as screenshot base</p>
                      <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (imageRef.current) {
                                  imageRef.current.src = reader.result as string;
                                } else {
                                  // Create a new image element if it doesn't exist
                                  const img = new Image();
                                  img.src = reader.result as string;
                                  imageRef.current = img;
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        Choose File
                      </label>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="p-4 border-t space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="background-color">
                      <PaintBucket className="w-4 h-4 inline-block mr-1" />
                      Background Color
                    </label>
                    <div className="flex">
                      <input
                        id="background-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-10 h-10 border rounded-l-md p-1"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="flex-grow p-2 border border-l-0 rounded-r-md"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="overlay-text">
                      <Type className="w-4 h-4 inline-block mr-1" />
                      Overlay Text
                    </label>
                    <input
                      id="overlay-text"
                      type="text"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Add text overlay..."
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  
                  {overlayText && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Text Position</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setOverlayPosition('top')}
                            className={`p-2 border rounded-md text-center text-sm ${
                              overlayPosition === 'top' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                            }`}
                          >
                            Top
                          </button>
                          <button
                            onClick={() => setOverlayPosition('center')}
                            className={`p-2 border rounded-md text-center text-sm ${
                              overlayPosition === 'center' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                            }`}
                          >
                            Center
                          </button>
                          <button
                            onClick={() => setOverlayPosition('bottom')}
                            className={`p-2 border rounded-md text-center text-sm ${
                              overlayPosition === 'bottom' ? 'bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400' : ''
                            }`}
                          >
                            Bottom
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="text-color">
                          Text Color
                        </label>
                        <div className="flex">
                          <input
                            id="text-color"
                            type="color"
                            value={overlayColor}
                            onChange={(e) => setOverlayColor(e.target.value)}
                            className="w-10 h-10 border rounded-l-md p-1"
                          />
                          <input
                            type="text"
                            value={overlayColor}
                            onChange={(e) => setOverlayColor(e.target.value)}
                            className="flex-grow p-2 border border-l-0 rounded-r-md"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="bg-color">
                          Background Color
                        </label>
                        <div className="flex">
                          <input
                            id="bg-color"
                            type="color"
                            value={overlayBgColor.substring(0, 7)}
                            onChange={(e) => setOverlayBgColor(e.target.value + '80')}
                            className="w-10 h-10 border rounded-l-md p-1"
                          />
                          <input
                            type="text"
                            value={overlayBgColor}
                            onChange={(e) => setOverlayBgColor(e.target.value)}
                            className="flex-grow p-2 border border-l-0 rounded-r-md"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Use hex format with alpha (e.g., #ffffff80 for 50% white).
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4">
          <div>
            <p className="text-sm text-gray-500">
              Recommended: Create 3-5 screenshots to showcase your extension's features.
            </p>
          </div>
        </CardFooter>
      </Card>
      
      {/* Add some CSS for the browser frame */}
      <style jsx>{`
        .browser-frame {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .browser-header {
          height: 36px;
          background-color: ${browserTheme === 'dark' ? '#333' : '#f0f0f0'};
          border-bottom: 1px solid ${browserTheme === 'dark' ? '#444' : '#ccc'};
          display: flex;
          align-items: center;
          padding: 0 10px;
        }
        
        .browser-controls {
          display: flex;
          gap: 6px;
          margin-right: 12px;
        }
        
        .browser-circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${browserTheme === 'dark' ? '#666' : '#ccc'};
        }
        
        .browser-circle:nth-child(1) {
          background-color: ${browserFrame === 'chrome' ? (browserTheme === 'dark' ? '#ff6b6b' : '#ff5f57') : (browserTheme === 'dark' ? '#666' : '#ccc')};
        }
        
        .browser-circle:nth-child(2) {
          background-color: ${browserFrame === 'chrome' ? (browserTheme === 'dark' ? '#ffb36b' : '#ffbd2e') : (browserTheme === 'dark' ? '#666' : '#ccc')};
        }
        
        .browser-circle:nth-child(3) {
          background-color: ${browserFrame === 'chrome' ? (browserTheme === 'dark' ? '#6bff6b' : '#28c940') : (browserTheme === 'dark' ? '#666' : '#ccc')};
        }
        
        .browser-address-bar {
          flex-grow: 1;
          height: 24px;
          background-color: ${browserTheme === 'dark' ? '#444' : '#fff'};
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          font-size: 12px;
          color: ${browserTheme === 'dark' ? '#aaa' : '#333'};
        }
        
        .browser-content {
          flex-grow: 1;
          background-color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Specific browser styles */
        .browser-frame.chrome .browser-header {
          padding-top: 4px;
        }
        
        .browser-frame.firefox .browser-header {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
        }
        
        .browser-frame.edge .browser-header {
          background: ${browserTheme === 'dark' ? 'linear-gradient(to right, #333, #444)' : 'linear-gradient(to right, #f0f0f0, #fafafa)'};
        }
      `}</style>
    </div>
  );
};

export default ScreenshotGenerator;