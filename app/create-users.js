// Bulk create 1000 users using Supabase Admin API
// Run this with Node.js: node create-users.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iiikiukseaoqyymogsxk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaWtpdWtzZWFvcXl5bW9nc3hrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE1NTI2OSwiZXhwIjoyMDY5NzMxMjY5fQ.ZmvsFgctv2ug7NtodgkWgiZEWqXaghtNzP-fkxgw2Q8'; // Use service role key, not anon key!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Sample data arrays
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River',
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William',
  'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
  'Aria', 'Michael', 'Luna', 'Daniel', 'Grace', 'Matthew', 'Chloe', 'Jackson', 'Penelope', 'Sebastian',
  'Layla', 'Jack', 'Riley', 'Owen', 'Zoey', 'Samuel', 'Nora', 'Carter', 'Lily', 'Wyatt',
  'Eleanor', 'John', 'Hannah', 'Luke', 'Lillian', 'Jayden', 'Addison', 'Dylan', 'Aubrey', 'Grayson',
  'Ellie', 'Levi', 'Stella', 'Isaac', 'Natalie', 'Gabriel', 'Zoe', 'Julian', 'Leah', 'Mateo',
  'Hazel', 'Anthony', 'Violet', 'Jaxon', 'Aurora', 'Lincoln', 'Savannah', 'Joshua', 'Audrey', 'Christopher',
  'Brooklyn', 'Andrew', 'Bella', 'Theodore', 'Claire', 'Caleb', 'Skylar', 'Ryan', 'Lucy', 'Asher',
  'Paisley', 'Nathan', 'Everly', 'Thomas', 'Anna', 'Leo', 'Caroline', 'Isaiah', 'Nova', 'Charles'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'];

const bioTemplates = [
  'Meme enthusiast | Coffee addict ☕',
  'Creating content that makes you smile 😊',
  'Just here for the memes and good vibes',
  'Professional overthinker | Amateur meme creator',
  'Living life one meme at a time',
  'Meme curator | Digital artist',
  'Spreading joy through pixels',
  'Part-time comedian, full-time meme lord',
  'Making the internet a funnier place',
  'Your daily dose of memes starts here',
  'Memes, music, and good times',
  'Creative soul with a sense of humor',
  'Turning thoughts into memes since 2020',
  'Life is better with memes',
  'Meme maker | Joke teller | Vibe creator',
  'Just vibing and creating content',
  'Professional procrastinator | Meme enthusiast',
  'Creating chaos, one meme at a time',
  'Laughing through life',
  'Memes > Everything else'
];

const userTypes = ['registered', 'registered', 'registered', 'registered', 'registered', 
                   'registered', 'registered', 'registered', 'moderator', 'advertiser'];

const profileVisibilities = ['public', 'public', 'public', 'public', 'followers', 'private'];

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createUser(index) {
  // Generate user data ONCE so it's consistent across both tables
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}${randomInt(1000, 99999)}`;
  const email = `${username}@memeverse.com`;
  const userType = randomItem(userTypes);
  const bio = Math.random() > 0.3 ? randomItem(bioTemplates) : null;
  const profileVisibility = randomItem(profileVisibilities);

  try {
    // Create user in auth.users using admin API
    // IMPORTANT: Store the same first_name and last_name in user_metadata
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: {
        first_name: firstName,  // ✅ These will match user_profiles
        last_name: lastName,     // ✅ These will match user_profiles
        username: username
      }
    });

    if (authError) {
      console.error(`Error creating user ${index}:`, authError.message);
      return null;
    }

    // Create profile in user_profiles with THE SAME names
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        username: username,
        first_name: firstName,    // ✅ Same as auth.users metadata
        last_name: lastName,      // ✅ Same as auth.users metadata
        bio: bio,
        avatar_url: Math.random() > 0.4 ? `https://i.pravatar.cc/150?u=${authData.user.id}` : null,
        user_type: userType,
        is_active: Math.random() > 0.05,
        email_verified: Math.random() > 0.1,
        profile_visibility: profileVisibility,
        total_smiles_received: randomInt(0, 5000),
        total_memes_created: randomInt(0, 500),
        leaderboard_points: randomInt(0, 10000)
      });

    if (profileError) {
      console.error(`Error creating profile for user ${index}:`, profileError.message);
      // If profile creation fails, we should ideally delete the auth user
      // but for simplicity, we'll just log it
      return null;
    }

    return { email, username, firstName, lastName };
  } catch (error) {
    console.error(`Exception creating user ${index}:`, error.message);
    return null;
  }
}

async function createUsersInBatches(totalUsers = 1000, batchSize = 10) {
  console.log(`Starting to create ${totalUsers} users in batches of ${batchSize}...`);
  console.log(`Each user will have matching names in both auth.users and user_profiles`);
  
  let created = 0;
  let failed = 0;

  for (let i = 0; i < totalUsers; i += batchSize) {
    const batch = [];
    const currentBatchSize = Math.min(batchSize, totalUsers - i);
    
    for (let j = 0; j < currentBatchSize; j++) {
      batch.push(createUser(i + j + 1));
    }

    const results = await Promise.all(batch);
    
    results.forEach(result => {
      if (result) {
        created++;
        // Optionally log first few users to verify
        if (created <= 3) {
          console.log(`✓ Created: ${result.firstName} ${result.lastName} (${result.email})`);
        }
      } else {
        failed++;
      }
    });

    console.log(`Progress: ${created + failed}/${totalUsers} (${created} created, ${failed} failed)`);
    
    // Small delay between batches to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ Finished! Created ${created} users, ${failed} failed.`);
  console.log(`All users have matching names in auth.users (user_metadata) and user_profiles!`);
}

// Run the script
createUsersInBatches(1000, 10);