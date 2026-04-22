document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector(".gallery-grid");

  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  if (!window.supabaseClient) {
    console.error("Supabase not initialized.");
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return;

    const shuffled = shuffle(data);

    shuffled.forEach((item) => {
      const card = document.createElement("div");
      card.classList.add("grid-item");

      card.innerHTML = `
        <img src="${item.image_url}" alt="${item.title || ''}">
        <div class="caption">${item.title || ''}</div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error loading images:", err.message);
  }
});