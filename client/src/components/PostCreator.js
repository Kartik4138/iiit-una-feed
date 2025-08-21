import React, { useState } from 'react';
import axios from 'axios';
import { Send, AlertTriangle, CheckCircle, Loader, Sparkles } from 'lucide-react';

const PostCreator = ({ onPostCreated }) => {
  const [text, setText] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [classification, setClassification] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleClassify = async () => {
    if (!text.trim()) return;

    // Check if it's a meme command
    if (text.startsWith('/meme ')) {
      const memePrompt = text.substring(6); // Remove '/meme ' prefix
      await handleMemeGeneration(memePrompt);
      return;
    }

    setIsClassifying(true);
    setError(null);

    try {
      const response = await axios.post('/api/classify', { text });
      
      if (response.data.success) {
        setClassification(response.data.classification);
        setShowPreview(true);
      } else if (response.data.isToxic) {
        setError({
          type: 'toxicity',
          message: response.data.reason,
          suggestion: response.data.suggestedRewrite
        });
      }
    } catch (error) {
      setError({
        type: 'error',
        message: 'Failed to classify post. Please try again.'
      });
    } finally {
      setIsClassifying(false);
    }
  };

  const handleMemeGeneration = async (prompt) => {
    setIsClassifying(true);
    setError(null);

    try {
      const response = await axios.post('/api/generate-meme', { prompt });
      
      if (response.data.success) {
        setClassification({
          type: 'MEME',
          title: 'Generated Meme',
          description: prompt,
          imageUrl: response.data.imageUrl
        });
        setShowPreview(true);
      } else {
        setError({
          type: 'error',
          message: 'Failed to generate meme. Please try again.'
        });
      }
    } catch (error) {
      setError({
        type: 'error',
        message: 'Failed to generate meme. Please try again.'
      });
    } finally {
      setIsClassifying(false);
    }
  };

  const handlePost = async () => {
    if (!classification) return;

    try {
      const response = await axios.post('/api/posts', {
        type: classification.type,
        data: classification,
        originalText: text
      });

      if (response.data.success) {
        onPostCreated(response.data.post);
        setText('');
        setClassification(null);
        setShowPreview(false);
        setError(null);
      }
    } catch (error) {
      setError({
        type: 'error',
        message: 'Failed to create post. Please try again.'
      });
    }
  };

  const handleReset = () => {
    setText('');
    setClassification(null);
    setShowPreview(false);
    setError(null);
  };

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

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Create a Post</h2>
      </div>

      {!showPreview ? (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's happening at IIIT-Una? Share events, announcements, or lost & found items..."
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Content Issue</p>
                  <p className="text-red-700 text-sm mt-1">{error.message}</p>
                  {error.suggestion && (
                    <div className="mt-2">
                      <p className="text-red-700 text-sm font-medium">Suggested rewrite:</p>
                      <p className="text-red-600 text-sm italic">"{error.suggestion}"</p>
                      <button
                        onClick={() => setText(error.suggestion)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Use suggestion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              AI will automatically classify your post type
            </p>
            <button
              onClick={handleClassify}
              disabled={!text.trim() || isClassifying}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isClassifying ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isClassifying ? 'Classifying...' : 'Preview Post'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTypeIcon(classification.type)}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(classification.type)}`}>
                  {classification.type ? classification.type.replace('_', ' & ') : 'Unknown'}
                </span>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">
              {classification.title || 'Post Preview'}
            </h3>
            <p className="text-gray-700 mb-3">{classification.description}</p>

            {classification.type === 'MEME' && classification.imageUrl && (
              <img
                src={classification.imageUrl}
                alt="Generated meme"
                className="w-full rounded-lg border mb-3"
              />
            )}

            {classification.type === 'EVENT' && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {classification.location && (
                  <div>
                    <span className="font-medium text-gray-600">Location:</span>
                    <p className="text-gray-900">{classification.location}</p>
                  </div>
                )}
                {classification.date && (
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <p className="text-gray-900">{classification.date}</p>
                  </div>
                )}
                {classification.time && (
                  <div>
                    <span className="font-medium text-gray-600">Time:</span>
                    <p className="text-gray-900">{classification.time}</p>
                  </div>
                )}
              </div>
            )}

            {classification.type === 'LOST_AND_FOUND' && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {classification.item && (
                  <div>
                    <span className="font-medium text-gray-600">Item:</span>
                    <p className="text-gray-900">{classification.item}</p>
                  </div>
                )}
                {classification.lastLocation && (
                  <div>
                    <span className="font-medium text-gray-600">Last Location:</span>
                    <p className="text-gray-900">{classification.lastLocation}</p>
                  </div>
                )}
                {classification.contactInfo && (
                  <div>
                    <span className="font-medium text-gray-600">Contact:</span>
                    <p className="text-gray-900">{classification.contactInfo}</p>
                  </div>
                )}
              </div>
            )}

            {classification.type === 'ANNOUNCEMENT' && classification.department && (
              <div className="text-sm">
                <span className="font-medium text-gray-600">Department:</span>
                <p className="text-gray-900">{classification.department}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Edit Post
            </button>
            <button
              onClick={handlePost}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>Publish Post</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreator;
