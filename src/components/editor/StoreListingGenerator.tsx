import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { 
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Button
} from '@/components/ui';
import { AlertCircle, Download, CheckCircle2, Upload } from 'lucide-react';

type StoreListingData = {
  name: string;
  summary: string;
  description: string;
  category: string;
  language: string;
  price: 'free' | 'paid';
  website: string;
  privacyPolicy: string;
  screenshots: string[];
  promotionalVideo?: string;
  promotionalImages: {
    small?: string;
    large?: string;
    marquee?: string;
  };
  tags: string[];
}

type StoreListingGeneratorProps = {
  projectData?: any;
  onSave?: (data: StoreListingData) => void;
  onGenerateWithAI?: (prompt: string) => Promise<Partial<StoreListingData>>;
}

const CATEGORIES = [
  'Accessibility', 'Blogging', 'Developer Tools', 'Fun', 
  'News & Weather', 'Photos', 'Productivity', 'Search Tools', 
  'Shopping', 'Social & Communication', 'Sports', 'Utilities'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 
  'Portuguese', 'Russian', 'Japanese', 'Korean', 'Chinese (Simplified)'
];

const StoreListingGenerator: React.FC<StoreListingGeneratorProps> = ({ 
  projectData,
  onSave,
  onGenerateWithAI
}) => {
  const [listingData, setListingData] = useState<StoreListingData>({
    name: projectData?.name || '',
    summary: projectData?.summary || '',
    description: projectData?.description || '',
    category: '',
    language: 'English',
    price: 'free',
    website: '',
    privacyPolicy: '',
    screenshots: [],
    promotionalImages: {},
    tags: []
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  const handleInputChange = (field: keyof StoreListingData, value: any) => {
    setListingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (tagInput && !listingData.tags.includes(tagInput)) {
      setListingData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setListingData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'screenshots') {
          setListingData(prev => ({
            ...prev,
            screenshots: [...prev.screenshots, reader.result as string]
          }));
        } else if (field.startsWith('promotional')) {
          const imageType = field.split('.')[1]; // Get 'small', 'large', etc.
          setListingData(prev => ({
            ...prev,
            promotionalImages: {
              ...prev.promotionalImages,
              [imageType]: reader.result as string
            }
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = (index: number) => {
    setListingData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!onGenerateWithAI || !aiPrompt) return;
    
    setIsGenerating(true);
    try {
      const generatedData = await onGenerateWithAI(aiPrompt);
      setListingData(prev => ({
        ...prev,
        ...generatedData
      }));
    } catch (error) {
      console.error('Error generating with AI:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToProject = () => {
    if (onSave) {
      onSave(listingData);
    }
  };

  const generateZipPackage = () => {
    // Implementation for generating a ZIP file with Chrome Web Store assets
    alert('Package generation feature will be implemented in a future update');
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Chrome Web Store Listing Generator</CardTitle>
          <CardDescription>
            Create a professional listing for the Chrome Web Store including all required assets and metadata.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-400">Important Store Requirements</h4>
                <p className="text-sm text-amber-700 dark:text-amber-500">
                  Your extension listing needs a detailed description, at least 1-5 screenshots (1280x800 or 640x400),
                  and promotional images. Higher quality listings improve chances of getting featured and increase user trust.
                </p>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="basic" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="media">Media Assets</TabsTrigger>
              <TabsTrigger value="additional">Additional Info</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Extension Name</Label>
                  <Input 
                    id="name" 
                    value={listingData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="My Chrome Extension"
                    maxLength={45}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum 45 characters. This is the public name of your extension in the Chrome Web Store.
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Input 
                    id="summary" 
                    value={listingData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder="A brief summary of what your extension does"
                    maxLength={132}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum 132 characters. This appears in search results.
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={listingData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed description of your extension, its features, and benefits"
                    className="min-h-32"
                  />
                  <p className="text-xs text-gray-500">
                    This is the full description of your extension. Use formatting and be detailed about features and use cases.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={listingData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="language">Primary Language</Label>
                    <select
                      id="language"
                      value={listingData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    >
                      {LANGUAGES.map((language) => (
                        <option key={language} value={language}>{language}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Screenshots (Required)</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload 1-5 screenshots of your extension in action. Recommended size: 1280x800 or 640x400 pixels.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  {listingData.screenshots.map((screenshot, index) => (
                    <div key={index} className="relative w-40 h-24 border rounded-md overflow-hidden">
                      <img src={screenshot} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeScreenshot(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  
                  {listingData.screenshots.length < 5 && (
                    <label className="w-40 h-24 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-900">
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto text-gray-400" />
                        <span className="text-xs mt-1 block text-gray-500">Upload</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload('screenshots', e)} 
                      />
                    </label>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Promotional Images</h3>
                <p className="text-sm text-gray-500 mb-4">
                  These images are used to promote your extension within the Chrome Web Store.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium mb-2">Small Promo Tile (440x280 px)</p>
                    <div className="border rounded-md overflow-hidden h-36 relative">
                      {listingData.promotionalImages.small ? (
                        <>
                          <img 
                            src={listingData.promotionalImages.small} 
                            alt="Small promotional image" 
                            className="w-full h-full object-cover" 
                          />
                          <button 
                            onClick={() => setListingData(prev => ({
                              ...prev, 
                              promotionalImages: {
                                ...prev.promotionalImages,
                                small: undefined
                              }
                            }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-900">
                          <div className="text-center">
                            <Upload className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-xs mt-1 block text-gray-500">440×280 px</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload('promotional.small', e)} 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Large Promo Tile (920×680 px)</p>
                    <div className="border rounded-md overflow-hidden h-36 relative">
                      {listingData.promotionalImages.large ? (
                        <>
                          <img 
                            src={listingData.promotionalImages.large} 
                            alt="Large promotional image" 
                            className="w-full h-full object-cover" 
                          />
                          <button 
                            onClick={() => setListingData(prev => ({
                              ...prev, 
                              promotionalImages: {
                                ...prev.promotionalImages,
                                large: undefined
                              }
                            }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-900">
                          <div className="text-center">
                            <Upload className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-xs mt-1 block text-gray-500">920×680 px</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload('promotional.large', e)} 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium mb-2">Marquee Promo Tile (1400×560 px)</p>
                    <div className="border rounded-md overflow-hidden h-36 relative">
                      {listingData.promotionalImages.marquee ? (
                        <>
                          <img 
                            src={listingData.promotionalImages.marquee} 
                            alt="Marquee promotional image" 
                            className="w-full h-full object-cover" 
                          />
                          <button 
                            onClick={() => setListingData(prev => ({
                              ...prev, 
                              promotionalImages: {
                                ...prev.promotionalImages,
                                marquee: undefined
                              }
                            }))}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-900">
                          <div className="text-center">
                            <Upload className="w-6 h-6 mx-auto text-gray-400" />
                            <span className="text-xs mt-1 block text-gray-500">1400×560 px (Featured extensions)</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload('promotional.marquee', e)} 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Promotional Video (Optional)</h3>
                <p className="text-sm text-gray-500 mb-2">
                  A YouTube video showcasing your extension's functionality.
                </p>
                <Input 
                  placeholder="YouTube video URL" 
                  value={listingData.promotionalVideo || ''}
                  onChange={(e) => handleInputChange('promotionalVideo', e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="additional" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="website">Extension Website (Optional)</Label>
                  <Input 
                    id="website" 
                    value={listingData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="privacy">Privacy Policy URL</Label>
                  <Input 
                    id="privacy" 
                    value={listingData.privacyPolicy}
                    onChange={(e) => handleInputChange('privacyPolicy', e.target.value)}
                    placeholder="https://example.com/privacy"
                  />
                  <p className="text-xs text-gray-500">
                    Required if your extension collects user data or requires sensitive permissions.
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-grow"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button onClick={addTag} type="button" variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {listingData.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="w-4 h-4 rounded-full inline-flex items-center justify-center hover:bg-blue-800 hover:text-white">
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Add tags that describe your extension's functionality (up to 5 tags).
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="price">Pricing</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="price-free"
                        name="price"
                        value="free"
                        checked={listingData.price === 'free'}
                        onChange={() => handleInputChange('price', 'free')}
                      />
                      <Label htmlFor="price-free">Free</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="price-paid"
                        name="price"
                        value="paid"
                        checked={listingData.price === 'paid'}
                        onChange={() => handleInputChange('price', 'paid')}
                      />
                      <Label htmlFor="price-paid">Paid</Label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Note: To list a paid extension, additional registration with Google Payments is required.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="ai-prompt" className="block mb-2">Tell AI what kind of store listing you want</Label>
                  <Textarea 
                    id="ai-prompt" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the purpose and features of your extension. The more details you provide, the better the AI-generated content will be."
                    className="min-h-32"
                  />
                </div>
                
                <div>
                  <Button 
                    onClick={handleGenerateWithAI} 
                    disabled={isGenerating || !aiPrompt}
                    className="w-full"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Store Listing Content'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    This will use AI to generate a description, summary, and suggested tags for your extension.
                    You can edit the results afterwards.
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md mt-4">
                  <h4 className="font-medium mb-2">AI Assistant Tips</h4>
                  <ul className="list-disc list-inside text-sm space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Specify your target audience (developers, students, professionals)</li>
                    <li>Mention key features or benefits that make your extension special</li>
                    <li>Include any unique use cases or problems your extension solves</li>
                    <li>Request a specific tone (professional, friendly, technical)</li>
                    <li>Ask for specific category suggestions or SEO-friendly tags</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setActiveTab(activeTab === 'basic' ? 'media' : activeTab === 'media' ? 'additional' : activeTab === 'additional' ? 'ai' : 'basic')}>
            {activeTab === 'ai' ? 'Back to Basic Info' : 'Next Step'}
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={generateZipPackage}>
              <Download className="mr-2 h-4 w-4" />
              Export Assets
            </Button>
            <Button onClick={handleSaveToProject}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Save to Project
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <div className="rounded-md bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-medium mb-2">Chrome Web Store Submission Checklist</h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-name" className="rounded" />
            <Label htmlFor="check-name">Name and description complete</Label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-screenshots" className="rounded" />
            <Label htmlFor="check-screenshots">At least one screenshot added</Label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-category" className="rounded" />
            <Label htmlFor="check-category">Category selected</Label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-privacy" className="rounded" />
            <Label htmlFor="check-privacy">Privacy policy added (if needed)</Label>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" id="check-promo" className="rounded" />
            <Label htmlFor="check-promo">Promotional images prepared</Label>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StoreListingGenerator;