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

    // append supabase images as slides
    data.forEach((item) => {
      const slide = document.createElement("div");
      slide.classList.add("mySlides", "fade");
      slide.innerHTML = `
        <img src="${item.image_url}" alt="${item.title || ''}" style="width:100%">
        <div class="text">${item.title || ''}</div>
      `;
      slideshowContainer.appendChild(slide);
    });

    console.log(`Added ${data.length} Supabase images`);

    // restart slideshow safely
    // wait to ensure DOM updates are complete
    setTimeout(() => {
      // if showSlides exists, refresh slideshow
      if (typeof showSlides === "function") {
        if (typeof slideIndex === "undefined") {
          window.slideIndex = 1;
        }
        showSlides(slideIndex);
        console.log("Slideshow refreshed with new images");
      } else {
        // fallback: manually display the first slide if slideshow isn't defined
        const slides = document.querySelectorAll(".mySlides");
        if (slides.length > 0) {
          slides.forEach((s, i) => (s.style.display = i === 0 ? "block" : "none"));
          console.log("First Supabase image shown manually");
        }
      }
    }, 300); // short delay for DOM paint

  } catch (err) {
    console.error("Error loading Supabase images:", err.message);
  }
});
