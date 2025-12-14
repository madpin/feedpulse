import { db, closeConnection } from './index.js';
import { users, categories, tags } from './schema/index.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Create admin user
  const adminPassword = await bcrypt.hash('madpin123', 10);
  const [adminUser] = await db.insert(users).values({
    email: 'madpin@gmail.com',
    passwordHash: adminPassword,
    displayName: 'Admin',
    role: 'admin',
    points: 1000,
  }).onConflictDoNothing().returning();
  
  console.log('✅ Created admin user:', adminUser?.email || 'already exists');
  
  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 12);
  const [demoUser] = await db.insert(users).values({
    email: 'demo@feedpulse.com',
    passwordHash: demoPassword,
    displayName: 'Demo User',
    role: 'user',
    points: 100,
    bio: 'A demo user for testing FeedPulse.',
  }).onConflictDoNothing().returning();
  
  console.log('✅ Created demo user:', demoUser?.email || 'already exists');
  
  // Create categories
  const categoryData = [
    { name: 'Technology', slug: 'technology', description: 'Tech news, programming, and software development' },
    { name: 'Programming', slug: 'programming', description: 'Coding tutorials and programming languages' },
    { name: 'Web Development', slug: 'web-development', description: 'Frontend, backend, and full-stack development' },
    { name: 'AI & Machine Learning', slug: 'ai-ml', description: 'Artificial intelligence and machine learning' },
    { name: 'News', slug: 'news', description: 'General news and current events' },
    { name: 'World News', slug: 'world-news', description: 'International news coverage' },
    { name: 'Science', slug: 'science', description: 'Scientific discoveries and research' },
    { name: 'Business', slug: 'business', description: 'Business news and entrepreneurship' },
    { name: 'Finance', slug: 'finance', description: 'Financial markets and investing' },
    { name: 'Entertainment', slug: 'entertainment', description: 'Movies, music, and pop culture' },
    { name: 'Gaming', slug: 'gaming', description: 'Video games and gaming industry' },
    { name: 'Sports', slug: 'sports', description: 'Sports news and analysis' },
    { name: 'Health', slug: 'health', description: 'Health, wellness, and medicine' },
    { name: 'Design', slug: 'design', description: 'UI/UX, graphic design, and creativity' },
    { name: 'Podcasts', slug: 'podcasts', description: 'Podcast feeds and audio content' },
  ];
  
  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  console.log('✅ Created categories');
  
  // Create tags
  const tagData = [
    { name: 'javascript', slug: 'javascript' },
    { name: 'python', slug: 'python' },
    { name: 'react', slug: 'react' },
    { name: 'ai', slug: 'ai' },
    { name: 'startup', slug: 'startup' },
    { name: 'tutorial', slug: 'tutorial' },
    { name: 'news', slug: 'news' },
    { name: 'opinion', slug: 'opinion' },
    { name: 'open-source', slug: 'open-source' },
    { name: 'security', slug: 'security' },
    { name: 'devops', slug: 'devops' },
    { name: 'cloud', slug: 'cloud' },
    { name: 'typescript', slug: 'typescript' },
    { name: 'nodejs', slug: 'nodejs' },
    { name: 'database', slug: 'database' },
  ];
  
  for (const tag of tagData) {
    await db.insert(tags).values(tag).onConflictDoNothing();
  }
  console.log('✅ Created tags');
  
  console.log('🎉 Seeding complete!');
}

seed()
  .catch(console.error)
  .finally(() => closeConnection());
