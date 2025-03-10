import React, { useState } from 'react';
import { MoreHorizontal, Plus, X, Refresh, ChevronLeft, ChevronRight, Shield, Search } from 'lucide-react';
import { Tab } from '../mocks/types';

interface BrowserFrameProps {
  children: React.ReactNode;
  tabs: Tab[];
  activeTabId: number;
  onTabClick: (tabId: number) => void;
  onTabClose: (tabId: number) => void;
  onNewTab: () => void;
  onRefresh: () => void;
  currentUrl: string;
  onNavigate: (url: string) => void;
}

export default function BrowserFrame({
  children,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onNewTab,
  onRefresh,
  currentUrl,
  onNavigate
}: BrowserFrameProps) {
  const [urlInput, setUrlInput] = useState(currentUrl);
  
  // Handle URL form submission
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onNavigate(urlInput);
    }
  };
  
  // Update input when active tab changes
  React.useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentUrl]);
  
  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-md overflow-hidden shadow-sm bg-white">
      {/* Browser Chrome UI */}
      <div className="bg-gray-200 px-2 pt-2">
        {/* Tabs */}
        <div className="flex items-center">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`relative group flex items-center px-3 py-2 rounded-t-md mr-1 text-sm max-w-[180px] ${
                tab.id === activeTabId
                  ? 'bg-white text-gray-800'
                  : 'bg-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => onTabClick(tab.id)}
            >
              {/* Favicon */}
              {tab.favIconUrl ? (
                <img src={tab.favIconUrl} alt="" className="w-4 h-4 mr-2" />
              ) : (
                <div className="w-4 h-4 mr-2 bg-gray-400 rounded-full"></div>
              )}
              
              {/* Tab Title */}
              <span className="truncate">{tab.title || 'New Tab'}</span>
              
              {/* Close Button */}
              <button
                className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          {/* New Tab Button */}
          <button
            className="p-1 rounded-full hover:bg-gray-300"
            onClick={onNewTab}
          >
            <Plus size={16} />
          </button>
        </div>
        
        {/* Address Bar */}
        <div className="flex items-center p-2 bg-white rounded-t-md border-b border-gray-200">
          <div className="flex items-center space-x-2 mr-4">
            <button className="p-1 rounded-full hover:bg-gray-200">
              <ChevronLeft size={16} />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-200">
              <ChevronRight size={16} />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-200" onClick={onRefresh}>
              <Refresh size={16} />
            </button>
          </div>
          
          <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
            <div className="flex items-center w-full px-3 py-1 bg-gray-100 rounded-md">
              <Shield size={14} className="text-gray-500 mr-2" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <Search size={14} className="text-gray-500 ml-2" />
            </div>
          </form>
          
          <div className="ml-4">
            <button className="p-1 rounded-full hover:bg-gray-200">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Browser Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}