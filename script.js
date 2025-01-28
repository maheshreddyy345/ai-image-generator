document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const username = localStorage.getItem('username');
    if (username) {
        // Add username to the UI
        const container = document.querySelector('.container');
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <span>Welcome, ${username}!</span>
            <button id="logout-btn">Logout</button>
        `;
        container.insertBefore(userInfo, container.firstChild);

        // Add logout functionality
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = '/login.html';
        });
    }

    const generateBtn = document.getElementById('generate-btn');
    const promptInput = document.getElementById('prompt');
    const resultImage = document.getElementById('result-image');
    const loading = document.getElementById('loading');

    // Get the API URL based on the environment
    const API_URL = window.location.origin;

    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            alert('Please enter a description for the image you want to generate.');
            return;
        }

        // Show loading state
        loading.textContent = 'Generating your image... This may take up to 30 seconds.';
        loading.classList.remove('hidden');
        resultImage.classList.add('hidden');
        generateBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            if (!data.success || !data.imageUrl) {
                throw new Error(data.error || 'No image URL received');
            }

            resultImage.src = data.imageUrl;
            resultImage.classList.remove('hidden');
        } catch (error) {
            console.error('Error generating image:', error);
            alert(`Failed to generate image: ${error.message}`);
        } finally {
            loading.textContent = 'Generating...';
            loading.classList.add('hidden');
            generateBtn.disabled = false;
        }
    });

    // Handle image load error
    resultImage.addEventListener('error', () => {
        alert('Failed to load the generated image. Please try again.');
        loading.classList.add('hidden');
        generateBtn.disabled = false;
    });
});
