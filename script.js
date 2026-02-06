// Video Data (Extracted from provided URLs)
const playlistData = [
    {
        id: "10TolCt3cCNhbfbnRqfOp8dcRu2vnTz45",
        title: "Google Drive Video 1 - Cinematic Nature",
        channel: "Nature Channel",
        views: "54K views",
        time: "1 day ago"
    },
    {
        id: "1FVz-Y-jnOrFiQFTurRoZ5VS_zObhSdQT",
        title: "Google Drive Video 2 - Urban Exploration",
        channel: "City Vibes",
        views: "120K views",
        time: "3 days ago"
    },
    {
        id: "1l2_iT7GoXs8Solhtk_SZOAnxvKQ-q6RD",
        title: "Google Drive Video 3 - Tech Review 2024",
        channel: "Tech Daily",
        views: "8.5K views",
        time: "5 hours ago"
    },
    {
        id: "1eiclMj2CN2MUTYgOUsYn3UXOF4kV0TlF",
        title: "Google Drive Video 4 - Coding Tutorial",
        channel: "Dev Mastery",
        views: "2M views",
        time: "1 year ago"
    }
];

let currentIndex = 0;
const videoPlayer = document.getElementById('mainVideo');
const titleElement = document.getElementById('videoTitle');
const playlistContainer = document.getElementById('playlistContainer');
const searchInput = document.getElementById('searchInput');
const speedControl = document.getElementById('playbackSpeed');

// Helper: Convert Drive View URL to Stream URL
function getDriveStreamUrl(fileId) {
    // Uses the standard Drive export=download endpoint which browsers can often stream directly
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

// Helper: Generate a placeholder thumbnail using video ID (pseudo-random color)
function getThumbnail(id) {
    // In a real app, you would fetch the thumbnail from Drive API.
    // Here we use a placeholder service with text.
    return `https://via.placeholder.com/320x180/333/fff?text=Video+${id.substring(0,4)}`;
}

// 1. Initialize Player
function loadVideo(index) {
    if (index >= playlistData.length) index = 0; // Loop back to start
    if (index < 0) index = playlistData.length - 1;

    currentIndex = index;
    const video = playlistData[index];

    // Update Player Source
    const streamUrl = getDriveStreamUrl(video.id);
    videoPlayer.src = streamUrl;
    
    // Update Info
    titleElement.textContent = video.title;
    document.title = `${video.title} - DriveTube`;

    // Highlight current in playlist
    renderPlaylist();
    
    // Play (Browser policy may block audio autoplay, muted is safer but we try normal)
    videoPlayer.play().catch(e => console.log("Autoplay blocked until user interaction"));
}

// 2. Render Playlist (Sidebar)
function renderPlaylist(filterText = '') {
    playlistContainer.innerHTML = '';
    
    playlistData.forEach((video, index) => {
        // Search Filter
        if (filterText && !video.title.toLowerCase().includes(filterText.toLowerCase())) {
            return;
        }

        const card = document.createElement('div');
        card.className = `video-card ${index === currentIndex ? 'playing' : ''}`;
        card.onclick = () => loadVideo(index);

        card.innerHTML = `
            <div class="thumbnail">
                <img src="${getThumbnail(video.id)}" alt="thumb">
            </div>
            <div class="card-info">
                <div class="card-title">${video.title}</div>
                <div class="card-channel">${video.channel}</div>
                <div class="card-channel">${video.views} • ${video.time}</div>
            </div>
        `;
        playlistContainer.appendChild(card);
    });
}

// 3. Event Listeners

// Auto-Next Video Detection
videoPlayer.addEventListener('ended', () => {
    console.log("Video ended, playing next...");
    loadVideo(currentIndex + 1);
});

// Search Functionality
searchInput.addEventListener('input', (e) => {
    renderPlaylist(e.target.value);
});

// Playback Speed Control
speedControl.addEventListener('change', (e) => {
    videoPlayer.playbackRate = parseFloat(e.target.value);
});

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
    renderPlaylist();
    // Load first video but don't auto-play immediately to save bandwidth/policy until user clicks
    // Or call loadVideo(0) if immediate play is desired.
    loadVideo(0); 
});
