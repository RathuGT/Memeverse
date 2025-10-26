// Bulk create memes for users
// Run this with Node.js: node create-memes.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://iiikiukseaoqyymogsxk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWtpdWtzZWFvcXl5bW9nc3hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE1NTI2OSwiZXhwIjoyMDY5NzMxMjY5fQ.ZmvsFgctv2ug7NtodgkWgiZEWqXaghtNzP-fkxgw2Q8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Meme title templates
const memeTitles = [
  "When you finally understand the meme",
  "This is fine",
  "Me trying to adult",
  "Monday mornings be like",
  "Peak comedy right here",
  "I made this in 5 minutes",
  "Nobody: ... Me:",
  "It do be like that sometimes",
  "Why is this so accurate",
  "I felt this in my soul",
  "This hits different",
  "Chef's kiss meme",
  "Literally me everyday",
  "Can't stop laughing at this",
  "Big mood energy",
  "The accuracy is scary",
  "This speaks to me",
  "Pure gold content",
  "10/10 would meme again",
  "Perfection achieved",
  "My brain at 3am",
  "When the wifi drops",
  "Living my best life",
  "No thoughts head empty",
  "Chaotic energy",
  "This is art",
  "Relatable content alert",
  "Maximum effort meme",
  "Quality shitpost",
  "Blessed image",
  "Cursed but good",
  "Elite humor only",
  "Galaxy brain moment",
  "Top tier content",
  "Meme of the century",
  "I spent too long on this",
  "Worth the effort",
  "My masterpiece",
  "Fresh off the meme press",
  "Hot take incoming"
];

const memeDescriptions = [
  "This took me way too long to make 😂",
  "Hope you all enjoy this one!",
  "Couldn't resist making this",
  "Tell me you relate to this",
  "First time posting here, be gentle",
  "This deserves more attention",
  "Just vibing with this creation",
  "Made this instead of working lol",
  "Tag someone who needs to see this",
  "This is too real",
  "My contribution to society",
  "You're welcome internet",
  "Thought this would make you smile",
  "Premium content right here",
  "No regrets making this",
  null, // Some memes don't need descriptions
  null,
  null
];

// Category names matching typical meme categories
const categories = [
  'Animals & Pets',
  'Gaming',
  'Movies & TV',
  'Relatable',
  'Wholesome',
  'Dark Humor',
  'Sports',
  'Food',
  'Technology',
  'Music',
  'School & Work',
  'Relationships',
  'Random',
  'Classic Memes'
];

// Tag names
const tags = [
  'funny', 'lol', 'meme', 'comedy', 'humor', 'relatable', 'mood', 
  'same', 'accurate', 'facts', 'truth', 'vibes', 'blessed', 'cursed',
  'wholesome', 'savage', 'lit', 'fire', 'epic', 'legendary', 
  'dank', 'spicy', 'fresh', 'hot', 'trending', 'viral', 'iconic',
  'nostalgia', 'throwback', 'og', 'classic', 'timeless', 'masterpiece'
];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomTags(count = 3) {
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function getOrCreateCategories() {
  console.log('Setting up categories...');
  
  // Get first user to use as creator
  const { data: users } = await supabase
    .from('user_profiles')
    .select('user_id')
    .limit(1);
  
  const creatorId = users[0].user_id;
  const categoryMap = {};
  
  for (const categoryName of categories) {
    // Check if category exists
    const { data: existing } = await supabase
      .from('category')
      .select('category_id, name')
      .eq('name', categoryName)
      .single();
    
    if (existing) {
      categoryMap[categoryName] = existing.category_id;
    } else {
      // Create category
      const { data: newCat, error } = await supabase
        .from('category')
        .insert({
          name: categoryName,
          created_by: creatorId,
          is_active: true,
          is_approved: true
        })
        .select()
        .single();
      
      if (!error && newCat) {
        categoryMap[categoryName] = newCat.category_id;
      }
    }
  }
  
  console.log(`✓ Categories ready: ${Object.keys(categoryMap).length}`);
  return categoryMap;
}

async function getOrCreateTags() {
  console.log('Setting up tags...');
  
  // Get first user to use as creator
  const { data: users } = await supabase
    .from('user_profiles')
    .select('user_id')
    .limit(1);
  
  const creatorId = users[0].user_id;
  const tagMap = {};
  
  for (const tagName of tags) {
    // Check if tag exists
    const { data: existing } = await supabase
      .from('tag')
      .select('tag_id, name')
      .eq('name', tagName)
      .single();
    
    if (existing) {
      tagMap[tagName] = existing.tag_id;
    } else {
      // Create tag
      const { data: newTag, error } = await supabase
        .from('tag')
        .insert({
          name: tagName,
          created_by: creatorId
        })
        .select()
        .single();
      
      if (!error && newTag) {
        tagMap[tagName] = newTag.tag_id;
      }
    }
  }
  
  console.log(`✓ Tags ready: ${Object.keys(tagMap).length}`);
  return tagMap;
}

async function getStorageImages() {
  console.log('Fetching images from storage...');
  
  const { data: files, error } = await supabase
    .storage
    .from('meme-images')
    .list();
  
  if (error) {
    console.error('Error fetching storage images:', error);
    return [];
  }
  
  const imageUrls = files
    .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
    .map(file => {
      const { data } = supabase.storage
        .from('meme-images')
        .getPublicUrl(file.name);
      return data.publicUrl;
    });
  
  console.log(`✓ Found ${imageUrls.length} images in storage`);
  return imageUrls;
}

async function createMeme(userId, imageUrl, categoryMap, tagMap, imageIndex) {
  const categoryName = randomItem(categories);
  const categoryId = categoryMap[categoryName];
  const selectedTags = getRandomTags(randomInt(2, 5));
  
  try {
    // Create the meme
    const { data: meme, error: memeError } = await supabase
      .from('meme')
      .insert({
        creator_id: userId,
        title: randomItem(memeTitles),
        description: randomItem(memeDescriptions),
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        category_id: categoryId,
        file_format: 'jpg',
        dimensions: '1080x1080',
        is_published: true,
        is_featured: Math.random() > 0.95, // 5% featured
        visibility: Math.random() > 0.1 ? 'public' : (Math.random() > 0.5 ? 'unlisted' : 'private'),
        views_count: randomInt(0, 10000),
        smiles_count: randomInt(0, 1000),
        comments_count: randomInt(0, 100),
        shares_count: randomInt(0, 500)
      })
      .select()
      .single();
    
    if (memeError) {
      console.error(`Error creating meme:`, memeError.message);
      return null;
    }
    
    // Add tags to the meme
    const memeTagInserts = selectedTags.map(tagName => ({
      meme_id: meme.meme_id,
      tag_id: tagMap[tagName]
    }));
    
    const { error: tagError } = await supabase
      .from('meme_tag')
      .insert(memeTagInserts);
    
    if (tagError) {
      console.error(`Error adding tags:`, tagError.message);
    }
    
    return meme.meme_id;
  } catch (error) {
    console.error(`Exception creating meme:`, error.message);
    return null;
  }
}

async function createMemesForUsers(memesPerUser = 3) {
  console.log('Starting meme creation process...\n');
  
  // Setup categories and tags
  const categoryMap = await getOrCreateCategories();
  const tagMap = await getOrCreateTags();
  
  // Get images from storage
  const imageUrls = await getStorageImages();
  
  if (imageUrls.length === 0) {
    console.error('No images found in storage! Please upload images first.');
    return;
  }
  
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('user_id, username')
    .eq('is_active', true);
  
  if (usersError || !users) {
    console.error('Error fetching users:', usersError);
    return;
  }
  
  console.log(`\nCreating ${memesPerUser} memes for ${users.length} users...\n`);
  
  let created = 0;
  let failed = 0;
  let imageIndex = 0;
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    for (let j = 0; j < memesPerUser; j++) {
      // Cycle through images
      const imageUrl = imageUrls[imageIndex % imageUrls.length];
      imageIndex++;
      
      const memeId = await createMeme(user.user_id, imageUrl, categoryMap, tagMap, imageIndex);
      
      if (memeId) {
        created++;
      } else {
        failed++;
      }
    }
    
    // Log progress every 50 users
    if ((i + 1) % 50 === 0) {
      console.log(`Progress: ${i + 1}/${users.length} users processed (${created} memes created, ${failed} failed)`);
    }
    
    // Small delay every 20 users to avoid overwhelming the database
    if ((i + 1) % 20 === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n✅ Finished!`);
  console.log(`   Total memes created: ${created}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Users: ${users.length}`);
  console.log(`   Images used: ${imageUrls.length}`);
}

// Run the script - adjust memesPerUser as needed (3 = ~3000 memes total)
createMemesForUsers(3);