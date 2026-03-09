const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://vbkstxlgqducearyzaef.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZia3N0eGxncWR1Y2Vhcnl6YWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA1MzMxNywiZXhwIjoyMDg4NjI5MzE3fQ.IxqY1y6S50DHtlswda6jeNgMVyUu0zaI0RKeu0cFEu4'
);

async function uploadFile(localPath, bucket, remotePath) {
  const fileBuffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(remotePath, fileBuffer, {
      contentType: getContentType(localPath),
      upsert: true
    });
  
  if (error) {
    console.error(`❌ ${remotePath}: ${error.message}`);
    return null;
  }
  
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(remotePath);
  console.log(`✅ ${remotePath}`);
  return urlData.publicUrl;
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };
  return types[ext] || 'application/octet-stream';
}

async function insertBrollClip(name, fileUrl, durationMs, keywords) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 50);
  const { error } = await supabase.from('broll_clips').upsert({
    slug,
    name,
    file_url: fileUrl,
    duration_ms: durationMs,
    keywords,
    resolution: '1080x1920',
    aspect_ratio: '9:16'
  }, { onConflict: 'slug' });
  if (error) console.error(`DB error for ${name}: ${error.message}`);
}

async function insertSfxClip(name, fileUrl, durationMs, sfxType) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').slice(0, 50);
  const { error } = await supabase.from('sfx_clips').upsert({
    slug,
    name,
    file_url: fileUrl,
    duration_ms: durationMs,
    sfx_type: sfxType
  }, { onConflict: 'slug' });
  if (error) console.error(`DB error for ${name}: ${error.message}`);
}

async function main() {
  const assetsDir = '/Users/vaibu/video/assets/folder2-visualsbylalit';
  
  const videos = [];
  const audios = [];
  
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!file.includes('__MACOSX')) walkDir(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        if (['.mp4', '.mov'].includes(ext)) {
          videos.push(fullPath);
        } else if (['.mp3', '.wav'].includes(ext)) {
          audios.push(fullPath);
        }
      }
    }
  }
  
  walkDir(assetsDir);
  
  console.log(`Found ${videos.length} videos, ${audios.length} audio files`);
  
  // Upload first 15 videos to broll bucket
  for (const videoPath of videos.slice(0, 15)) {
    const filename = path.basename(videoPath);
    const remotePath = `visualsbylalit/${filename}`;
    const url = await uploadFile(videoPath, 'broll', remotePath);
    if (url) {
      const name = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      await insertBrollClip(name, url, 5000, ['visualsbylalit', 'animation']);
    }
  }
  
  // Upload audio files to sfx bucket
  for (const audioPath of audios.slice(0, 10)) {
    const filename = path.basename(audioPath);
    const remotePath = `visualsbylalit/${filename}`;
    const url = await uploadFile(audioPath, 'sfx', remotePath);
    if (url) {
      const name = filename.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      await insertSfxClip(name, url, 3000, 'ambient');
    }
  }
  
  console.log('\nDone! Check Supabase dashboard for uploaded assets.');
}

main().catch(console.error);
