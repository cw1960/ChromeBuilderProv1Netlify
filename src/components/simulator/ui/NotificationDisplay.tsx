import React from 'react';
import { Bell, X } from 'lucide-react';
import { NotificationOptions } from '../mocks/types';

interface NotificationDisplayProps {
  notifications: Record<string, NotificationOptions>;
  onNotificationClick: (id: string) => void;
  onButtonClick: (id: string, buttonIndex: number) => void;
  onClose: (id: string) => void;
}

export default function NotificationDisplay({
  notifications,
  onNotificationClick,
  onButtonClick,
  onClose
}: NotificationDisplayProps) {
  // If no notifications, show nothing
  if (Object.keys(notifications).length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {Object.entries(notifications).map(([id, notification]) => (
        <div
          key={id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-fade-in"
          style={{ animationDuration: '0.2s' }}
        >
          <div className="flex p-3 bg-gray-100 border-b border-gray-200">
            <div className="flex-shrink-0 mr-2">
              {notification.iconUrl ? (
                <img 
                  src={notification.iconUrl} 
                  alt="" 
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWJlbGwiPjxwYXRoIGQ9Ik02IDE4LjVhMi41IDIuNSAwIDAgMCA1IDB2LTFINm0xNSAxYS45MTQuOTE0IDAgMSAxLTEuOCAwYS45MTQuOTE0IDAgMCAxIDEuOCAwIi8+PHBhdGggZD0iTTYg4CAvPg==';
                  }}
                />
              ) : (
                <Bell size={18} className="text-blue-600" />
              )}
            </div>
            <div className="flex-1 text-sm font-semibold">{notification.title}</div>
            <button
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => onClose(id)}
            >
              <X size={14} />
            </button>
          </div>
          
          <div
            className="p-3 cursor-pointer"
            onClick={() => onNotificationClick(id)}
          >
            <p className="text-sm mb-1">{notification.message}</p>
            
            {notification.contextMessage && (
              <p className="text-xs text-gray-500 mb-2">{notification.contextMessage}</p>
            )}
            
            {notification.imageUrl && (
              <img
                src={notification.imageUrl}
                alt=""
                className="w-full h-auto rounded mb-2"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
            
            {/* Items for list type notifications */}
            {notification.type === 'list' && notification.items && (
              <div className="mt-2 space-y-1 text-sm border-t border-gray-200 pt-2">
                {notification.items.map((item, index) => (
                  <div key={index} className="flex">
                    <div className="font-medium mr-2">{item.title}:</div>
                    <div>{item.message}</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Progress bar for progress type notifications */}
            {notification.type === 'progress' && notification.progress !== undefined && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, notification.progress))}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Buttons */}
          {notification.buttons && notification.buttons.length > 0 && (
            <div className="flex border-t border-gray-200">
              {notification.buttons.map((button, index) => (
                <button
                  key={index}
                  className="flex-1 py-2 px-4 text-sm text-center text-blue-600 hover:bg-blue-50 border-r last:border-r-0 border-gray-200"
                  onClick={() => onButtonClick(id, index)}
                >
                  {button.title}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}