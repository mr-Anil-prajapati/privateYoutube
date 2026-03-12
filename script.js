// Convert Dropbox link to raw streaming link
function convertDropboxLink(url) {
    if (url.includes('dropbox.com') && url.includes('?dl=0')) {
        return url.replace('?dl=0', '?raw=1');
    }
    return url;
}

// Load videos from JSON and render
async function loadVideos() {
    try {
        const response = await fetch('videos.json');
        const videos = await response.json();
        renderVideos(videos);
    } catch (error) {
        console.error('Error loading videos:', error);
        document.getElementById('videoGrid').innerHTML = '<p>Error loading videos</p>';
    }
}

// Render video cards
function renderVideos(videos) {
    const grid = document.getElementById('videoGrid');
    grid.innerHTML = '';
    
    videos.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => playVideo(video);
        
        const thumbnail = video.thumbnail || '';
        const thumbnailContent = thumbnail 
            ? `<img src="${thumbnail}" alt="${video.title}" class="video-thumbnail">`
            : `<div class="video-thumbnail">▶️</div>`;
        
        card.innerHTML = `
            ${thumbnailContent}
            <div class="video-info">
                <div class="video-title">${video.title}</div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

// Play selected video
function playVideo(video) {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitle = document.getElementById('videoTitle');
    
    // Convert and set URL
    const streamUrl = convertDropboxLink(video.url);
    videoPlayer.src = streamUrl;
    videoTitle.textContent = video.title;
    
    // Show player
    playerSection.style.display = 'block';
    playerSection.scrollIntoView({ behavior: 'smooth' });
    
    // Auto play
    videoPlayer.play().catch(e => console.log('Auto-play blocked'));
}

// Close player
function closePlayer() {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    
    videoPlayer.pause();
    videoPlayer.src = '';
    playerSection.style.display = 'none';
}

// Initialize
document.addEventListener('DOMContentLoaded', loadVideos);
