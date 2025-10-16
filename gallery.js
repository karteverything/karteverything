const galleryDiv = document.getElementById('gallery');

async function loadGallery() {
  // Fetch all portraits from Supabase
  const { data, error } = await supabase
    .from('portraits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    galleryDiv.textContent = "Error loading gallery: " + error.message;
    return;
  }

  if (data.length === 0) {
    galleryDiv.textContent = "No portraits uploaded yet.";
    return;
  }

  // Clear gallery
  galleryDiv.innerHTML = '';

  // Add each image to the page
  data.forEach(item => {
    const container = document.createElement('div');
    container.className = 'portrait';

    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.title;
    img.style.maxWidth = '200px';
    img.style.display = 'block';
    img.style.marginBottom = '5px';

    const title = document.createElement('p');
    title.textContent = item.title;

    container.appendChild(img);
    container.appendChild(title);
    galleryDiv.appendChild(container);
  });
}

// Load gallery on page load
loadGallery();
