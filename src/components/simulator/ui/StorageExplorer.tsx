import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Database, Plus, Trash2, Save, Edit2, X, Check, ChevronRight, ChevronDown } from 'lucide-react';

interface StorageExplorerProps {
  storageData: {
    local: Record<string, any>;
    sync: Record<string, any>;
    session: Record<string, any>;
  };
  onUpdateStorage: (area: 'local' | 'sync' | 'session', key: string, value: any) => void;
  onDeleteStorage: (area: 'local' | 'sync' | 'session', key: string) => void;
  onClearStorage: (area: 'local' | 'sync' | 'session') => void;
}

export default function StorageExplorer({
  storageData,
  onUpdateStorage,
  onDeleteStorage,
  onClearStorage
}: StorageExplorerProps) {
  const [activeArea, setActiveArea] = useState<'local' | 'sync' | 'session'>('local');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Select all content when editing starts
  useEffect(() => {
    if (editingKey) {
      const input = document.getElementById('edit-value');
      if (input) {
        input.focus();
        input.select();
      }
    }
  }, [editingKey]);

  // Toggle an object's expanded state
  const toggleExpand = (key: string) => {
    if (expandedKeys.includes(key)) {
      setExpandedKeys(expandedKeys.filter(k => k !== key));
    } else {
      setExpandedKeys([...expandedKeys, key]);
    }
  };

  // Start editing a value
  const startEditing = (key: string, value: any) => {
    setEditingKey(key);
    setEditValue(JSON.stringify(value, null, 2));
  };

  // Save edited value
  const saveEdit = () => {
    if (editingKey) {
      try {
        const parsedValue = JSON.parse(editValue);
        onUpdateStorage(activeArea, editingKey, parsedValue);
        setEditingKey(null);
      } catch (error) {
        alert('Invalid JSON format');
      }
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingKey(null);
  };

  // Add new key-value pair
  const addNewItem = () => {
    if (!newKey.trim()) {
      alert('Key cannot be empty');
      return;
    }

    try {
      const parsedValue = JSON.parse(newValue || 'null');
      onUpdateStorage(activeArea, newKey, parsedValue);
      setNewKey('');
      setNewValue('');
      setShowAddForm(false);
    } catch (error) {
      alert('Invalid JSON format');
    }
  };

  // Render a value (recursively for objects)
  const renderValue = (key: string, value: any, path: string = '') => {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }
    
    if (typeof value === 'undefined') {
      return <span className="text-gray-500">undefined</span>;
    }
    
    if (typeof value === 'string') {
      return <span className="text-green-600">"{value}"</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="text-blue-600">{value}</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-purple-600">{value.toString()}</span>;
    }
    
    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.includes(fullPath);
      
      return (
        <div>
          <div 
            className="cursor-pointer inline-flex items-center"
            onClick={() => toggleExpand(fullPath)}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="text-gray-800">Array [{value.length}]</span>
          </div>
          
          {isExpanded && (
            <div className="pl-4 border-l border-gray-200 ml-1">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500 mr-2">{index}:</span>
                  {renderValue(index.toString(), item, fullPath)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      const isExpanded = expandedKeys.includes(fullPath);
      
      return (
        <div>
          <div 
            className="cursor-pointer inline-flex items-center"
            onClick={() => toggleExpand(fullPath)}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="text-gray-800">Object {`{${Object.keys(value).length}}`}</span>
          </div>
          
          {isExpanded && (
            <div className="pl-4 border-l border-gray-200 ml-1">
              {Object.entries(value).map(([k, v]) => (
                <div key={k} className="py-1">
                  <span className="text-gray-500 mr-2">{k}:</span>
                  {renderValue(k, v, fullPath)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  // Render the storage items for current area
  const renderStorageItems = () => {
    const items = storageData[activeArea];
    
    if (Object.keys(items).length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No items in {activeArea} storage
        </div>
      );
    }
    
    return (
      <div className="divide-y divide-gray-100">
        {Object.entries(items).map(([key, value]) => (
          <div key={key} className="py-2 px-3 hover:bg-gray-50">
            {editingKey === key ? (
              <div className="space-y-2">
                <div className="font-medium">{key}</div>
                <textarea
                  id="edit-value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full h-32 font-mono text-xs p-2 border border-gray-300 rounded"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <X size={12} className="mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex items-center px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    <Check size={12} className="mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between group">
                <div className="flex-1">
                  <div className="font-medium mb-1">{key}</div>
                  <div className="text-sm font-mono overflow-hidden text-ellipsis">
                    {renderValue(key, value)}
                  </div>
                </div>
                <div className="flex items-start ml-4 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => startEditing(key, value)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteStorage(activeArea, key)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center">
          <Database size={18} className="text-blue-600 mr-2" />
          <h3 className="font-medium">Storage Explorer</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onClearStorage(activeArea)}
            className="flex items-center px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            title="Clear storage"
          >
            <Trash2 size={12} className="mr-1" />
            Clear
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
            title="Add item"
          >
            <Plus size={12} className="mr-1" />
            Add
          </button>
        </div>
      </div>
      
      <Tabs value={activeArea} onValueChange={(value) => setActiveArea(value as any)}>
        <div className="border-b border-gray-200">
          <TabsList className="flex">
            <TabsTrigger 
              value="local" 
              className="flex-1 px-4 py-2 text-sm font-medium text-center data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              Local Storage
            </TabsTrigger>
            <TabsTrigger 
              value="sync" 
              className="flex-1 px-4 py-2 text-sm font-medium text-center data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              Sync Storage
            </TabsTrigger>
            <TabsTrigger 
              value="session" 
              className="flex-1 px-4 py-2 text-sm font-medium text-center data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
            >
              Session Storage
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {showAddForm && (
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="mb-2 font-medium">Add New Item</div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Key</label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded"
                    placeholder="Enter key"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Value (JSON format)</label>
                  <textarea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full h-20 text-sm font-mono p-2 border border-gray-300 rounded"
                    placeholder='"string" or 123 or true or {} or []'
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex items-center px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    <X size={12} className="mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={addNewItem}
                    className="flex items-center px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    <Save size={12} className="mr-1" />
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <TabsContent value="local">
            {renderStorageItems()}
          </TabsContent>
          <TabsContent value="sync">
            {renderStorageItems()}
          </TabsContent>
          <TabsContent value="session">
            {renderStorageItems()}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}