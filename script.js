document.getElementById('streaming-title').textContent = streamingId;
const episodesList = document.getElementById('episodes-list');
const form = document.getElementById('streaming-form');
const output = document.getElementById('output');

function validateEpisodeInput(input) {
    const validationMessage = document.getElementById('episode-validation');
    const episodeNum = parseInt(input.value);
    const maxEp = parseInt(maxEpisode);

    if (isNaN(episodeNum) || episodeNum < 1) {
        input.classList.add('invalid-input');
        validationMessage.textContent = "Episode harus lebih dari 0";
        validationMessage.style.display = 'block';
        return false;
    } else if (maxEp && episodeNum > maxEp) {
        input.classList.add('invalid-input');
        validationMessage.textContent = `Episode maksimal adalah ${maxEp}`;
        validationMessage.style.display = 'block';
        return false;
    } else {
        input.classList.remove('invalid-input');
        validationMessage.style.display = 'none';
        return true;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('streaming-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const title = document.getElementById('title').value;
        const episode = document.getElementById('episode').value;
        const resolutionGroups = document.querySelectorAll('.resolution-group');
        
        // Validate episode input
        if (!validateEpisodeInput(document.getElementById('episode'))) {
            return;
        }

        // Create or update episode data
        let episodeData = streamingFiles.find(ep => ep.episode === episode);
        if (!episodeData) {
            episodeData = {
                'title': title,
                'episode': episode,
                'files': []
            };
            streamingFiles.push(episodeData);
        }

        // Add files from all resolution groups
        episodeData.files = [];
        resolutionGroups.forEach(group => {
            const label = group.querySelector('input[placeholder="e.g. Gdrive 480p"]').value;
            const url = group.querySelector('input[type="url"]').value;
            const language = group.querySelector('.language-input').value;

            episodeData.files.push({
                0: label,
                1: url,
                2: language
            });
        });

        // Sort episodes numerically
        streamingFiles.sort((a, b) => parseInt(a.episode) - parseInt(b.episode));
        
        // Save to history
        saveHistory();
        
        // Update UI
        renderEpisodes();
        updateOutput();
        
        // Reset form
        form.reset();
        
        // Reset resolution inputs to initial state
        const resolutionInputs = document.getElementById('resolution-inputs');
        const initialGroup = resolutionInputs.querySelector('.resolution-group').cloneNode(true);
        resolutionInputs.innerHTML = '';
        resolutionInputs.appendChild(initialGroup);
    });
});

function renderEpisodes() {
    episodesList.innerHTML = '';
    streamingFiles.forEach(ep => {
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'episode';
        episodeDiv.innerHTML = `
            <h2>Episode ${ep.episode}: ${ep.title}</h2>
            <div class="files-container">
                ${ep.files.map(file => `
                    <div class="file-entry">
                        <p>
                            <strong>${file[0]}</strong> (${file[2].toUpperCase()})
                            <span class="delete-btn" onclick="deleteFile('${ep.episode}', '${file[0]}')">×</span>
                        </p>
                    </div>
                `).join('')}
            </div>
        `;
        episodesList.appendChild(episodeDiv);
    });
}

function deleteFile(episode, label) {
    const episodeData = streamingFiles.find(ep => ep.episode === episode);
    if (episodeData) {
        episodeData.files = episodeData.files.filter(file => file[0] !== label);
        if (episodeData.files.length === 0) {
            streamingFiles = streamingFiles.filter(ep => ep.episode !== episode);
        }
        saveHistory();
        renderEpisodes();
        updateOutput();
    }
}

function updateOutput() {
    const outputStr = `let streamingFiles = ${JSON.stringify(streamingFiles, null, 2)},
streamingId = '${streamingId}',
postId = '${postId}',
maxEpisode = '${maxEpisode}';`;
    output.value = outputStr;
}

function copyOutput() {
    output.select();
    document.execCommand('copy');
    alert('Copied to clipboard!');
}

function validateUrlInput(input) {
    const url = input.value;
    try {
        new URL(url);
        input.classList.remove('invalid-input');
        return true;
    } catch (e) {
        input.classList.add('invalid-input');
        return false;
    }
}

function addResolutionInput() {
    const container = document.getElementById('resolution-inputs');
    const newGroup = document.createElement('div');
    newGroup.className = 'resolution-group';
    newGroup.innerHTML = `
        <label>Label: <input type="text" class="label-input" placeholder="e.g. Gdrive 480p" required></label><br>
        <label>URL: <input type="url" class="url-input" placeholder="YouTube embed URL" required></label><br>
        <label>Bahasa: 
            <select class="language-input" required>
                <option value="sub">sub</option>
                <option value="dub">dub</option>
            </select>
        </label>
        <button type="button" class="delete-resolution" onclick="this.parentElement.remove()">Hapus</button><br>
    `;
    container.appendChild(newGroup);
    const urlInput = newGroup.querySelector('.url-input');
    urlInput.addEventListener('change', (e) => validateUrlInput(e.target));
}

function clearHistory() {
    if (confirm('Are you sure you want to clear history for ' + streamingId + '?')) {
        localStorage.removeItem(streamingId);
        streamingFiles = [];
        renderEpisodes();
        updateOutput();
    }
}

function exportHistory() {
    const dataStr = localStorage.getItem(streamingId);
    if (!dataStr) return;
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${streamingId}_history.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importHistory(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            streamingFiles = data.streamingFiles || [];
            postId = data.postId || '';
            maxEpisode = data.maxEpisode || '12';
            saveHistory();
            renderEpisodes();
            updateOutput();
            alert('History imported successfully!');
        } catch (error) {
            alert('Error importing history: ' + error.message);
        }
    };
    reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', loadHistory);
