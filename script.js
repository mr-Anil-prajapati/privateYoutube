const VIDEO_EXTENSIONS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];
const BATCH_SIZE = 16;

const grid = document.getElementById('videoGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const summaryText = document.getElementById('summaryText');
const emptyState = document.getElementById('emptyState');
const loadingOverlay = document.getElementById('loadingOverlay');
const playerModal = document.getElementById('playerModal');
const playerVideo = document.getElementById('playerVideo');
const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const closePlayerBtn = document.getElementById('closePlayer');
const stopPlayerBtn = document.getElementById('stopPlayer');
const scrollSentinel = document.getElementById('scrollSentinel');

let allVideos = [];
let filteredVideos = [];
let loadedCount = 0;
let loading = false;
let observer = null;

/**
 * Wrapper for Dropbox API POST calls using the access token.
 */
async function dropboxApiRequest(endpoint, body) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Dropbox API error ${response.status}: ${errorDetails}`);
    }

    return response.json();
}

/**
 * Returns true when the file name matches a supported video extension.
 */
function isVideoFile(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext);
}

/**
 * Format the numeric size value into a human-readable string.
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}

/**
 * Format a Dropbox file timestamp into a local date string.
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Show or hide the global loading overlay.
 */
function setLoading(active, message = 'Loading videos…') {
    loading = active;
    summaryText.textContent = message;
    loadingOverlay.classList.toggle('hidden', !active);
}

/**
 * Retrieve all files from the Dropbox shared folder using the sharing API.
 */
async function fetchDropboxFolderContents() {
    const sharedFolderUrl = DROPBOX_FOLDER.trim();
    if (!sharedFolderUrl) {
        throw new Error('DROPBOX_FOLDER is not configured in config.js');
    }

    const firstPage = await dropboxApiRequest('https://api.dropboxapi.com/2/sharing/list_shared_link_files', {
        url: sharedFolderUrl,
        path: '',
        recursive: true
    });

    const entries = [...firstPage.entries];
    let nextPage = firstPage;

    while (nextPage.has_more) {
        nextPage = await dropboxApiRequest('https://api.dropboxapi.com/2/sharing/list_shared_link_files/continue', {
            cursor: nextPage.cursor
        });
        entries.push(...nextPage.entries);
    }

    return entries.filter(item => item['.tag'] === 'file' && isVideoFile(item.name)).map(item => ({
        id: item.id,
        name: item.name,
        size: item.size || 0,
        date: item.client_modified || item.server_modified || '',
        path: item.id,
        extension: item.name.split('.').pop().toLowerCase(),
        tempLink: null
    }));
}

/**
 * Create a card element for the video entry.
 */
function createVideoCard(video) {
    const card = document.createElement('article');
    card.className = 'video-card';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-card-button';
    button.addEventListener('click', () => openPlayer(video));

    button.innerHTML = `
        <div class="video-thumb">
            <span class="video-badge">${video.extension.toUpperCase()}</span>
            <span class="preview-icon">▶</span>
        </div>
        <div class="video-info">
            <h3>${video.name}</h3>
            <div class="video-meta">
                <span>${formatDate(video.date)}</span>
                <span>${formatBytes(video.size)}</span>
            </div>
        </div>
    `;

    card.appendChild(button);
    return card;
}

/**
 * Render the next batch of videos when the user scrolls.
 */
function renderNextBatch() {
    if (loading || loadedCount >= filteredVideos.length) {
        return;
    }

    const nextItems = filteredVideos.slice(loadedCount, loadedCount + BATCH_SIZE);
    nextItems.forEach(video => grid.appendChild(createVideoCard(video)));
    loadedCount += nextItems.length;
    updateSummary();

    if (loadedCount >= filteredVideos.length) {
        scrollSentinel.classList.add('hidden');
    }
}

/**
 * Update the visible summary text.
 */
function updateSummary() {
    if (!allVideos.length) {
        summaryText.textContent = 'No videos available in the Dropbox folder.';
        return;
    }

    summaryText.textContent = `Showing ${Math.min(loadedCount, filteredVideos.length)} of ${filteredVideos.length} videos`;
}

/**
 * Sort the filtered videos.
 */
function sortFilteredVideos(method) {
    const [field, direction] = method.split('_');
    filteredVideos.sort((a, b) => {
        let aValue = a[field];
        let bValue = b[field];

        if (field === 'name') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (field === 'date') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Apply search and sort filters to the video list.
 */
function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    filteredVideos = allVideos.filter(video => video.name.toLowerCase().includes(query));
    sortFilteredVideos(sortSelect.value);

    grid.innerHTML = '';
    loadedCount = 0;
    emptyState.classList.toggle('hidden', filteredVideos.length > 0);
    scrollSentinel.classList.toggle('hidden', filteredVideos.length === 0);

    if (filteredVideos.length === 0) {
        summaryText.textContent = query ? 'No videos match your search.' : 'No supported videos found.';
        return;
    }

    renderNextBatch();
}

/**
 * Request a temporary playback link for the video.
 */
async function getTemporaryLink(video) {
    if (video.tempLink) {
        return video.tempLink;
    }

    const response = await dropboxApiRequest('https://api.dropboxapi.com/2/files/get_temporary_link', {
        path: video.path
    });

    video.tempLink = response.link;
    return video.tempLink;
}

/**
 * Open the built-in HTML5 player modal.
 */
async function openPlayer(video) {
    try {
        setLoading(true, `Preparing ${video.name}…`);
        const link = await getTemporaryLink(video);

        playerTitle.textContent = video.name;
        playerMeta.textContent = `${formatDate(video.date)} • ${formatBytes(video.size)}`;
        playerVideo.src = link;

        playerModal.classList.remove('hidden');
        playerModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        await playerVideo.play().catch(() => {
            // Autoplay may be blocked in some browsers.
        });
    } catch (error) {
        console.error('Unable to open player', error);
        alert('Unable to load the video. Please refresh and try again.');
    } finally {
        setLoading(false);
    }
}

/**
 * Close the player and clear the video source.
 */
function closePlayer() {
    playerVideo.pause();
    playerVideo.removeAttribute('src');
    playerVideo.load();
    playerModal.classList.add('hidden');
    playerModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/**
 * Validate the Dropbox configuration values from config.js.
 */
function validateConfig() {
    const missingToken = !DROPBOX_ACCESS_TOKEN || DROPBOX_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN';
    const missingFolder = !DROPBOX_FOLDER || DROPBOX_FOLDER.includes('YOUR_DROPBOX_FOLDER');

    if (missingToken || missingFolder) {
        if (missingToken) {
            summaryText.textContent = 'Configure DROPBOX_ACCESS_TOKEN in config.js to load videos.';
        } else {
            summaryText.textContent = 'Configure DROPBOX_FOLDER in config.js to load videos.';
        }
        emptyState.classList.remove('hidden');
        throw new Error('Missing Dropbox configuration.');
    }
}

/**
 * Initialize the infinite scroll observer and event listeners.
 */
function setupEventListeners() {
    searchInput.addEventListener('input', () => applyFilters());
    sortSelect.addEventListener('change', () => applyFilters());
    closePlayerBtn.addEventListener('click', closePlayer);
    stopPlayerBtn.addEventListener('click', closePlayer);
    playerModal.addEventListener('click', event => {
        if (event.target === playerModal) {
            closePlayer();
        }
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !playerModal.classList.contains('hidden')) {
            closePlayer();
        }
    });

    observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !loading) {
            renderNextBatch();
        }
    }, {
        rootMargin: '250px'
    });

    observer.observe(scrollSentinel);
}

/**
 * Load videos and begin the app.
 */
async function init() {
    setupEventListeners();

    try {
        setLoading(true, 'Fetching Dropbox folder contents…');
        allVideos = await fetchDropboxFolderContents();
        applyFilters();
    } catch (error) {
        console.error('Initialization failed', error);
        summaryText.textContent = 'Unable to load Dropbox videos. Check config.js and access rights.';
        emptyState.classList.remove('hidden');
    } finally {
        setLoading(false);
    }
}

window.addEventListener('DOMContentLoaded', init);
