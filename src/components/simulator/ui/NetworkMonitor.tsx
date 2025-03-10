import React, { useState, useEffect } from 'react';
import { Activity, Layers, Clock, Search, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

export interface NetworkRequest {
  id: string;
  type: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  timestamp: Date;
  duration?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

interface NetworkMonitorProps {
  requests: NetworkRequest[];
  onClearRequests: () => void;
}

export default function NetworkMonitor({ requests, onClearRequests }: NetworkMonitorProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailTab, setSelectedDetailTab] = useState<'headers' | 'response' | 'request'>('headers');
  
  // Auto-select the most recent request when new ones come in
  useEffect(() => {
    if (requests.length > 0 && !selectedRequestId) {
      setSelectedRequestId(requests[0].id);
    }
  }, [requests, selectedRequestId]);
  
  // Filter requests by search query
  const filteredRequests = requests.filter(request => {
    if (!searchQuery) return true;
    
    const search = searchQuery.toLowerCase();
    return (
      request.url.toLowerCase().includes(search) ||
      request.type.toLowerCase().includes(search) ||
      request.method.toLowerCase().includes(search) ||
      (request.status?.toString() || '').includes(search)
    );
  });
  
  // Get the selected request
  const selectedRequest = selectedRequestId 
    ? requests.find(r => r.id === selectedRequestId) 
    : null;
  
  // Format a date for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };
  
  // Get CSS class for status code
  const getStatusClass = (status?: number) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400) return 'text-red-600';
    return 'text-gray-500';
  };
  
  // Render JSON in a readable format
  const renderJson = (data: any) => {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      return (
        <pre className="text-xs font-mono whitespace-pre-wrap p-2">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (e) {
      // If it's not valid JSON, just display as string
      return (
        <pre className="text-xs font-mono whitespace-pre-wrap p-2">
          {typeof data === 'string' ? data : JSON.stringify(data)}
        </pre>
      );
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center">
          <Activity size={18} className="text-blue-600 mr-2" />
          <h3 className="font-medium">Network Activity</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter requests..."
              className="pl-8 pr-2 py-1 text-sm border border-gray-300 rounded"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
          </div>
          <button
            onClick={onClearRequests}
            className="flex items-center px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            title="Clear all"
          >
            <Trash2 size={12} className="mr-1" />
            Clear
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 h-96">
        {/* Request List */}
        <div className="md:col-span-1 border-r border-gray-200 overflow-y-auto">
          {filteredRequests.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No network requests captured
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRequests.map(request => (
                <div
                  key={request.id}
                  className={`py-2 px-3 hover:bg-gray-50 cursor-pointer ${
                    selectedRequestId === request.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                  }`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm truncate" title={request.url}>
                      {request.type}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(request.timestamp)}
                    </div>
                  </div>
                  
                  <div className="text-xs truncate text-gray-600 mt-1">
                    <span className="text-gray-500">{request.method}</span>
                    <span> • </span>
                    <span className={getStatusClass(request.status)}>
                      {request.status || 'Pending'}
                    </span>
                    {request.duration !== undefined && (
                      <>
                        <span> • </span>
                        <span className="text-gray-500">{request.duration}ms</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Request Details */}
        <div className="md:col-span-2 flex flex-col">
          {selectedRequest ? (
            <>
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="text-sm font-medium truncate">
                  {selectedRequest.type} - {selectedRequest.method}
                </div>
                <div className="text-xs text-gray-500 truncate mt-1">
                  {selectedRequest.url}
                </div>
              </div>
              
              <div className="border-b border-gray-200 flex">
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium text-center ${
                    selectedDetailTab === 'headers' 
                      ? 'border-b-2 border-blue-600 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDetailTab('headers')}
                >
                  Headers
                </button>
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium text-center ${
                    selectedDetailTab === 'request' 
                      ? 'border-b-2 border-blue-600 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDetailTab('request')}
                >
                  Request
                </button>
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium text-center ${
                    selectedDetailTab === 'response' 
                      ? 'border-b-2 border-blue-600 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDetailTab('response')}
                >
                  Response
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {selectedDetailTab === 'headers' && (
                  <div className="space-y-4">
                    {/* General Info */}
                    <div>
                      <div className="font-medium text-sm mb-1">General</div>
                      <div className="bg-gray-50 rounded p-2 space-y-1">
                        <div className="flex text-xs">
                          <div className="w-32 text-gray-500">Request URL:</div>
                          <div className="flex-1 font-mono">{selectedRequest.url}</div>
                        </div>
                        <div className="flex text-xs">
                          <div className="w-32 text-gray-500">Request Method:</div>
                          <div className="flex-1 font-mono">{selectedRequest.method}</div>
                        </div>
                        <div className="flex text-xs">
                          <div className="w-32 text-gray-500">Status Code:</div>
                          <div className={`flex-1 font-mono ${getStatusClass(selectedRequest.status)}`}>
                            {selectedRequest.status} {selectedRequest.statusText}
                          </div>
                        </div>
                        <div className="flex text-xs">
                          <div className="w-32 text-gray-500">Timestamp:</div>
                          <div className="flex-1 font-mono">
                            {selectedRequest.timestamp.toLocaleString()}
                          </div>
                        </div>
                        {selectedRequest.duration !== undefined && (
                          <div className="flex text-xs">
                            <div className="w-32 text-gray-500">Duration:</div>
                            <div className="flex-1 font-mono">{selectedRequest.duration}ms</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Request Headers */}
                    {selectedRequest.requestHeaders && Object.keys(selectedRequest.requestHeaders).length > 0 && (
                      <div>
                        <div className="font-medium text-sm mb-1">Request Headers</div>
                        <div className="bg-gray-50 rounded p-2 space-y-1">
                          {Object.entries(selectedRequest.requestHeaders).map(([key, value]) => (
                            <div key={key} className="flex text-xs">
                              <div className="w-32 text-gray-500">{key}:</div>
                              <div className="flex-1 font-mono">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Response Headers */}
                    {selectedRequest.responseHeaders && Object.keys(selectedRequest.responseHeaders).length > 0 && (
                      <div>
                        <div className="font-medium text-sm mb-1">Response Headers</div>
                        <div className="bg-gray-50 rounded p-2 space-y-1">
                          {Object.entries(selectedRequest.responseHeaders).map(([key, value]) => (
                            <div key={key} className="flex text-xs">
                              <div className="w-32 text-gray-500">{key}:</div>
                              <div className="flex-1 font-mono">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedDetailTab === 'request' && (
                  <div>
                    {selectedRequest.requestBody ? (
                      <>
                        <div className="font-medium text-sm mb-1">Request Payload</div>
                        <div className="bg-gray-50 rounded overflow-auto max-h-full">
                          {renderJson(selectedRequest.requestBody)}
                        </div>
                      </>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No request body data
                      </div>
                    )}
                  </div>
                )}
                
                {selectedDetailTab === 'response' && (
                  <div>
                    {selectedRequest.responseBody ? (
                      <>
                        <div className="font-medium text-sm mb-1">Response Body</div>
                        <div className="bg-gray-50 rounded overflow-auto max-h-full">
                          {renderJson(selectedRequest.responseBody)}
                        </div>
                      </>
                    ) : selectedRequest.error ? (
                      <div className="p-4 text-center text-red-500">
                        Error: {selectedRequest.error}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No response data available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                <p>{filteredRequests.length > 0 ? 'Select a request to view details' : 'No requests to display'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}