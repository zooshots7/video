const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://vbkstxlgqducearyzaef.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZia3N0eGxncWR1Y2Vhcnl6YWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA1MzMxNywiZXhwIjoyMDg4NjI5MzE3fQ.IxqY1y6S50DHtlswda6jeNgMVyUu0zaI0RKeu0cFEu4'
);

const ASSETS_DIR = '/Users/vaibu/Downloads/Assests';

let uploadedCount = { videos: 0, audio: 0, images: 0 };
let failedCount = 0;

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.mp4': 'video/mp4', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'
  };
  return types[ext] || 'application/octet-stream';
}

async function uploadFile(localPath, bucket, remotePath) {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(remotePath, fileBuffer, { contentType: getContentType(localPath), upsert: true });
    
    if (error) {
      failedCount++;
      return null;
    }
    
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(remotePath);
    return urlData.publicUrl;
  } catch (e) {
    failedCount++;
    return null;
  }
}

async function insertBroll(name, fileUrl, category) {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    await supabase.from('broll_clips').upsert({
      slug, name, file_url: fileUrl, duration_ms: 5000,
      keywords: [category, 'assets'], resolution: '1080x1920', aspect_ratio: '9:16'
    }, { onConflict: 'slug' });
  } catch (e) {}
}

async function insertSfx(name, fileUrl, sfxType) {
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    await supabase.from('sfx_clips').upsert({
      slug, name, file_url: fileUrl, duration_ms: 2000, sfx_type: sfxType
    }, { onConflict: 'slug' });
  } catch (e) {}
}

function findFiles(dir, extensions) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  function walk(d) {
    try {
      const files = fs.readdirSync(d);
      for (const f of files) {
        const full = path.join(d, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) walk(full);
        else if (extensions.includes(path.extname(f).toLowerCase())) {
          results.push({ path: full, category: path.basename(d) });
        }
      }
    } catch (e) {}
  }
  walk(dir);
  return results;
}

async function main() {
  console.log('Scanning assets...');
  
  const videos = findFiles(ASSETS_DIR, ['.mp4', '.mov']);
  const audios = findFiles(ASSETS_DIR, ['.mp3', '.wav']);
  const images = findFiles(ASSETS_DIR, ['.png', '.jpg', '.jpeg']);
  
  console.log(`Found: ${videos.length} videos, ${audios.length} audio, ${images.length} images`);
  console.log('Uploading...\n');
  
  // Upload videos to broll bucket
  for (let i = 0; i < videos.length; i++) {
    const { path: vPath, category } = videos[i];
    const filename = sanitizeFilename(path.basename(vPath));
    const remotePath = `assets/${category}/${filename}`;
    const url = await uploadFile(vPath, 'broll', remotePath);
    if (url) {
      const name = path.basename(vPath, path.extname(vPath)).replace(/_/g, ' ');
      await insertBroll(name, url, category);
      uploadedCount.videos++;
    }
    if ((i + 1) % 20 === 0) console.log(`Videos: ${i + 1}/${videos.length}`);
  }
  
  // Upload audio to sfx bucket  
  for (let i = 0; i < audios.length; i++) {
    const { path: aPath } = audios[i];
    const filename = sanitizeFilename(path.basename(aPath));
    const remotePath = `assets/${filename}`;
    const url = await uploadFile(aPath, 'sfx', remotePath);
    if (url) {
      const name = path.basename(aPath, path.extname(aPath)).replace(/_/g, ' ');
      await insertSfx(name, url, 'ambient');
      uploadedCount.audio++;
    }
    if ((i + 1) % 20 === 0) console.log(`Audio: ${i + 1}/${audios.length}`);
  }
  
  // Upload images to thumbnails bucket
  for (let i = 0; i < images.length; i++) {
    const { path: iPath, category } = images[i];
    const filename = sanitizeFilename(path.basename(iPath));
    const remotePath = `assets/${category}/${filename}`;
    await uploadFile(iPath, 'thumbnails', remotePath);
    uploadedCount.images++;
    if ((i + 1) % 50 === 0) console.log(`Images: ${i + 1}/${images.length}`);
  }
  
  console.log(`\n✅ Done!`);
  console.log(`   Videos: ${uploadedCount.videos}`);
  console.log(`   Audio: ${uploadedCount.audio}`);
  console.log(`   Images: ${uploadedCount.images}`);
  console.log(`   Failed: ${failedCount}`);
}

main().catch(console.error);
