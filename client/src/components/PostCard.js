import React, { useState } from 'react';
import axios from 'axios';
import { MessageCircle, Calendar, MapPin, Clock, User, Package, Building } from 'lucide-react';
import Reactions from './Reactions';

const PostCard = ({ post, onUpdate, onDelete }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [userReaction, setUserReaction] = useState(null);

  const getTypeColor = (type) => {
    switch (type) {
      case 'EVENT': return 'bg-green-100 text-green-800 border-green-200';
      case 'LOST_AND_FOUND': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ANNOUNCEMENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EVENT': return '🎉';
      case 'LOST_AND_FOUND': return '🔍';
      case 'ANNOUNCEMENT': return '📢';
      default: return '📝';
    }
  };

  const handleReaction = async (reaction) => {
    try {
      const userId = 'user-' + Math.random().toString(36).substr(2, 9);
      const response = await axios.post(`/api/posts/${post.id}/react`, {
        reaction,
        userId
      });
      
      if (response.data.success) {
        setUserReaction(userReaction === reaction ? null : reaction);
        onUpdate({
          ...post,
          reactions: response.data.reactions
        });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setLoadingComments(true);
    try {
      const response = await axios.get(`/api/posts/${post.id}/comments`);
      if (response.data.success) {
        setComments(response.data.comments);
        setShowComments(true);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`/api/posts/${post.id}/comments`, {
        text: newComment,
        author: 'Anonymous Student'
      });

      if (response.data.success) {
        setComments([...comments, response.data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCommentReaction = async (commentId, reaction) => {
    try {
      const userId = 'user-' + Math.random().toString(36).substr(2, 9);
      const response = await axios.post(`/api/comments/${commentId}/react`, {
        reaction,
        userId,
        postId: post.id
      });

      if (response.data.success) {
        // Update the comment reactions in the local state
        setComments(comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, reactions: response.data.reactions };
          }
          // Check replies too
          const updatedReplies = comment.replies.map(reply => 
            reply.id === commentId 
              ? { ...reply, reactions: response.data.reactions }
              : reply
          );
          return { ...comment, replies: updatedReplies };
        }));
      }
    } catch (error) {
      console.error('Error adding comment reaction:', error);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getTypeIcon(post.type)}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(post.type)}`}>
              {post.type ? post.type.replace('_', ' & ') : 'Unknown'}
            </span>
          </div>
          <span className="text-sm text-gray-500">{formatTime(post.timestamp)}</span>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {post.data.title || 'Post'}
        </h3>
        <p className="text-gray-700 mb-4">{post.data.description}</p>

        {post.type === 'MEME' && post.data.imageUrl && (
          <img
            src={post.data.imageUrl}
            alt="Meme"
            className="w-full rounded-lg border mb-4"
          />
        )}

        {/* Type-specific content */}
        {post.type === 'EVENT' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-green-50 rounded-lg">
            {post.data.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{post.data.location}</span>
              </div>
            )}
            {post.data.date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{post.data.date}</span>
              </div>
            )}
            {post.data.time && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{post.data.time}</span>
              </div>
            )}
          </div>
        )}

        {post.type === 'LOST_AND_FOUND' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-orange-50 rounded-lg">
            {post.data.item && (
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">{post.data.item}</span>
              </div>
            )}
            {post.data.lastLocation && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">{post.data.lastLocation}</span>
              </div>
            )}
            {post.data.contactInfo && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-orange-800">{post.data.contactInfo}</span>
              </div>
            )}
          </div>
        )}

        {post.type === 'ANNOUNCEMENT' && post.data.department && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{post.data.department}</span>
            </div>
          </div>
        )}
      </div>

      {/* Reactions */}
      <div className="px-6 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Reactions
            reactions={post.reactions}
            userReaction={userReaction}
            onReact={handleReaction}
            size="small"
          />
          <button
            onClick={loadComments}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Comments</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="mb-4 last:mb-0">
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                      <span className="text-xs text-gray-500">{formatTime(comment.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                    {comment.type === 'MEME' && comment.imageUrl && (
                      <img
                        src={comment.imageUrl}
                        alt="Meme"
                        className="w-full rounded-lg border mb-2"
                      />
                    )}
                    <Reactions
                      reactions={comment.reactions}
                      userReaction={null}
                      onReact={(reaction) => handleCommentReaction(comment.id, reaction)}
                      size="small"
                    />
                  </div>
                  {comment.replies && comment.replies.map((reply) => (
                    <div key={reply.id} className="ml-6 mt-2">
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-900">{reply.author}</span>
                          <span className="text-xs text-gray-500">{formatTime(reply.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{reply.text}</p>
                        {reply.type === 'MEME' && reply.imageUrl && (
                          <img
                            src={reply.imageUrl}
                            alt="Meme"
                            className="w-full rounded-lg border mb-2"
                          />
                        )}
                        <Reactions
                          reactions={reply.reactions}
                          userReaction={null}
                          onReact={(reaction) => handleCommentReaction(reply.id, reaction)}
                          size="small"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              
              <div className="mt-4 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <button
                  onClick={addComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
