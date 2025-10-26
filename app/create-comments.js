// Bulk create comments for memes
// Run this with Node.js: node create-comments.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iiikiukseaoqyymogsxk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWtpdWtzZWFvcXl5bW9nc3hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE1NTI2OSwiZXhwIjoyMDY5NzMxMjY5fQ.ZmvsFgctv2ug7NtodgkWgiZEWqXaghtNzP-fkxgw2Q8';


const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Comment templates - realistic meme comments
const commentTemplates = [
  "This is hilarious! 😂",
  "I felt this in my soul",
  "Why is this so accurate lmao",
  "Tag someone who needs to see this",
  "This made my day",
  "I'm crying 💀",
  "Relatable af",
  "This hits different",
  "No cap this is funny",
  "The accuracy is scary",
  "I can't unsee this now",
  "Best meme I've seen today",
  "This is perfect 👌",
  "Literally me every day",
  "I'm dead 😭",
  "Pure gold",
  "This is art",
  "Why did I laugh so hard at this",
  "Sending this to everyone",
  "Quality content right here",
  "This deserves more attention",
  "Mood",
  "Big mood energy",
  "Facts",
  "No lies detected",
  "Spitting facts",
  "Can't argue with that",
  "This speaks to me",
  "I've never related to something more",
  "Why you gotta call me out like this",
  "Stop exposing me",
  "I'm in this picture and I don't like it",
  "Personal attack",
  "How did you get this footage of me",
  "This is the one",
  "Elite humor",
  "Top tier content",
  "Underrated post",
  "This needs more love",
  "Saved for later",
  "Sending this to my group chat",
  "My friends need to see this",
  "Tag yourself I'm [random]",
  "When will my life be this interesting",
  "Story of my life",
  "Every single time",
  "Without fail",
  "Clockwork",
  "This is a whole vibe",
  "Living for this",
  "Chef's kiss",
  "Perfection",
  "This is it. This is the tweet",
  "Nothing has ever been more true",
  "The realest thing I've seen",
  "I have no words",
  "Speechless",
  "Iconic",
  "Legendary",
  "A masterpiece",
  "Peak comedy",
  "Comedy gold",
  "I'm howling",
  "I'm screaming",
  "Stop it 😭😭",
  "Not this again",
  "Here we go",
  "Oh no",
  "Oh yes",
  "Absolutely",
  "100%",
  "Real",
  "Valid",
  "Based",
  "W post",
  "L take (but funny)",
  "Controversial but true",
  "Say it louder for the people in the back",
  "THIS!!!",
  "Exactly this",
  "You get it",
  "Finally someone said it",
  "Thank you for this",
  "Needed this today",
  "This made me smile",
  "Wholesome",
  "Blessed image",
  "Cursed image",
  "Blursed",
  "Delete this",
  "How do I unsee this",
  "What have you brought upon this cursed land",
  "Thanks I hate it",
  "r/TIHI",
  "This ain't it chief",
  "That's enough internet for today",
  "Time to log off",
  "Yep that's my cue to leave"
];

// Reply templates - shorter, more conversational
const replyTemplates = [
  "lol same",
  "fr fr",
  "real talk",
  "facts",
  "so true",
  "right?!",
  "exactly",
  "this!",
  "yes!",
  "agreed",
  "100%",
  "mood",
  "felt that",
  "no cap",
  "for real",
  "literally",
  "same energy",
  "big facts",
  "say it louder",
  "period",
  "yup",
  "accurate",
  "relatable",
  "can confirm",
  "been there",
  "every time",
  "always",
  "without fail",
  "clockwork",
  "you're not wrong",
  "fair point",
  "valid",
  "based",
  "W take",
  "nah you're right",
  "I see it",
  "makes sense",
  "true that",
  "couldn't agree more",
  "preach",
  "louder!",
  "THIS",
  "😂😂😂",
  "💀💀",
  "🔥🔥",
  "👌👌",
  "🎯",
  "📠 no printer",
  "straight facts"
];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getAllMemes() {
  console.log('Fetching all memes...');
  
  const { data, error } = await supabase
    .from('meme')
    .select('meme_id, creator_id')
    .eq('is_published', true);
  
  if (error) {
    console.error('Error fetching memes:', error);
    return [];
  }
  
  console.log(`✓ Found ${data.length} memes`);
  return data;
}

async function getAllUsers() {
  console.log('Fetching all users...');
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  console.log(`✓ Found ${data.length} users`);
  return data;
}

async function createComment(memeId, userId, content, parentCommentId = null) {
  try {
    const { data, error } = await supabase
      .from('comment')
      .insert({
        meme_id: memeId,
        user_id: userId,
        parent_comment_id: parentCommentId,
        content: content
      })
      .select('comment_id')
      .single();
    
    if (error) {
      console.error('Error creating comment:', error.message);
      return null;
    }
    
    return data.comment_id;
  } catch (error) {
    console.error('Exception creating comment:', error.message);
    return null;
  }
}

async function updateMemeCommentCount(memeId, count) {
  try {
    await supabase
      .from('meme')
      .update({ comments_count: count })
      .eq('meme_id', memeId);
  } catch (error) {
    console.error('Error updating meme comment count:', error);
  }
}

async function createCommentsForMeme(meme, users) {
  // Random number of comments (0-15, weighted towards fewer comments)
  const numComments = Math.random() < 0.3 ? 0 : randomInt(1, 15);
  
  if (numComments === 0) return 0;
  
  const commentIds = [];
  let totalComments = 0;
  
  // Create main comments
  for (let i = 0; i < numComments; i++) {
    // Pick random user (but not the meme creator - people usually don't comment on their own memes as much)
    const availableUsers = users.filter(u => u.user_id !== meme.creator_id);
    const randomUser = randomItem(availableUsers.length > 0 ? availableUsers : users);
    const content = randomItem(commentTemplates);
    
    const commentId = await createComment(meme.meme_id, randomUser.user_id, content);
    
    if (commentId) {
      commentIds.push(commentId);
      totalComments++;
    }
  }
  
  // Add replies to some comments (30% chance per comment)
  for (const commentId of commentIds) {
    if (Math.random() < 0.3) {
      const numReplies = randomInt(1, 3);
      
      for (let i = 0; i < numReplies; i++) {
        const randomUser = randomItem(users);
        const replyContent = randomItem(replyTemplates);
        
        const replyId = await createComment(meme.meme_id, randomUser.user_id, replyContent, commentId);
        
        if (replyId) {
          totalComments++;
        }
      }
    }
  }
  
  // Update meme's comment count
  await updateMemeCommentCount(meme.meme_id, totalComments);
  
  return totalComments;
}

async function populateComments() {
  console.log('Starting comment population process...\n');
  
  // Get all memes and users
  const memes = await getAllMemes();
  const users = await getAllUsers();
  
  if (memes.length === 0 || users.length === 0) {
    console.error('Need memes and users to create comments!');
    return;
  }
  
  console.log(`\nCreating comments for ${memes.length} memes...\n`);
  
  let totalCommentsCreated = 0;
  let memesWithComments = 0;
  
  for (let i = 0; i < memes.length; i++) {
    const meme = memes[i];
    const commentsCreated = await createCommentsForMeme(meme, users);
    
    totalCommentsCreated += commentsCreated;
    if (commentsCreated > 0) {
      memesWithComments++;
    }
    
    // Log progress every 100 memes
    if ((i + 1) % 100 === 0) {
      console.log(`Progress: ${i + 1}/${memes.length} memes processed (${totalCommentsCreated} comments created)`);
    }
    
    // Small delay every 50 memes to avoid overwhelming the database
    if ((i + 1) % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n✅ Finished!`);
  console.log(`   Total comments created: ${totalCommentsCreated}`);
  console.log(`   Memes with comments: ${memesWithComments}/${memes.length}`);
  console.log(`   Average comments per meme: ${(totalCommentsCreated / memes.length).toFixed(2)}`);
}

// Run the script
populateComments();