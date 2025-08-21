const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let posts = [];
let comments = {};

// AI Classification function
async function classifyPost(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `You are an AI classifier for a university student feed. Classify the following text into one of three categories and extract relevant information:

1. EVENT: Workshops, seminars, competitions, meetings, parties, etc.
2. LOST_AND_FOUND: Lost or found items
3. ANNOUNCEMENT: General announcements, notices, department updates

For each classification, extract relevant fields:
- EVENT: title, description, location, date, time
- LOST_AND_FOUND: item, description, lastLocation, contactInfo
- ANNOUNCEMENT: title, description, department

Respond in JSON format only with the classification and extracted fields.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('AI Classification Result:', result);
    
    // Map the response to expected format
    return {
      type: result.classification || result.type,
      title: result.title,
      description: result.description,
      location: result.location,
      date: result.date,
      time: result.time,
      item: result.item,
      lastLocation: result.lastLocation,
      contactInfo: result.contactInfo,
      department: result.department
    };
  } catch (error) {
    console.error('Classification error:', error);
    return {
      type: 'ANNOUNCEMENT',
      title: 'General Post',
      description: text,
      department: 'General'
    };
  }
}

// Toxicity check function
async function checkToxicity(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `You are a content moderator. Check if the following text contains toxic, harmful, or inappropriate content for a university student platform. 

Respond in JSON format:
{
  "isToxic": boolean,
  "reason": "explanation if toxic",
  "suggestedRewrite": "cleaner version if toxic, otherwise null"
}`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Toxicity check error:', error);
    return { isToxic: false, reason: null, suggestedRewrite: null };
  }
}

// Routes

// Classify post
app.post('/api/classify', async (req, res) => {
  try {
    const { text } = req.body;
    
    // Check toxicity first
    const toxicityCheck = await checkToxicity(text);
    if (toxicityCheck.isToxic) {
      return res.json({
        success: false,
        isToxic: true,
        reason: toxicityCheck.reason,
        suggestedRewrite: toxicityCheck.suggestedRewrite
      });
    }

    // Classify the post
    const classification = await classifyPost(text);
    
    res.json({
      success: true,
      isToxic: false,
      classification
    });
  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({ success: false, error: 'Classification failed' });
  }
});

// Create post
app.post('/api/posts', (req, res) => {
  try {
    const { type, data, originalText } = req.body;
    
    const post = {
      id: uuidv4(),
      type,
      data,
      originalText,
      timestamp: new Date().toISOString(),
      reactions: { like: 0, love: 0, share: 0, laugh: 0 },
      userReactions: {}
    };
    
    posts.unshift(post); // Add to beginning for newest first
    comments[post.id] = [];
    
    res.json({ success: true, post });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

// Get all posts
app.get('/api/posts', (req, res) => {
  res.json({ success: true, posts });
});

// Update post
app.put('/api/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    posts[postIndex].data = { ...posts[postIndex].data, ...data };
    
    res.json({ success: true, post: posts[postIndex] });
  } catch (error) {
    console.error('Post update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update post' });
  }
});

// Delete post
app.delete('/api/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    posts.splice(postIndex, 1);
    delete comments[id];
    
    res.json({ success: true });
  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

// Add reaction
app.post('/api/posts/:id/react', (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, userId = 'anonymous' } = req.body;
    
    const post = posts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    // Toggle reaction
    const userPrevReaction = post.userReactions[userId];
    if (userPrevReaction === reaction) {
      // Remove reaction
      post.reactions[reaction]--;
      delete post.userReactions[userId];
    } else {
      // Remove previous reaction if exists
      if (userPrevReaction) {
        post.reactions[userPrevReaction]--;
      }
      // Add new reaction
      post.reactions[reaction]++;
      post.userReactions[userId] = reaction;
    }
    
    res.json({ success: true, reactions: post.reactions });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ success: false, error: 'Failed to add reaction' });
  }
});

// Get comments for a post
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, comments: comments[id] || [] });
});

// Add comment
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, parentId = null, author = 'Anonymous' } = req.body;
    
    // Check toxicity
    const toxicityCheck = await checkToxicity(text);
    if (toxicityCheck.isToxic) {
      return res.json({
        success: false,
        isToxic: true,
        reason: toxicityCheck.reason,
        suggestedRewrite: toxicityCheck.suggestedRewrite
      });
    }
    
    const comment = {
      id: uuidv4(),
      text,
      author,
      timestamp: new Date().toISOString(),
      parentId,
      replies: []
    };
    
    if (!comments[id]) {
      comments[id] = [];
    }
    
    if (parentId) {
      // Add as reply
      const parentComment = comments[id].find(c => c.id === parentId);
      if (parentComment) {
        parentComment.replies.push(comment);
      }
    } else {
      // Add as top-level comment
      comments[id].push(comment);
    }
    
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// Generate meme (bonus feature)
app.post('/api/generate-meme', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: `Create a funny meme image: ${prompt}`,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });
    
    res.json({ success: true, imageUrl: response.data[0].url });
  } catch (error) {
    console.error('Meme generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate meme' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
