import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function optimizeImages() {
  console.log("Fetching vehicles...");
  const { data: vehicles, error: fetchError } = await supabase
    .from('offers')
    .select('id, make, model, vehicle_image');

  if (fetchError) {
    console.error("Error fetching vehicles:", fetchError);
    return;
  }

  let processedCount = 0;
  let skippedCount = 0;

  for (const vehicle of vehicles) {
    if (!vehicle.vehicle_image) {
      skippedCount++;
      continue;
    }

    const url = vehicle.vehicle_image;

    // Check if it's already a webp or if it's from unsplash
    if (url.includes('.webp') || !url.includes('supabase.co')) {
      skippedCount++;
      continue;
    }

    console.log(`\nProcessing: ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id})`);
    console.log(`Original URL: ${url}`);

    try {
      // Extract bucket and path
      // URL format: https://.../storage/v1/object/public/bucket_name/path/to/file.png
      const parts = url.split('/storage/v1/object/public/');
      if (parts.length < 2) {
        console.log("Could not parse URL, skipping.");
        skippedCount++;
        continue;
      }
      
      const storagePath = parts[1];
      const bucketName = storagePath.substring(0, storagePath.indexOf('/'));
      const filePath = storagePath.substring(storagePath.indexOf('/') + 1);
      
      console.log(`Bucket: ${bucketName}, Path: ${filePath}`);

      // Download the image
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (downloadError) {
        console.error("Error downloading file:", downloadError);
        continue;
      }

      // Convert to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());

      // Use sharp to convert to WebP
      console.log("Converting to WebP with Sharp...");
      const webpBuffer = await sharp(buffer)
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      // New filename
      const parsedPath = path.parse(filePath);
      const newFilePath = `${parsedPath.dir ? parsedPath.dir + '/' : ''}${parsedPath.name}.webp`;
      
      console.log(`Uploading as: ${newFilePath}`);

      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(newFilePath, webpBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        console.error("Error uploading WebP:", uploadError);
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(newFilePath);
        
      const newPublicUrl = publicUrlData.publicUrl;
      console.log(`New public URL: ${newPublicUrl}`);

      // Update vehicle in database
      const { error: updateError } = await supabase
        .from('offers')
        .update({ vehicle_image: newPublicUrl })
        .eq('id', vehicle.id);

      if (updateError) {
        console.error("Error updating database:", updateError);
        continue;
      }

      console.log("Successfully updated vehicle!");
      processedCount++;
    } catch (e) {
      console.error("Exception processing vehicle:", e);
    }
  }

  console.log(`\nOptimization Complete!`);
  console.log(`Processed and converted: ${processedCount} images`);
  console.log(`Skipped: ${skippedCount} images`);
}

optimizeImages();
