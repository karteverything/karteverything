document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');
  if (!gallery) {
    console.error("Gallery element not found");
    return;
  }

  async function loadPortraits() {
    console.log("Loading portraits...");

    const { data, error } = await window.supabaseClient
      .from('portraits')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error("Error loading portraits:", error.message);
      gallery.innerHTML = "<p>Failed to load portraits.</p>";
      return;
    }

    if (!data || data.length === 0) {
      gallery.innerHTML = "<p>No images found.</p>";
      return;
    }

    gallery.innerHTML = "";

    data.filter(item => item.image_url).forEach(item => {
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
  console.log("Portraits loaded.");
});
