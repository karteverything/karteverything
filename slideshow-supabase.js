console.log("slideshow-supabase.js loaded");

document.addEventListener("DOMContentLoaded", async () => {
  const slideshowContainer = document.querySelector(".slideshow-container");
  const dotsContainer = document.querySelector(".dots-container");

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

    // Count existing static slides
    const existingSlides = document.querySelectorAll(".mySlides").length;

    data.forEach((item, index) => {
      const slideNumber = existingSlides + index + 1;

      const slide = document.createElement("div");
      slide.classList.add("mySlides", "fade");
      slide.innerHTML = `
        <div class="numbertext">${slideNumber} / ${existingSlides + data.length}</div>
        <img src="${item.image_url}" alt="${item.title || ''}" style="width:100%">
        <div class="text">${item.title || ''}</div>
      `;
      slideshowContainer.appendChild(slide);

      const dot = document.createElement("span");
      dot.classList.add("dot");
      dot.setAttribute("onclick", "currentSlide(" + slideNumber + ")");
      dotsContainer.appendChild(dot);
    });

    console.log("Supabase slideshow images added.");
  } catch (err) {
    console.error("Error loading Supabase images:", err.message);
  }
});
