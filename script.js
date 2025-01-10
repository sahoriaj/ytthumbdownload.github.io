function showThumbnail() {
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = videoUrl.match(regex);

    if (match) {
        const videoId = match[1];
        const resolutions = {
            'Max Resolution': `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            'High Quality': `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            'Medium Quality': `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            'Low Quality': `https://img.youtube.com/vi/${videoId}/default.jpg`,
        };

        const resolutionLinks = document.getElementById('resolutionLinks');
        resolutionLinks.innerHTML = Object.entries(resolutions)
            .map(([label, url]) => `
                <a href="${url}" download="${label.replace(/\s+/g, '_')}.jpg" style="display: block; margin: 10px 0; padding: 10px; background-color: #007bff; color: white; text-align: center; text-decoration: none; border-radius: 5px;">
                    Download ${label}
                </a>
            `)
            .join('');
    } else {
        alert('Invalid YouTube video URL. Please enter a valid URL.');
    }
}
