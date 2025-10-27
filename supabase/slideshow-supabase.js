console.log("slideshow-supabase.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const slideshowContainer = document.querySelector(".slideshow-container");

  if (!window.supabaseClient) {
    console.error("Supabase not initialized. Check supabase.js inclusion order.");
    return;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      console.log("No Supabase portraits found.");
      return;
    }

    // count existing static slides
    const existingSlides = document.querySelectorAll(".mySlides").length;

    // append new slides from Supabase
    data.forEach((item) => {
      const slide = document.createElement("div");
      slide.classList.add("mySlides", "fade");
      slide.innerHTML = `
        <img src="${item.image_url}" alt="${item.title || ''}" style="width:100%">
        <div class="text">${item.title || ''}</div>
      `;
      slideshowContainer.appendChild(slide);
    });

    console.log(`Added ${data.length}`);
  } catch (err) {
    console.error("Error loading Supabase images:", err.message);
  }
});
