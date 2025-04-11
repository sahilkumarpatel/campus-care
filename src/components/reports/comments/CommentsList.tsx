
import React from 'react';
import { MessageCircle } from 'lucide-react';
import CommentItem from './CommentItem';

interface CommentsListProps {
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    user_name: string;
    is_admin: boolean;
  }>;
  isLoading?: boolean;
}

const CommentsList: React.FC<CommentsListProps> = ({ comments, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-campus-primary"></div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <MessageCircle className="mr-2 h-5 w-5" />
        <span>No comments yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentsList;
