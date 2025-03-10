import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash, Download, Sparkles, Play, Code, Save } from 'lucide-react';
import { ExtensionDescription, generateManifest, generateUI, generateBackgroundScript, generateContentScript } from '@/lib/magic-ai';
import { CodeEditor } from '@/components/editor';
import { ExtensionSimulator } from '@/components/simulator';

export default function ExtensionGeneratorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Extension description state
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [features, setFeatures] = useState<string[]>(['']);
  const [targetAudience, setTargetAudience] = useState('');
  const [permissionsNeeded, setPermissionsNeeded] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Generated code state
  const [manifestCode, setManifestCode] = useState('');
  const [manifestExplanation, setManifestExplanation] = useState('');
  const [popupCode, setPopupCode] = useState('');
  const [popupExplanation, setPopupExplanation] = useState('');
  const [backgroundCode, setBackgroundCode] = useState('');
  const [backgroundExplanation, setBackgroundExplanation] = useState('');
  const [contentCode, setContentCode] = useState('');
  const [contentExplanation, setContentExplanation] = useState('');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'manifest' | 'popup' | 'background' | 'content'>('manifest');
  const [showExplanation, setShowExplanation] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  
  // Editable code states
  const [editableManifest, setEditableManifest] = useState('');
  const [editablePopup, setEditablePopup] = useState('');
  const [editableBackground, setEditableBackground] = useState('');
  const [editableContent, setEditableContent] = useState('');
  
  // Check authentication
  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }
  
  // Feature array handlers
  const addFeature = () => {
    setFeatures([...features, '']);
  };
  
  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };
  
  const removeFeature = (index: number) => {
    if (features.length > 1) {
      const newFeatures = features.filter((_, i) => i !== index);
      setFeatures(newFeatures);
    }
  };
  
  // Permission handlers
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setPermissionsNeeded([...permissionsNeeded, value]);
    } else {
      setPermissionsNeeded(permissionsNeeded.filter(permission => permission !== value));
    }
  };
  
  // Generate extension components
  const handleGenerate = async () => {
    if (!name || !purpose || features.some(f => !f)) {
      alert('Please fill in the required fields: Name, Purpose, and at least one Feature.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Build the extension description
      const description: ExtensionDescription = {
        name,
        purpose,
        features: features.filter(f => !!f),
        targetAudience: targetAudience || undefined,
        permissionsNeeded: permissionsNeeded.length > 0 ? permissionsNeeded : undefined,
        additionalNotes: additionalNotes || undefined,
      };
      
      // Generate manifest
      const manifestResult = await generateManifest(description);
      setManifestCode(manifestResult.manifest);
      setManifestExplanation(manifestResult.explanation);
      setEditableManifest(manifestResult.manifest);
      
      // Generate popup UI
      const popupResult = await generateUI(`A popup UI for ${name}, a Chrome extension that ${purpose.toLowerCase()}.
        Key features include: ${features.filter(f => !!f).join(', ')}.
        ${targetAudience ? `Target audience: ${targetAudience}.` : ''}
        ${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}`, 'popup');
      setPopupCode(popupResult.code);
      setPopupExplanation(popupResult.explanation || '');
      setEditablePopup(popupResult.code);
      
      // Generate background script
      const backgroundResult = await generateBackgroundScript(
        `A background service worker for ${name}, a Chrome extension that ${purpose.toLowerCase()}.
        Key features include: ${features.filter(f => !!f).join(', ')}.
        ${targetAudience ? `Target audience: ${targetAudience}.` : ''}
        ${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}`,
        manifestResult.manifest
      );
      setBackgroundCode(backgroundResult.code);
      setBackgroundExplanation(backgroundResult.explanation || '');
      setEditableBackground(backgroundResult.code);
      
      // Generate content script if needed
      if (permissionsNeeded.includes('activeTab') || permissionsNeeded.includes('scripting')) {
        const contentResult = await generateContentScript(
          `A content script for ${name}, a Chrome extension that ${purpose.toLowerCase()}.
          Key features include: ${features.filter(f => !!f).join(', ')}.
          ${targetAudience ? `Target audience: ${targetAudience}.` : ''}
          ${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}`,
          manifestResult.manifest
        );
        setContentCode(contentResult.code);
        setContentExplanation(contentResult.explanation || '');
        setEditableContent(contentResult.code);
      } else {
        setContentCode('');
        setContentExplanation('');
        setEditableContent('');
      }
    } catch (error) {
      console.error('Error generating extension:', error);
      alert('An error occurred while generating the extension. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Download generated code as a file
  const downloadFile = (content: string, fileName: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Common permissions for Chrome extensions
  const commonPermissions = [
    { value: 'activeTab', label: 'Active Tab' },
    { value: 'storage', label: 'Storage' },
    { value: 'tabs', label: 'Tabs' },
    { value: 'scripting', label: 'Scripting' },
    { value: 'contextMenus', label: 'Context Menus' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'alarms', label: 'Alarms' },
    { value: 'bookmarks', label: 'Bookmarks' },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Extension Generator | ChromeBuilder Pro</title>
      </Head>
      
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard"
              className="mr-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Extension Generator</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Extension Details</h2>
              
              <div className="space-y-4">
                {/* Name input */}
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="My Awesome Extension"
                    required
                  />
                </div>
                
                {/* Purpose input */}
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="purpose">
                    Purpose <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="What does your extension do?"
                    rows={3}
                    required
                  />
                </div>
                
                {/* Features input */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Features <span className="text-red-500">*</span>
                  </label>
                  {features.map((feature, index) => (
                    <div key={index} className="mb-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder={`Feature ${index + 1}`}
                        required={index === 0}
                      />
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Remove feature"
                        disabled={features.length === 1 && index === 0}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <Plus size={16} className="mr-1" />
                    Add feature
                  </button>
                </div>
                
                {/* Target audience input */}
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="targetAudience">
                    Target Audience
                  </label>
                  <input
                    id="targetAudience"
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Who will use your extension?"
                  />
                </div>
                
                {/* Permissions input */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {commonPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center">
                        <input
                          id={`permission-${permission.value}`}
                          type="checkbox"
                          value={permission.value}
                          checked={permissionsNeeded.includes(permission.value)}
                          onChange={handlePermissionChange}
                          className="mr-2 h-4 w-4 rounded border-border"
                        />
                        <label
                          htmlFor={`permission-${permission.value}`}
                          className="text-sm"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Additional notes input */}
                <div>
                  <label className="mb-2 block text-sm font-medium" htmlFor="additionalNotes">
                    Additional Notes
                  </label>
                  <textarea
                    id="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Any other details or requirements"
                    rows={3}
                  />
                </div>
                
                {/* Generate button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  <Sparkles size={16} className="mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate Extension'}
                </button>
              </div>
            </div>
          </div>
          
          <div>
            {(manifestCode || isGenerating) && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Generated Code</h2>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={showExplanation}
                        onChange={(e) => setShowExplanation(e.target.checked)}
                        className="mr-2 h-4 w-4 rounded border-border"
                      />
                      Show explanations
                    </label>
                  </div>
                </div>
                
                {isGenerating ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                      <div className="mb-4 text-3xl">✨</div>
                      <p className="text-muted-foreground">
                        Generating your extension...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex border-b border-border">
                      <button
                        onClick={() => setActiveTab('manifest')}
                        className={`flex items-center px-4 py-2 text-sm font-medium ${
                          activeTab === 'manifest'
                            ? 'border-b-2 border-primary text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        manifest.json
                      </button>
                      <button
                        onClick={() => setActiveTab('popup')}
                        className={`flex items-center px-4 py-2 text-sm font-medium ${
                          activeTab === 'popup'
                            ? 'border-b-2 border-primary text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        popup.html
                      </button>
                      <button
                        onClick={() => setActiveTab('background')}
                        className={`flex items-center px-4 py-2 text-sm font-medium ${
                          activeTab === 'background'
                            ? 'border-b-2 border-primary text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        background.js
                      </button>
                      {contentCode && (
                        <button
                          onClick={() => setActiveTab('content')}
                          className={`flex items-center px-4 py-2 text-sm font-medium ${
                            activeTab === 'content'
                              ? 'border-b-2 border-primary text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          content.js
                        </button>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      {activeTab === 'manifest' && (
                        <div>
                          <div className="relative">
                            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
                              <code>{manifestCode}</code>
                            </pre>
                            <button
                              onClick={() => downloadFile(manifestCode, 'manifest.json')}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background text-muted-foreground shadow hover:text-foreground"
                              title="Download manifest.json"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                          {showExplanation && manifestExplanation && (
                            <div className="mt-4 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
                              <h3 className="mb-2 font-medium text-foreground">Explanation:</h3>
                              <p>{manifestExplanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'popup' && (
                        <div>
                          <div className="relative">
                            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
                              <code>{popupCode}</code>
                            </pre>
                            <button
                              onClick={() => downloadFile(popupCode, 'popup.html')}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background text-muted-foreground shadow hover:text-foreground"
                              title="Download popup.html"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                          {showExplanation && popupExplanation && (
                            <div className="mt-4 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
                              <h3 className="mb-2 font-medium text-foreground">Explanation:</h3>
                              <p>{popupExplanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'background' && (
                        <div>
                          <div className="relative">
                            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
                              <code>{backgroundCode}</code>
                            </pre>
                            <button
                              onClick={() => downloadFile(backgroundCode, 'background.js')}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background text-muted-foreground shadow hover:text-foreground"
                              title="Download background.js"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                          {showExplanation && backgroundExplanation && (
                            <div className="mt-4 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
                              <h3 className="mb-2 font-medium text-foreground">Explanation:</h3>
                              <p>{backgroundExplanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {activeTab === 'content' && contentCode && (
                        <div>
                          <div className="relative">
                            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">
                              <code>{contentCode}</code>
                            </pre>
                            <button
                              onClick={() => downloadFile(contentCode, 'content.js')}
                              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background text-muted-foreground shadow hover:text-foreground"
                              title="Download content.js"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                          {showExplanation && contentExplanation && (
                            <div className="mt-4 rounded-md bg-muted/50 p-4 text-sm text-muted-foreground">
                              <h3 className="mb-2 font-medium text-foreground">Explanation:</h3>
                              <p>{contentExplanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4 flex gap-2">
                      <button
                        onClick={() => setShowEditor(!showEditor)}
                        className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow ${
                          showEditor ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'
                        }`}
                      >
                        <Code size={16} className="mr-2" />
                        {showEditor ? 'Hide Editor' : 'Edit Code'}
                      </button>
                      
                      <button
                        onClick={() => setShowSimulator(!showSimulator)}
                        className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow ${
                          showSimulator ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'
                        }`}
                        disabled={!manifestCode}
                      >
                        <Play size={16} className="mr-2" />
                        {showSimulator ? 'Hide Simulator' : 'Test Extension'}
                      </button>
                    </div>
                    
                    {showEditor && (
                      <div className="mb-4 border border-border rounded-md p-4 bg-card">
                        <h3 className="text-lg font-medium mb-4">Code Editor</h3>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium">{activeTab === 'manifest' ? 'manifest.json' : 
                                             activeTab === 'popup' ? 'popup.html' : 
                                             activeTab === 'background' ? 'background.js' : 'content.js'}</h4>
                            
                            <button
                              onClick={() => {
                                // Update the editable state to match the original code
                                if (activeTab === 'manifest') {
                                  setEditableManifest(manifestCode);
                                } else if (activeTab === 'popup') {
                                  setEditablePopup(popupCode);
                                } else if (activeTab === 'background') {
                                  setEditableBackground(backgroundCode);
                                } else if (activeTab === 'content') {
                                  setEditableContent(contentCode);
                                }
                              }}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Reset to Generated
                            </button>
                          </div>
                          
                          {activeTab === 'manifest' && (
                            <CodeEditor
                              code={editableManifest}
                              language="json"
                              height="400px"
                              onChange={setEditableManifest}
                            />
                          )}
                          
                          {activeTab === 'popup' && (
                            <CodeEditor
                              code={editablePopup}
                              language="html"
                              height="400px"
                              onChange={setEditablePopup}
                            />
                          )}
                          
                          {activeTab === 'background' && (
                            <CodeEditor
                              code={editableBackground}
                              language="javascript"
                              height="400px"
                              onChange={setEditableBackground}
                            />
                          )}
                          
                          {activeTab === 'content' && contentCode && (
                            <CodeEditor
                              code={editableContent}
                              language="javascript"
                              height="400px"
                              onChange={setEditableContent}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {showSimulator && (
                      <div className="mb-4">
                        <ExtensionSimulator
                          manifestJson={showEditor ? editableManifest : manifestCode}
                          popupHtml={showEditor ? editablePopup : popupCode}
                          backgroundJs={showEditor ? editableBackground : backgroundCode}
                          contentJs={showEditor && contentCode ? editableContent : contentCode}
                          height="600px"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to create a new project with this extension?')) {
                              try {
                                // Import from model context protocol
                                const { createContext } = await import('@/modelcontextprotocol/client');
                                const slug = name.toLowerCase().replace(/\s+/g, '-');
                                
                                // Create the project with metadata
                                const projectData = {
                                  name,
                                  slug,
                                  description: purpose,
                                  version: '1.0.0',
                                  files: {
                                    'manifest.json': {
                                      content: showEditor ? editableManifest : manifestCode,
                                      type: 'application/json'
                                    },
                                    'popup.html': {
                                      content: showEditor ? editablePopup : popupCode,
                                      type: 'text/html'
                                    },
                                    'background.js': {
                                      content: showEditor ? editableBackground : backgroundCode,
                                      type: 'application/javascript'
                                    },
                                    ...(contentCode ? {
                                      'content.js': {
                                        content: showEditor ? editableContent : contentCode,
                                        type: 'application/javascript'
                                      }
                                    } : {})
                                  },
                                  metadata: {
                                    features: features.filter(f => !!f),
                                    targetAudience: targetAudience || '',
                                    permissionsNeeded: permissionsNeeded,
                                    createdAt: new Date().toISOString(),
                                    lastModified: new Date().toISOString()
                                  }
                                };
                                
                                // Save to the database using MCP
                                const result = await createContext('projects', slug, projectData);
                                
                                alert('Project saved successfully! You can access it from your dashboard.');
                                router.push(`/dashboard/manifest-editor?projectId=${result.id || slug}`);
                              } catch (error) {
                                console.error('Error saving project:', error);
                                alert('Error saving project. Please try again.');
                              }
                            }
                          }}
                          className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium shadow hover:bg-background"
                        >
                          <Save size={16} className="mr-2" />
                          Save as Project
                        </button>
                        
                        {router.query.projectId && (
                          <>
                            <Link
                              href={`/dashboard/manifest-editor?projectId=${router.query.projectId}`}
                              className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium shadow hover:bg-background"
                              title="Open the visual manifest editor"
                            >
                              <Code size={16} className="mr-2" />
                              Visual Manifest Editor
                            </Link>
                            <Link
                              href={`/dashboard/store-listing?projectId=${router.query.projectId}`}
                              className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium shadow hover:bg-background"
                              title="Prepare Chrome Web Store listing"
                            >
                              <Download size={16} className="mr-2" />
                              Store Listing
                            </Link>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          // Create a zip of all the files using JSZip
                          try {
                            const JSZip = require('jszip');
                            const zip = new JSZip();
                            
                            // Add files to the zip - use edited versions if editor was used
                            zip.file("manifest.json", showEditor ? editableManifest : manifestCode);
                            zip.file("popup.html", showEditor ? editablePopup : popupCode);
                            zip.file("background.js", showEditor ? editableBackground : backgroundCode);
                            if (contentCode) {
                              zip.file("content.js", showEditor ? editableContent : contentCode);
                            }
                            
                            // Generate the zip file
                            zip.generateAsync({type:"blob"}).then(function(content) {
                              // Create download link
                              const element = document.createElement('a');
                              element.href = URL.createObjectURL(content);
                              element.download = `${name.replace(/\s+/g, '-').toLowerCase()}-extension.zip`;
                              document.body.appendChild(element);
                              element.click();
                              document.body.removeChild(element);
                            });
                          } catch (error) {
                            console.error('Error creating zip file:', error);
                            alert('Error creating zip file. Please try again.');
                          }
                        }}
                        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                      >
                        <Download size={16} className="mr-2" />
                        Download All Files
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}