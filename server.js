import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import { auth } from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'artifi',
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
})
.then(() => console.log('✅ Connected to MongoDB successfully'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Verify API token exists
if (!process.env.REPLICATE_API_TOKEN) {
    console.error('ERROR: REPLICATE_API_TOKEN is not set in .env file');
    process.exit(1);
}

// Auth routes
app.use('/api/auth', authRoutes);

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Protected route - requires authentication
app.post('/generate', auth, async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ 
                success: false, 
                error: 'Prompt is required' 
            });
        }

        console.log('Generating image for prompt:', prompt);
        
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: prompt,
                    negative_prompt: "ugly, blurry, poor quality, distorted",
                    num_inference_steps: 50,
                    guidance_scale: 7.5
                }
            }
        );

        console.log('Generated image URL:', output[0]);

        if (!output || !output[0]) {
            throw new Error('No image URL received from Replicate');
        }

        res.json({ success: true, imageUrl: output[0] });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'An error occurred while generating the image' 
        });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 Open http://localhost:${port} in your browser`);
});
