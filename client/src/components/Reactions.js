import React from 'react';

/*
Props:
- reactions: { thumbsUp, heart, laugh, surprise, tear, anger }
- userReaction: string | null (one of the keys above)
- onReact: (reactionKey) => void
- size: 'small' | 'medium' | 'large'
*/
const Reactions = ({ reactions = {}, userReaction = null, onReact, size = 'small' }) => {
  // Map of reaction config: key used by backend and displayed emoji + label
  const reactionDefs = [
    { key: 'thumbsUp', emoji: '👍', label: 'Like' },
    { key: 'heart',    emoji: '❤️', label: 'Love' },
    { key: 'laugh',    emoji: '😂', label: 'Laugh' },
    { key: 'surprise', emoji: '😮', label: 'Surprised' },
    // Backend uses `tear` for sad; display as 😢
    { key: 'tear',     emoji: '😢', label: 'Sad' },
    { key: 'anger',    emoji: '😡', label: 'Angry' },
  ];

  const sizeClasses = {
    small: {
      btn: 'px-2 py-1 text-sm',
      emoji: 'text-base',
      count: 'text-xs',
      gap: 'space-x-2'
    },
    medium: {
      btn: 'px-3 py-1.5 text-sm',
      emoji: 'text-lg',
      count: 'text-xs',
      gap: 'space-x-3'
    },
    large: {
      btn: 'px-3 py-2',
      emoji: 'text-xl',
      count: 'text-sm',
      gap: 'space-x-4'
    }
  }[size] || {
    btn: 'px-2 py-1 text-sm',
    emoji: 'text-base',
    count: 'text-xs',
    gap: 'space-x-2'
  };

  return (
    <div className={`flex items-center ${sizeClasses.gap}`}>
      {reactionDefs.map(({ key, emoji, label }) => {
        const active = userReaction === key;
        const count = reactions?.[key] ?? 0;
        return (
          <button
            key={key}
            type="button"
            title={label}
            onClick={() => onReact && onReact(key)}
            className={`inline-flex items-center ${sizeClasses.btn} rounded-md border transition-colors select-none
              ${active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <span className={`${sizeClasses.emoji} mr-1`}>{emoji}</span>
            {count > 0 && (
              <span className={`${sizeClasses.count} font-medium`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Reactions;
