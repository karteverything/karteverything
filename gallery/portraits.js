console.log("portraits.js loaded");

async function loadPortraits() {
  const gallery = document.getElementById('gallery');
  if (!gallery) {
    console.error("Gallery element not found");
    return;
  }

  console.log("Loading portraits...");

  // fetch data from Supabase
  const { data, error } = await window.supabaseClient
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

  // clear gallery first
  gallery.innerHTML = "";

  // display each portrait
  data
    .filter(item => item.image_url)
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

// Load portraits after DOM is ready
document.addEventListener('DOMContentLoaded', loadPortraits);
