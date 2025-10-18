console.log("✅ Supabase slideshow loader ready");

async function loadSupabaseSlides() {
  const slideshowContainer = document.querySelector(".slideshow-container");
  const dotsContainer = document.querySelector(".dots-container");

  // count how many slides already exist in your HTML
  const existingSlides = document.querySelectorAll(".mySlides").length;

  try {
    const { data, error } = await supabase
      .from("portraits")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;

    data.forEach((item, index) => {
      const slideNumber = existingSlides + index + 1;

      // create slide
      const newSlide = document.createElement("div");
      newSlide.classList.add("mySlides", "fade");
      newSlide.innerHTML = `
        <div class="numbertext">${slideNumber} / ${existingSlides + data.length}</div>
        <img src="${item.image_url}" style="width:100%">
        <div class="text">${item.title || ""}</div>
      `;
      slideshowContainer.appendChild(newSlide);

      // create dot
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.setAttribute("onclick", `currentSlide(${slideNumber})`);
      dotsContainer.appendChild(dot);
    });

    console.log("Supabase images added to slideshow");
  } catch (err) {
    console.error("Error loading Supabase slideshow:", err.message);
  }
}

loadSupabaseSlides();
