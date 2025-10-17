console.log("portraits.js loaded");

const gallery = document.getElementById('gallery');

// fetch portraits from Supabase
async function loadPortraits() {
  console.log("Loading portraits...");

  const { data, error } = await supabase
    .from('portraits')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error("Error loading portraits:", error.message);
    gallery.innerHTML = "<p>Failed to load portraits.</p>";
    return;
  }

  if (data.length === 0) {
    gallery.innerHTML = "<p>No portraits yet.</p>";
    return;
  }

  // display each portrait
  data
  .filter(item => item.image_url) // only include items with image URLs
  .forEach(item => {
    const div = document.createElement('div');
    div.className = "portrait-card";

    div.innerHTML = `
      <img src="${item.image_url}" alt="${item.title}">
      <h3>${item.title}</h3>
    `;
    gallery.appendChild(div);
  });

}

loadPortraits();
