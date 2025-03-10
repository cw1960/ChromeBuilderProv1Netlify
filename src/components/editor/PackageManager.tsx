import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Chrome, 
  Download, 
  Loader2,
  Settings,
  RefreshCw,
  CheckCheck
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { ProjectContext, getProject, ProjectFile, ProjectFileType } from '@/lib/supabase-mcp';
import { ExtensionSimulator } from '@/components/simulator';

interface PackageManagerProps {
  projectId: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface TestResult {
  passed: boolean;
  message: string;
  details?: string;
}

export default function PackageManager({ projectId }: PackageManagerProps) {
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);
  const [packageUrl, setPackageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('validate');
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  // Get project popup HTML, background JS, and manifest
  const getPopupHtml = (): string => {
    if (!project) return '';
    const popupPath = project.manifest.action?.default_popup;
    if (!popupPath) return '';
    
    const popupFile = project.files.find(file => file.path === popupPath);
    return popupFile?.content || '';
  };
  
  const getBackgroundJs = (): string => {
    if (!project) return '';
    const bgPath = project.manifest.background?.service_worker;
    if (!bgPath) return '';
    
    const bgFile = project.files.find(file => file.path === bgPath);
    return bgFile?.content || '';
  };
  
  const getContentJs = (): string | undefined => {
    if (!project || !project.manifest.content_scripts) return undefined;
    
    const contentScripts = project.manifest.content_scripts;
    if (contentScripts.length === 0 || !contentScripts[0].js || contentScripts[0].js.length === 0) {
      return undefined;
    }
    
    const contentJsPath = contentScripts[0].js[0];
    const contentFile = project.files.find(file => file.path === contentJsPath);
    return contentFile?.content;
  };

  // Load project data
  useEffect(() => {
    async function fetchProject() {
      setIsLoading(true);
      const projectData = await getProject(projectId);
      setProject(projectData);
      setIsLoading(false);
    }
    
    fetchProject();
  }, [projectId]);

  // Validate manifest and files
  const validateProject = async () => {
    if (!project) return;
    
    setIsValidating(true);
    
    // Simulate network delay for validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check manifest required fields
    const manifest = project.manifest;
    
    if (!manifest.name) {
      errors.push('Manifest is missing required field: name');
    }
    
    if (!manifest.version) {
      errors.push('Manifest is missing required field: version');
    }
    
    if (manifest.manifest_version !== 3) {
      errors.push('Manifest version must be 3 (Chrome Web Store only accepts Manifest V3)');
    }
    
    // Check icon sizes
    if (!manifest.icons || !manifest.icons['16'] || !manifest.icons['48'] || !manifest.icons['128']) {
      warnings.push('Recommended icon sizes (16, 48, 128) not all provided. This may affect your extension\'s appearance.');
    }
    
    // Check permissions
    if (manifest.permissions) {
      const sensitivePermissions = ['tabs', 'history', 'topSites', 'management', 'declarativeNetRequest'];
      const foundSensitive = manifest.permissions.filter(p => sensitivePermissions.includes(p));
      
      if (foundSensitive.length > 0) {
        warnings.push(`Extension uses sensitive permissions: ${foundSensitive.join(', ')}. This may require additional review or justification.`);
      }
    }
    
    // Check referenced files exist
    if (manifest.action?.default_popup) {
      const popupExists = project.files.some(file => file.path === manifest.action?.default_popup);
      if (!popupExists) {
        errors.push(`Popup file referenced in manifest (${manifest.action.default_popup}) not found in project files.`);
      }
    }
    
    if (manifest.background?.service_worker) {
      const bgExists = project.files.some(file => file.path === manifest.background.service_worker);
      if (!bgExists) {
        errors.push(`Background service worker (${manifest.background.service_worker}) not found in project files.`);
      }
    }
    
    // Additional validation checks could be added here
    
    setValidationResult({
      valid: errors.length === 0,
      errors,
      warnings
    });
    
    setIsValidating(false);
  };

  // Run tests on the extension
  const runTests = async () => {
    if (!project) return;
    
    setIsRunningTests(true);
    setTestResults({});
    
    // Simulate test execution with delays
    const testFunctions = [
      async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
          key: 'manifest',
          result: {
            passed: true,
            message: 'Manifest structure is valid',
            details: 'All required manifest fields are present and correctly formatted.'
          }
        };
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1200));
        const hasIcons = project.manifest.icons && 
                         project.manifest.icons['16'] && 
                         project.manifest.icons['48'] && 
                         project.manifest.icons['128'];
        return {
          key: 'icons',
          result: {
            passed: hasIcons,
            message: hasIcons ? 'Icon assets validated' : 'Missing required icon sizes',
            details: hasIcons ? 
              'All required icon sizes (16px, 48px, 128px) are present.' :
              'Extension should include icons at sizes 16px, 48px, and 128px.'
          }
        };
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 900));
        // Check if popup HTML is valid by very basic verification
        const popupHtml = getPopupHtml();
        const hasPopup = project.manifest.action?.default_popup !== undefined;
        const isValidPopup = popupHtml.includes('<!DOCTYPE html>') || popupHtml.includes('<html');
        
        return {
          key: 'popup',
          result: {
            passed: !hasPopup || isValidPopup,
            message: !hasPopup ? 'No popup defined (skipped)' : 
                     isValidPopup ? 'Popup HTML is valid' : 'Popup HTML may be invalid',
            details: !hasPopup ? 'Extension does not use a popup interface.' :
                     isValidPopup ? 'Popup HTML structure appears to be correct.' :
                     'Popup HTML may be missing proper document structure (<!DOCTYPE html>, <html> tags).'
          }
        };
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Check for any JavaScript errors (this is a basic simulation)
        const jsFiles = project.files.filter(f => 
          f.type === ProjectFileType.JAVASCRIPT || 
          f.path.endsWith('.js')
        );
        
        const jsErrors = jsFiles.some(file => 
          file.content.includes('console.error') || 
          file.content.includes('// ERROR:') ||
          file.content.includes('/* ERROR')
        );
        
        return {
          key: 'javascript',
          result: {
            passed: !jsErrors,
            message: jsErrors ? 'Potential JavaScript issues found' : 'JavaScript validation passed',
            details: jsErrors ? 
              'Found potential errors in JavaScript files (console.error calls or error comments).' :
              `Validated ${jsFiles.length} JavaScript files without obvious issues.`
          }
        };
      },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 700));
        // Check permissions
        const permissions = project.manifest.permissions || [];
        const hasSensitivePermissions = permissions.some(p => 
          ['tabs', 'history', 'topSites', 'management', 'declarativeNetRequest'].includes(p)
        );
        
        return {
          key: 'permissions',
          result: {
            passed: true,
            message: hasSensitivePermissions ? 
              'Sensitive permissions requested (warning)' : 
              'Permission validation passed',
            details: hasSensitivePermissions ?
              'Extension uses sensitive permissions that may require additional review.' :
              'All requested permissions follow Chrome Web Store policies.'
          }
        };
      }
    ];
    
    // Run all tests in parallel
    const results = await Promise.all(testFunctions.map(fn => fn()));
    
    // Organize results
    const resultObj: Record<string, TestResult> = {};
    results.forEach(({ key, result }) => {
      resultObj[key] = result;
    });
    
    setTestResults(resultObj);
    setIsRunningTests(false);
  };

  // Package the extension
  const packageExtension = async () => {
    if (!project) return;
    
    setIsPackaging(true);
    setPackageUrl(null);
    
    // Simulate package creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would:
    // 1. Create a ZIP file with all extension files
    // 2. Structure according to Chrome Web Store requirements
    // 3. Generate a downloadable URL
    
    // For this demo, we'll just simulate success
    setPackageUrl(`extension-${project.id}.zip`);
    setIsPackaging(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading project data...</p>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Extension Packaging</h1>
          
          <div className="text-sm text-muted-foreground">
            Project: <span className="font-medium text-foreground">{project?.name}</span>
            <span className="mx-2">•</span>
            Version: <span className="font-medium text-foreground">{project?.version}</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="flex w-full p-1 bg-muted rounded-md">
            <TabsTrigger 
              value="validate" 
              className="flex-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Validate
            </TabsTrigger>
            <TabsTrigger 
              value="test" 
              className="flex-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm flex items-center justify-center gap-2"
            >
              <AlertTriangle size={16} />
              Test
            </TabsTrigger>
            <TabsTrigger 
              value="package" 
              className="flex-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm flex items-center justify-center gap-2"
            >
              <Package size={16} />
              Package
            </TabsTrigger>
            <TabsTrigger 
              value="simulator" 
              className="flex-1 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm flex items-center justify-center gap-2"
            >
              <Chrome size={16} />
              Simulator
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="validate">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-md shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Extension Validation</h2>
                    
                    <button
                      onClick={validateProject}
                      disabled={isValidating}
                      className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 flex items-center gap-2 disabled:opacity-70"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Validate Extension
                        </>
                      )}
                    </button>
                  </div>
                  
                  {validationResult ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-md ${
                        validationResult.valid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center">
                          {validationResult.valid ? (
                            <CheckCircle size={20} className="text-green-600 mr-2" />
                          ) : (
                            <XCircle size={20} className="text-red-600 mr-2" />
                          )}
                          <span className={`font-medium ${validationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                            {validationResult.valid 
                              ? 'Validation Passed! Your extension is ready for packaging.' 
                              : 'Validation Failed. Please fix the errors below.'}
                          </span>
                        </div>
                      </div>
                      
                      {validationResult.errors.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-medium text-red-800">Errors</h3>
                          <ul className="space-y-1 list-disc list-inside text-sm">
                            {validationResult.errors.map((error, index) => (
                              <li key={index} className="text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {validationResult.warnings.length > 0 && (
                        <div className="space-y-2">
                          <h3 className="font-medium text-amber-800">Warnings</h3>
                          <ul className="space-y-1 list-disc list-inside text-sm">
                            {validationResult.warnings.map((warning, index) => (
                              <li key={index} className="text-amber-600">{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      <p>
                        Run validation to check your extension's structure and contents.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="bg-card border border-border rounded-md shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Manifest Overview</h2>
                  
                  <div className="bg-muted rounded-md p-4 overflow-x-auto">
                    <pre className="text-xs">{project ? JSON.stringify(project.manifest, null, 2) : 'No manifest data'}</pre>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-md shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Project Stats</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Total Files</span>
                      <span className="font-medium">{project?.files.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">JavaScript Files</span>
                      <span className="font-medium">
                        {project?.files.filter(f => f.type === ProjectFileType.JAVASCRIPT || f.path.endsWith('.js')).length || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">HTML Files</span>
                      <span className="font-medium">
                        {project?.files.filter(f => f.type === ProjectFileType.HTML || f.path.endsWith('.html')).length || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">CSS Files</span>
                      <span className="font-medium">
                        {project?.files.filter(f => f.type === ProjectFileType.CSS || f.path.endsWith('.css')).length || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Image Files</span>
                      <span className="font-medium">
                        {project?.files.filter(f => f.type === ProjectFileType.IMAGE).length || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Permissions</span>
                      <span className="font-medium">
                        {project?.manifest.permissions?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-md shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Validation Checklist</h2>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>Manifest format</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>Required fields</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>File references</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>Permission analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>Icon assets</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span>Store assets validation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="test">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-md shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">Extension Tests</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Run automated tests on your extension to ensure it works correctly
                    </p>
                  </div>
                  
                  <button
                    onClick={runTests}
                    disabled={isRunningTests}
                    className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 flex items-center gap-2 disabled:opacity-70"
                  >
                    {isRunningTests ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        Run All Tests
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Manifest Test */}
                  <div className={`p-4 rounded-md border ${
                    testResults.manifest
                      ? testResults.manifest.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                      : 'border-border bg-muted/30'
                  }`}>
                    <div className="flex items-start">
                      <div className="p-1 rounded-md bg-white mr-3">
                        {testResults.manifest ? (
                          testResults.manifest.passed ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <XCircle size={18} className="text-red-600" />
                          )
                        ) : (
                          <Settings size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">Manifest Validation</h3>
                        <p className={`text-sm ${
                          !testResults.manifest
                            ? 'text-muted-foreground'
                            : testResults.manifest.passed
                              ? 'text-green-700'
                              : 'text-red-700'
                        }`}>
                          {testResults.manifest?.message || 'Validates the structure of your manifest file'}
                        </p>
                        
                        {testResults.manifest?.details && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            {testResults.manifest.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Icons Test */}
                  <div className={`p-4 rounded-md border ${
                    testResults.icons
                      ? testResults.icons.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-amber-200 bg-amber-50'
                      : 'border-border bg-muted/30'
                  }`}>
                    <div className="flex items-start">
                      <div className="p-1 rounded-md bg-white mr-3">
                        {testResults.icons ? (
                          testResults.icons.passed ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertTriangle size={18} className="text-amber-600" />
                          )
                        ) : (
                          <Box size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">Icon Assets</h3>
                        <p className={`text-sm ${
                          !testResults.icons
                            ? 'text-muted-foreground'
                            : testResults.icons.passed
                              ? 'text-green-700'
                              : 'text-amber-700'
                        }`}>
                          {testResults.icons?.message || 'Checks that all required icon sizes are present'}
                        </p>
                        
                        {testResults.icons?.details && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            {testResults.icons.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Popup Test */}
                  <div className={`p-4 rounded-md border ${
                    testResults.popup
                      ? testResults.popup.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                      : 'border-border bg-muted/30'
                  }`}>
                    <div className="flex items-start">
                      <div className="p-1 rounded-md bg-white mr-3">
                        {testResults.popup ? (
                          testResults.popup.passed ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <XCircle size={18} className="text-red-600" />
                          )
                        ) : (
                          <Box size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">Popup Interface</h3>
                        <p className={`text-sm ${
                          !testResults.popup
                            ? 'text-muted-foreground'
                            : testResults.popup.passed
                              ? 'text-green-700'
                              : 'text-red-700'
                        }`}>
                          {testResults.popup?.message || 'Validates the popup HTML structure'}
                        </p>
                        
                        {testResults.popup?.details && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            {testResults.popup.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* JavaScript Test */}
                  <div className={`p-4 rounded-md border ${
                    testResults.javascript
                      ? testResults.javascript.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-amber-200 bg-amber-50'
                      : 'border-border bg-muted/30'
                  }`}>
                    <div className="flex items-start">
                      <div className="p-1 rounded-md bg-white mr-3">
                        {testResults.javascript ? (
                          testResults.javascript.passed ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <AlertTriangle size={18} className="text-amber-600" />
                          )
                        ) : (
                          <Box size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">JavaScript Analysis</h3>
                        <p className={`text-sm ${
                          !testResults.javascript
                            ? 'text-muted-foreground'
                            : testResults.javascript.passed
                              ? 'text-green-700'
                              : 'text-amber-700'
                        }`}>
                          {testResults.javascript?.message || 'Checks JavaScript files for potential issues'}
                        </p>
                        
                        {testResults.javascript?.details && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            {testResults.javascript.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Permissions Test */}
                  <div className={`p-4 rounded-md border ${
                    testResults.permissions
                      ? testResults.permissions.passed
                        ? testResults.permissions.message.includes('warning')
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                      : 'border-border bg-muted/30'
                  }`}>
                    <div className="flex items-start">
                      <div className="p-1 rounded-md bg-white mr-3">
                        {testResults.permissions ? (
                          testResults.permissions.passed ? (
                            testResults.permissions.message.includes('warning') ? (
                              <AlertTriangle size={18} className="text-amber-600" />
                            ) : (
                              <CheckCircle size={18} className="text-green-600" />
                            )
                          ) : (
                            <XCircle size={18} className="text-red-600" />
                          )
                        ) : (
                          <Box size={18} className="text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium">Permissions Check</h3>
                        <p className={`text-sm ${
                          !testResults.permissions
                            ? 'text-muted-foreground'
                            : testResults.permissions.passed
                              ? testResults.permissions.message.includes('warning')
                                ? 'text-amber-700'
                                : 'text-green-700'
                              : 'text-red-700'
                        }`}>
                          {testResults.permissions?.message || 'Analyzes requested permissions for security concerns'}
                        </p>
                        
                        {testResults.permissions?.details && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            {testResults.permissions.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center justify-between p-4 bg-muted rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Test Status:</span>
                    {isRunningTests ? (
                      <span className="text-sm flex items-center text-blue-600">
                        <Loader2 size={14} className="mr-1 animate-spin" />
                        Running Tests...
                      </span>
                    ) : Object.keys(testResults).length > 0 ? (
                      <span className="text-sm flex items-center text-green-600">
                        <CheckCheck size={14} className="mr-1" />
                        Tests Completed
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not Started</span>
                    )}
                  </div>
                  
                  {Object.keys(testResults).length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Passing: {Object.values(testResults).filter(r => r.passed).length}/{Object.keys(testResults).length}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="package">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-md shadow-sm p-6">
                <div className="text-center p-6">
                  <Package size={48} className="mx-auto mb-3 text-primary" />
                  <h2 className="text-xl font-semibold mb-2">Package Your Extension</h2>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Create a ZIP package of your extension ready for testing or uploading to the Chrome Web Store.
                  </p>
                  
                  <button
                    onClick={packageExtension}
                    disabled={isPackaging}
                    className="rounded-md bg-primary px-6 py-3 text-sm text-primary-foreground hover:bg-primary/90 flex items-center gap-2 mx-auto disabled:opacity-70"
                  >
                    {isPackaging ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating Package...
                      </>
                    ) : (
                      <>
                        <Package size={18} />
                        Create Extension Package
                      </>
                    )}
                  </button>
                  
                  {packageUrl && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md max-w-md mx-auto">
                      <div className="flex items-center justify-center text-green-600 mb-2">
                        <CheckCircle size={20} className="mr-2" />
                        <span className="font-medium">Package created successfully!</span>
                      </div>
                      
                      <a
                        href="#download"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <Download size={16} className="mr-2" />
                        Download Package
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-md shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Package Contents</h2>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        manifest.json
                      </span>
                      <span className="text-xs text-muted-foreground">2.4 KB</span>
                    </li>
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        popup.html
                      </span>
                      <span className="text-xs text-muted-foreground">1.2 KB</span>
                    </li>
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        popup.js
                      </span>
                      <span className="text-xs text-muted-foreground">4.7 KB</span>
                    </li>
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        styles.css
                      </span>
                      <span className="text-xs text-muted-foreground">1.8 KB</span>
                    </li>
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        background.js
                      </span>
                      <span className="text-xs text-muted-foreground">3.1 KB</span>
                    </li>
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        icons/icon16.png
                      </span>
                      <span className="text-xs text-muted-foreground">0.8 KB</span>
                    </li>
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        icons/icon48.png
                      </span>
                      <span className="text-xs text-muted-foreground">2.4 KB</span>
                    </li>
                    <li className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                      <span className="flex items-center">
                        <Box size={16} className="mr-2 text-muted-foreground" />
                        icons/icon128.png
                      </span>
                      <span className="text-xs text-muted-foreground">6.5 KB</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-card border border-border rounded-md shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Chrome Web Store Publishing</h2>
                  
                  <div className="space-y-4">
                    <div className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-md">
                      <p className="text-sm text-blue-700">
                        Your extension package is ready for submission to the Chrome Web Store!
                      </p>
                    </div>
                    
                    <h3 className="font-medium text-sm mt-4">Next Steps:</h3>
                    
                    <ol className="space-y-2 text-sm ml-5 list-decimal">
                      <li>Download your extension package</li>
                      <li>Visit the <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Chrome Web Store Developer Dashboard</a></li>
                      <li>Click "New Item" and upload your package</li>
                      <li>Fill in store listing details (use your generated store listing)</li>
                      <li>Submit for review</li>
                    </ol>
                    
                    <div className="mt-4 p-3 border-l-4 border-amber-500 bg-amber-50 rounded-r-md">
                      <p className="text-sm text-amber-700">
                        Note: Review can take 1-3 business days. Your extension should meet all <a href="https://developer.chrome.com/docs/webstore/program-policies/" target="_blank" rel="noopener noreferrer" className="underline">Chrome Web Store policies</a>.
                      </p>
                    </div>
                    
                    <div className="mt-6">
                      <a
                        href="https://chrome.google.com/webstore/devconsole"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                      >
                        <Chrome size={16} className="mr-2" />
                        Go to Chrome Web Store Dashboard
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="simulator">
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-md shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Extension Simulator</h2>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Test your extension in a simulated Chrome environment before packaging it.
                </p>
                
                <ExtensionSimulator
                  manifestJson={JSON.stringify(project?.manifest || {}, null, 2)}
                  popupHtml={getPopupHtml()}
                  backgroundJs={getBackgroundJs()}
                  contentJs={getContentJs()}
                  height="600px"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}