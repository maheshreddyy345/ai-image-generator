import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Verify API token exists
if (!process.env.REPLICATE_API_TOKEN) {
    console.error('ERROR: REPLICATE_API_TOKEN is not set in .env file');
    process.exit(1);
}

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

app.post('/generate', async (req, res) => {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
