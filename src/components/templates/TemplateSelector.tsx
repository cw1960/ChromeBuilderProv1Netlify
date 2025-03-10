import React, { useState, useEffect } from 'react';
import { ExtensionTemplate, TemplateCategory, TemplateDifficulty, getAllTemplates, getTemplatesByCategory, getTemplatesByDifficulty, searchTemplates } from '@/lib/template-manager';
import { Filter, Search, Code, Zap, BarChart2, Coffee, BookOpen, CheckCircle } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
}

export default function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ExtensionTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ExtensionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<TemplateDifficulty | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    const allTemplates = getAllTemplates();
    setTemplates(allTemplates);
    setFilteredTemplates(allTemplates);
  }, []);

  // Apply filters when they change
  useEffect(() => {
    let filtered = templates;
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = getTemplatesByCategory(selectedCategory);
    }
    
    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      const byDifficulty = getTemplatesByDifficulty(selectedDifficulty);
      filtered = filtered.filter(template => byDifficulty.some(t => t.id === template.id));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchResults = searchTemplates(searchQuery);
      filtered = filtered.filter(template => searchResults.some(t => t.id === template.id));
    }
    
    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, selectedDifficulty, searchQuery]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    onSelectTemplate(templateId);
  };

  // Get difficulty icon
  const getDifficultyIcon = (difficulty: TemplateDifficulty) => {
    switch (difficulty) {
      case TemplateDifficulty.Beginner:
        return <Coffee size={16} className="mr-1 text-green-500" />;
      case TemplateDifficulty.Intermediate:
        return <Code size={16} className="mr-1 text-blue-500" />;
      case TemplateDifficulty.Advanced:
        return <Zap size={16} className="mr-1 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="template-selector">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Select a template to start with or create a project from scratch.
        </p>
      </div>
      
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background"
          />
        </div>
        
        <div className="relative min-w-[140px]">
          <Filter size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background appearance-none"
          >
            <option value="all">All Categories</option>
            {Object.values(TemplateCategory).map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="relative min-w-[140px]">
          <BarChart2 size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as TemplateDifficulty | 'all')}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background appearance-none"
          >
            <option value="all">All Levels</option>
            {Object.values(TemplateDifficulty).map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p>No templates match your filters. Try different criteria or create a blank project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`border rounded-lg p-4 transition-colors cursor-pointer relative ${
                selectedTemplate === template.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircle size={20} className="text-primary" />
                </div>
              )}
              
              <h3 className="text-lg font-medium mb-2">{template.name}</h3>
              
              <div className="flex items-center mb-3 text-sm">
                {getDifficultyIcon(template.difficulty)}
                <span className="mr-3">
                  {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                </span>
                
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                  {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {template.description}
              </p>
              
              <div className="mt-auto text-xs flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-muted/80">
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-0.5 rounded-full bg-muted/80">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-border">
        <div
          className={`border rounded-lg p-4 transition-colors cursor-pointer ${
            selectedTemplate === 'blank'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }`}
          onClick={() => handleTemplateSelect('blank')}
        >
          <div className="flex items-center">
            {selectedTemplate === 'blank' && (
              <CheckCircle size={20} className="text-primary mr-2" />
            )}
            <h3 className="text-lg font-medium">Start from Scratch</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Create a blank project with a minimal manifest.json file and basic structure.
          </p>
        </div>
      </div>
    </div>
  );
}