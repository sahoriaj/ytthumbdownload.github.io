// Set current date and time
document.addEventListener('DOMContentLoaded', function(){
  var dt = document.getElementById('datetime');
  if(dt) dt.textContent = 'Last updated: ' + new Date().toLocaleString();
});

function getVideoId(url){
  try{
    const parsed = new URL(url);
    const params = parsed.searchParams;
    if(parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
    if(params.has('v')) return params.get('v');
    const parts = parsed.pathname.split('/');
    return parts[parts.length-1];
  }catch{
    return null;
  }
}

function isLiveURL(url){
  try{
    const parsed = new URL(url);
    return parsed.pathname.includes('/live/');
  }catch{
    return false;
  }
}

async function getVideoTitle(videoId){
  try{
    const apiUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    return data.title || 'Video Title';
  }catch{
    return 'Video Title';
  }
}

function createDownloadButton(imgUrl, filename){
  const btn = document.createElement('button');
  btn.innerHTML = '\u2B07 ' + filename;
  btn.className = 'download';
  btn.onclick = async () => {
    try{
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }catch(err){
      alert('Download failed.');
      console.error(err);
    }
  };
  return btn;
}

async function getThumbnails(){
  const url = document.getElementById('youtubeUrl').value.trim();
  const isLive = isLiveURL(url);
  const videoId = getVideoId(url);
  const container = document.getElementById('thumbnails');
  const titleContainer = document.getElementById('videoTitle');
  container.innerHTML = '';
  titleContainer.innerHTML = 'Fetching title...';

  if(!videoId){
    titleContainer.innerText = '';
    alert('Invalid YouTube URL');
    return;
  }

  const title = await getVideoTitle(videoId);
  titleContainer.innerHTML = isLive
    ? '<span style="background:red;color:#fff;padding:4px 8px;border-radius:4px;font-weight:700;margin-right:8px;display:inline-block">\u25CF LIVE</span> ' + title
    : title;

  const thumbnails = isLive
    ? [{label:'Live Thumbnail (maxresdefault)',file:'maxresdefault'},{label:'Live Preview (hqdefault)',file:'hqdefault'}]
    : [{label:'4K/2K Thumbnail',file:'maxresdefault'},{label:'1080p Thumbnail',file:'hq720'},{label:'720p HD Thumbnail',file:'sddefault'}];

  thumbnails.forEach(t => {
    const imgUrl = `https://img.youtube.com/vi/${videoId}/${t.file}.jpg`;
    const filename = `${videoId}-${t.file}.jpg`;

    const section = document.createElement('div');
    section.className = 'thumbnail-section';

    const h3 = document.createElement('h3');
    h3.innerText = t.label;

    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = t.label;

    const btn = createDownloadButton(imgUrl, filename);

    section.appendChild(h3);
    section.appendChild(btn);
    section.appendChild(document.createElement('br'));
    section.appendChild(img);

    container.appendChild(section);
  });
}

// Translate toggle (keeps included script behavior)
document.addEventListener('DOMContentLoaded', function () {
  const toggleTranslate = document.querySelector('.translate-btn');
  toggleTranslate && toggleTranslate.addEventListener('click', () => alert('Translate widget not active in theme preview. Add Google Translate in layout to enable.'));
});
