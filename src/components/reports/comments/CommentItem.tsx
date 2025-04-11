
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user_name: string;
    is_admin: boolean;
  };
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <div className={`p-4 mb-3 rounded-lg ${comment.is_admin ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
      <div className="flex justify-between mb-1">
        <p className="font-medium text-sm">
          {comment.user_name} 
          {comment.is_admin && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Admin</span>}
        </p>
        <p className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
        </p>
      </div>
      <p className="text-gray-700">{comment.content}</p>
    </div>
  );
};

export default CommentItem;
